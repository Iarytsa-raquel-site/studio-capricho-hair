  let image=document.getElementById('newWorkImage').value.trim();
  if(!title || (!file && !image)){toast('Informe título e selecione uma foto ou URL.');return;}
  if(file && sb){
    if(!currentAdminUser){toast('Faça login para enviar fotos.');return;}
    try{
      document.getElementById('uploadStatus').textContent='Enviando...';
      image=await uploadPortfolioFile(file);
      document.getElementById('uploadStatus').textContent='Enviada com sucesso.';
    }catch(e){toast('Falha no upload.');return;}
  }
  if(sb && currentAdminUser){
    const {error}=await sb.from('portfolio').insert({title,category,image_url:image,instagram_url:'https://www.instagram.com/caprichoohair_/',active:true});
    if(error){toast('Erro ao salvar no portfólio.');return;}
  }
  portfolio.push({title,category,image});
  savePortfolio();
  ['newWorkTitle','newWorkCategory','newWorkImage'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('newWorkFile').value='';
  document.getElementById('uploadStatus').textContent='Nenhuma foto selecionada.';
  previewPortfolioImage(); renderAll(); toast('Foto adicionada ao portfólio.');
}
function removePortfolioItem(i){
  if(!confirm('Excluir esta foto do portfólio?')) return;
  portfolio.splice(i,1); savePortfolio(); renderAll(); toast('Foto removida.');
}

async function saveStudioProfile(){
  studioProfile={
    displayName:document.getElementById('adminDisplayName').value.trim(),
    specialty:document.getElementById('adminSpecialty').value.trim(),
    bio:document.getElementById('adminBio').value.trim(),
    instagram:document.getElementById('adminInstagram').value.trim(),
    address:document.getElementById('adminAddress').value.trim()
  };
  localStorage.setItem('sc_profile',JSON.stringify(studioProfile));
  if(sb && currentAdminUser){
    const r=await sb.from('studio_profile').select('id').limit(1);
    if(r.data?.length) await sb.from('studio_profile').update({
      display_name:studioProfile.displayName,specialty:studioProfile.specialty,bio:studioProfile.bio,
      instagram:studioProfile.instagram,address:studioProfile.address,updated_at:new Date().toISOString()
    }).eq('id',r.data[0].id);
  }
  applyStudioProfile();
  toast('Informações salvas.');
}
function applyStudioProfile(){
  document.querySelectorAll('.js-profile-name').forEach(el=>el.textContent=studioProfile.displayName);
  document.querySelectorAll('.js-profile-specialty').forEach(el=>el.textContent=studioProfile.specialty);
  document.querySelectorAll('.js-profile-bio').forEach(el=>el.textContent=studioProfile.bio);
  document.querySelectorAll('.js-profile-address').forEach(el=>el.textContent=studioProfile.address);
}

function populateAdmin(){
  document.getElementById('quickService').innerHTML=services.map(s=>`<option value="${s.id}">${s.name} — ${money(s.price)}</option>`).join('');
  document.getElementById('quickProfessional').innerHTML=professionals.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
  document.getElementById('quickTime').innerHTML=times.map(t=>`<option>${t}</option>`).join('');
}
function renderAdmin(){
  const bookings=getBookings().filter(b=>b.status!=='cancelado').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  document.getElementById('statBookings').textContent=bookings.length;
  document.getElementById('statRevenue').textContent=money(bookings.reduce((sum,b)=>sum+b.price,0));
  document.getElementById('adminBookings').innerHTML=bookings.length?bookings.map(b=>`
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;gap:12px">
        <div>
          <strong>${fmtDate(b.date)} • ${b.time}</strong>
          <div>${b.clientName}</div>
          <div class="muted">${b.serviceName} • ${b.professionalName}</div>
        </div>
        <div style="text-align:right"><strong>${money(b.price)}</strong><br><span class="pill status-confirmado">${b.status}</span></div>
      </div>
    </div>`).join(''):'<div class="card empty">Nenhum agendamento cadastrado.</div>';
}
async function quickBook(){
  const name=document.getElementById('quickName').value.trim();
  const phone=document.getElementById('quickPhone').value.trim();
  const serviceId=document.getElementById('quickService').value;
  const professionalId=document.getElementById('quickProfessional').value;
  const date=document.getElementById('quickDate').value;
  const time=document.getElementById('quickTime').value;
  if(!name || !phone || !date){ toast('Preencha cliente, WhatsApp e data.'); return; }
  const s=services.find(x=>x.id===serviceId);
  const p=professionals.find(x=>x.id===professionalId);
  if(!isSlotFree(date,professionalId,time,s.duration)){ toast('Esse horário está ocupado.'); return; }
  const booking={
    id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),clientName:name,phone,
    serviceId:s.id,serviceName:s.name,professionalId:p.id,professionalName:p.name,
    date,time,endTime:addMinutes(time,s.duration),price:s.price,status:'confirmado',createdAt:new Date().toISOString()
  };
  const cloud=await cloudCreateBooking(booking);
  if(!cloud.ok){toast('Horário indisponível ou falha na nuvem.');return;}
  if(cloud.id) booking.id=cloud.id;
  const bookings=getBookings();bookings.push(booking);saveBookings(bookings);
  renderAll();
  toast('Agendamento salvo no painel.');
  document.getElementById('quickName').value='';
  document.getElementById('quickPhone').value='';
}

let adminMode=false;
document.getElementById('modeBtn').addEventListener('click',async()=>{
  adminMode=!adminMode;
  document.getElementById('clientApp').classList.toggle('hidden',adminMode);
  document.getElementById('clientNav').classList.toggle('hidden',adminMode);
  document.getElementById('adminApp').classList.toggle('hidden',!adminMode);
  document.getElementById('modeBtn').textContent=adminMode?'Área da Cliente':'Área do Studio';
  if(adminMode){renderAdmin();await checkAdminSession();}
});

document.getElementById('bookingDate').addEventListener('change',renderSlots);

function renderAll(){
  renderPortfolio(); renderServices(); renderProfessionals(); renderSlots();
  renderMyBookings(); renderNextBooking(); renderAdmin();
  renderAdminServices(); renderAdminPortfolio(); applyStudioProfile();
}

const today=new Date();
const minDate=today.toISOString().slice(0,10);
document.getElementById('bookingDate').min=minDate;
document.getElementById('quickDate').min=minDate;
document.getElementById('bookingDate').value=minDate;
document.getElementById('quickDate').value=minDate;
state.date=minDate;

populateAdmin();
document.getElementById('adminDisplayName').value=studioProfile.displayName;
document.getElementById('adminSpecialty').value=studioProfile.specialty;
document.getElementById('adminBio').value=studioProfile.bio;
document.getElementById('adminInstagram').value=studioProfile.instagram;
document.getElementById('adminAddress').value=studioProfile.address;
renderAll();

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js').catch(()=>{});
}
