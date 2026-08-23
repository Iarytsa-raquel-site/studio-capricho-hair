let currentAdminUser = null;
const hasSupabaseConfig =
  window.STUDIO_CONFIG &&
  window.STUDIO_CONFIG.SUPABASE_URL &&
  !window.STUDIO_CONFIG.SUPABASE_URL.includes('COLE_AQUI') &&
  window.STUDIO_CONFIG.SUPABASE_ANON_KEY &&
  !window.STUDIO_CONFIG.SUPABASE_ANON_KEY.includes('COLE_AQUI');
const sb = hasSupabaseConfig
  ? window.supabase.createClient(window.STUDIO_CONFIG.SUPABASE_URL, window.STUDIO_CONFIG.SUPABASE_ANON_KEY)
  : null;

function updateSyncBadge(){
  const dot=document.getElementById('syncDot'), label=document.getElementById('syncText');
  if(sb){dot.classList.add('online');dot.classList.remove('offline');label.textContent='Nuvem';}
  else{dot.classList.add('offline');dot.classList.remove('online');label.textContent='Local';}
}
async function adminLogin(){
  if(!sb){toast('Configure o Supabase para usar o login.');return;}
  const email=document.getElementById('adminEmail').value.trim();
  const password=document.getElementById('adminPassword').value;
  const {data,error}=await sb.auth.signInWithPassword({email,password});
  if(error){toast('E-mail ou senha inválidos.');return;}
  currentAdminUser=data.user; showAdminDashboard(); await cloudLoad(true); toast('Login realizado.');
}
async function adminLogout(){
  if(sb) await sb.auth.signOut();
  currentAdminUser=null; showAdminLogin(); toast('Você saiu da Área do Studio.');
}
async function checkAdminSession(){
  if(!sb){showAdminLogin();return;}
  const {data}=await sb.auth.getSession();
  currentAdminUser=data.session?.user||null;
  currentAdminUser ? showAdminDashboard() : showAdminLogin();
}
function showAdminLogin(){
  document.getElementById('adminLoginView').classList.remove('hidden');
  document.getElementById('adminDashboard').classList.add('hidden');
  document.getElementById('authNote').textContent=sb
    ? 'Use o e-mail e senha cadastrados em Supabase > Authentication > Users.'
    : 'Configure config.js para ativar o login seguro.';
}
function showAdminDashboard(){
  document.getElementById('adminLoginView').classList.add('hidden');
  document.getElementById('adminDashboard').classList.remove('hidden');
}
async function cloudLoad(includeBookings=false){
  if(!sb) return;
  const [sv,pf,pt,pr]=await Promise.all([
    sb.from('services').select('*').eq('active',true).order('created_at'),
    sb.from('professionals').select('*').eq('active',true).order('created_at'),
    sb.from('portfolio').select('*').eq('active',true).order('sort_order'),
    sb.from('studio_profile').select('*').limit(1)
  ]);
  if(sv.data?.length) services=sv.data.map(x=>({id:x.id,name:x.name,price:Number(x.price),duration:x.duration}));
  if(pf.data?.length) professionals=pf.data.map(x=>({id:x.id,name:x.name,specialty:x.specialty||''}));
  if(pt.data?.length) portfolio=pt.data.map(x=>({id:x.id,title:x.title,category:x.category||'Trabalho realizado',image:x.image_url}));
  if(pr.data?.length){
    const x=pr.data[0];
    studioProfile={displayName:x.display_name,specialty:x.specialty||'',bio:x.bio||'',instagram:x.instagram||'',address:x.address||''};
  }
  if(includeBookings && currentAdminUser){
    const bk=await sb.from('bookings').select('*').order('booking_date').order('start_time');
    if(bk.data){
      localStorage.setItem('sc_bookings',JSON.stringify(bk.data.map(x=>({
        id:x.id,clientName:x.client_name,phone:x.phone,serviceId:x.service_id,serviceName:x.service_name,
        professionalId:x.professional_id,professionalName:x.professional_name,date:x.booking_date,
        time:(x.start_time||'').slice(0,5),endTime:(x.end_time||'').slice(0,5),price:Number(x.price),
        status:x.status,createdAt:x.created_at
      }))));
    }
  }
  renderAll();
}
async function cloudCreateBooking(b){
  if(!sb) return {ok:true};
  const {data,error}=await sb.rpc('create_booking_secure',{
    p_client_name:b.clientName,p_phone:b.phone,p_service_id:b.serviceId,p_service_name:b.serviceName,
    p_professional_id:b.professionalId,p_professional_name:b.professionalName,p_booking_date:b.date,
    p_start_time:b.time,p_end_time:b.endTime,p_price:b.price
  });
  if(error) return {ok:false,error};
  return {ok:true,id:data};
}
async function cloudCancelBooking(id){
  if(!sb || !currentAdminUser) return true;
  const {error}=await sb.from('bookings').update({status:'cancelado'}).eq('id',id);
  return !error;
}
async function uploadPortfolioFile(file){
  if(!sb || !currentAdminUser) throw new Error('Login necessário');
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase();
  const path=`portfolio/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const {error}=await sb.storage.from('portfolio').upload(path,file,{cacheControl:'3600'});
  if(error) throw error;
  return sb.storage.from('portfolio').getPublicUrl(path).data.publicUrl;
}

let services = JSON.parse(localStorage.getItem('sc_services') || 'null') || [
  {id:'alisamento', name:'Alisamento', price:180, duration:180},
  {id:'escova', name:'Escova / Finalização', price:70, duration:60},
  {id:'hidratacao', name:'Hidratação', price:90, duration:60},
  {id:'corte', name:'Corte feminino', price:80, duration:60},
  {id:'avaliacao', name:'Avaliação capilar', price:0, duration:30}
];

let professionals = [
  {id:'studio', name:'Studio Capricho', specialty:'Cabeleireira • Especializada em Alisamento'}
];

let portfolio = JSON.parse(localStorage.getItem('sc_portfolio') || 'null') || [
  {title:'Alisamento e finalização', category:'Resultado real', image:'assets/trabalho-01.jpg'},
  {title:'Alinhamento dos fios', category:'Resultado real', image:'assets/trabalho-02.jpg'},
  {title:'Cabelo alinhado e com brilho', category:'Resultado real', image:'assets/trabalho-03.jpg'},
  {title:'Transformação e finalização', category:'Resultado real', image:'assets/trabalho-04.jpg'}
];

const times = ['08:30','09:30','10:30','11:30','13:00','14:00','15:00','16:00','17:00'];

let studioProfile = JSON.parse(localStorage.getItem('sc_profile') || 'null') || {
  displayName:'Studio Capricho | Cabeleireira',
  specialty:'Cabeleireira especializada em Alisamento ✨ Jundiaí',
  bio:'Transformo cabelos e elevo autoestima 💖 Atendimento com hora marcada.',
  instagram:'@caprichoohair_',
  address:'Avenida Presbítero Manoel Antônio Dias Filho, 1420, Jundiaí - SP'
};

let state = {
  service:null,
  professional:null,
  date:null,
  time:null
};

function getBookings(){
  return JSON.parse(localStorage.getItem('sc_bookings') || '[]');
}
function saveBookings(items){
