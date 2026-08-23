async function cancelBooking(id){
  const ok=await cloudCancelBooking(id); if(!ok){toast('Falha ao cancelar.');return;}
  const bookings=getBookings().map(b=>b.id===id?{...b,status:'cancelado'}:b);
  saveBookings(bookings); renderAll(); toast('Agendamento cancelado.');
}

function renderMyBookings(){
  const phone=localStorage.getItem('sc_last_phone');
  const all=getBookings().filter(b=>!phone || b.phone===phone).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const el=document.getElementById('myBookings');
  if(!all.length){ el.innerHTML='<div class="card empty">Nenhum agendamento ainda.</div>'; return; }
  el.innerHTML=all.map(b=>`
    <div class="card booking-card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;gap:10px">
        <div><strong>${fmtDate(b.date)} • ${b.time}</strong><div class="muted">${b.serviceName} com ${b.professionalName}</div></div>
        <span class="pill ${b.status==='confirmado'?'status-confirmado':''}">${b.status}</span>
      </div>
      ${b.status!=='cancelado'?`<div class="top-gap"></div><button class="btn danger" onclick="cancelBooking('${b.id}')">Cancelar</button>`:''}
    </div>`).join('');
}
function renderNextBooking(){
  const phone=localStorage.getItem('sc_last_phone');
  const now=new Date().toISOString().slice(0,10);
  const b=getBookings()
    .filter(x=>x.status!=='cancelado' && (!phone || x.phone===phone) && x.date>=now)
    .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0];
  document.getElementById('nextBooking').innerHTML=b?`
    <div class="card">
      <strong>${fmtDate(b.date)} • ${b.time}</strong>
      <div class="muted">${b.serviceName} com ${b.professionalName}</div>
      <div class="top-gap"></div><span class="pill status-confirmado">Confirmado</span>
    </div>`:'<div class="card empty">Você ainda não tem atendimento marcado.</div>';
}

function showClientView(id, btn){
  ['homeView','bookView','professionalView','portfolioView','myBookingsView','profileView'].forEach(x=>document.getElementById(x).classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.querySelectorAll('#clientNav button').forEach(x=>x.classList.remove('active'));
  if(btn) btn.classList.add('active');
  if(id==='bookView') renderSlots();
  if(id==='myBookingsView') renderMyBookings();
  window.scrollTo({top:0,behavior:'smooth'});
}

function showAdminTab(id, btn){
  document.querySelectorAll('.admin-panel').forEach(x=>x.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.admin-tabs button').forEach(x=>x.classList.remove('active'));
  if(btn) btn.classList.add('active');
}

function saveServices(){
  localStorage.setItem('sc_services', JSON.stringify(services));
}
function renderAdminServices(){
  const el=document.getElementById('adminServiceList');
  if(!el) return;
  el.innerHTML=services.map((s,i)=>`
    <div class="editable-item">
      <div>
        <strong>${s.name}</strong>
        <div class="muted">${money(s.price)} • ${s.duration} min</div>
      </div>
      <div class="editable-actions">
        <button class="small-btn" onclick="editService(${i})">Editar</button>
        <button class="small-btn danger" onclick="removeService(${i})">Excluir</button>
      </div>
    </div>`).join('');
}
async function addService(){
  const name=document.getElementById('newServiceName').value.trim();
  const price=Number(document.getElementById('newServicePrice').value || 0);
  const duration=Number(document.getElementById('newServiceDuration').value || 60);
  if(!name){toast('Informe o nome do serviço.');return;}
  let item={id:'srv_'+Date.now(),name,price,duration};
  if(sb){
    if(!currentAdminUser){toast('Faça login.');return;}
    const {data,error}=await sb.from('services').insert({name,price,duration,active:true}).select().single();
    if(error){toast('Erro ao salvar serviço.');return;}
    item={id:data.id,name:data.name,price:Number(data.price),duration:data.duration};
  }
  services.push(item);
  saveServices();
  document.getElementById('newServiceName').value='';
  document.getElementById('newServicePrice').value='';
  document.getElementById('newServiceDuration').value='';
  populateAdmin(); renderAll(); toast('Serviço adicionado.');
}
function editService(i){
  const s=services[i];
  const name=prompt('Nome do serviço:',s.name);
  if(name===null) return;
  const price=prompt('Preço:',s.price);
  if(price===null) return;
  const duration=prompt('Duração em minutos:',s.duration);
  if(duration===null) return;
  services[i]={...s,name:name.trim()||s.name,price:Number(price)||0,duration:Number(duration)||60};
  saveServices(); populateAdmin(); renderAll(); toast('Serviço atualizado.');
}
function removeService(i){
  if(!confirm('Excluir este serviço?')) return;
  services.splice(i,1); saveServices(); populateAdmin(); renderAll(); toast('Serviço excluído.');
}

function savePortfolio(){
  localStorage.setItem('sc_portfolio', JSON.stringify(portfolio));
}
function renderAdminPortfolio(){
  const el=document.getElementById('adminPortfolioList');
  if(!el) return;
  el.innerHTML=portfolio.map((w,i)=>`
    <div class="editable-item">
      <div>
        <strong>${w.title}</strong>
        <div class="muted">${w.category}</div>
      </div>
      <div class="editable-actions">
        <button class="small-btn danger" onclick="removePortfolioItem(${i})">Excluir</button>
      </div>
    </div>`).join('');
}
function previewPortfolioFile(){
  const file=document.getElementById('newWorkFile').files[0];
  const st=document.getElementById('uploadStatus');
  if(!file){st.textContent='Nenhuma foto selecionada.';return;}
  st.textContent='Selecionada: '+file.name;
  document.getElementById('portfolioPreview').style.backgroundImage=`url('${URL.createObjectURL(file)}')`;
}
function previewPortfolioImage(){
  const url=document.getElementById('newWorkImage').value.trim();
  document.getElementById('portfolioPreview').style.backgroundImage=url?`url('${url}')`:'none';
}
async function addPortfolioItem(){
  const title=document.getElementById('newWorkTitle').value.trim();
  const category=document.getElementById('newWorkCategory').value.trim() || 'Trabalho realizado';
  const file=document.getElementById('newWorkFile').files[0];
