function renderPortfolio(){
  const card = w => `
    <div class="work-card">
      <div class="work-photo ${w.cls || ''}" style="${w.image ? `background-image:url('${w.image}')` : ''}">
        <span>${w.category}</span>
        <button class="photo-more" onclick="event.stopPropagation(); window.open('https://www.instagram.com/caprichoohair_/','_blank','noopener,noreferrer')">Ver mais ↗</button>
      </div>
      <div class="work-meta"><strong>${w.title}</strong><div class="muted">Trabalho realizado pelo Studio Capricho Hair</div></div>
    </div>`;
  document.getElementById('homePortfolio').innerHTML=portfolio.slice(0,4).map(card).join('');
  document.getElementById('professionalPortfolio').innerHTML=portfolio.slice(0,4).map(card).join('');
  document.getElementById('portfolioFull').innerHTML=portfolio.map(card).join('');
}
function renderServices(){
  const html=services.map(s=>`<div class="card service-card ${state.service===s.id?'selected':''}" onclick="selectService('${s.id}')"><strong>${s.name}</strong><div class="muted">${s.duration} min</div><div class="price">${money(s.price)}</div></div>`).join('');
  document.getElementById('serviceList').innerHTML=html;
  document.getElementById('homeServices').innerHTML=services.slice(0,4).map(s=>`<div class="card"><strong>${s.name}</strong><div class="muted">${s.duration} min</div><div class="price">${money(s.price)}</div></div>`).join('');
}
function renderProfessionals(){document.getElementById('professionalList').innerHTML=professionals.map(p=>`<div class="card pro-card ${state.professional===p.id?'selected':''}" onclick="selectProfessional('${p.id}')"><strong>${p.name}</strong><div class="muted">${p.specialty}</div></div>`).join('');}
function selectService(id){state.service=id;renderServices();renderSlots();}
function selectProfessional(id){state.professional=id;renderProfessionals();renderSlots();}
function renderSlots(){
  state.date=document.getElementById('bookingDate').value||state.date;
  const service=services.find(s=>s.id===state.service),list=document.getElementById('slotList');
  if(!service||!state.professional||!state.date){list.innerHTML='<div class="muted" style="grid-column:1/-1">Escolha serviço, profissional e data.</div>';return;}
  const dow=new Date(state.date+'T12:00:00').getDay();
  if(dow===0||dow===1){list.innerHTML='<div class="muted" style="grid-column:1/-1">Studio fechado aos domingos e segundas-feiras.</div>';return;}
  list.innerHTML=times.map(t=>{const free=isSlotFree(state.date,state.professional,t,service.duration);return `<div class="slot ${!free?'disabled':''} ${state.time===t?'selected':''}" onclick="${free?`selectTime('${t}')`:''}">${t}</div>`;}).join('');
}
function selectTime(t){state.time=t;renderSlots();}
function reviewBooking(){
  state.date=document.getElementById('bookingDate').value;
  const name=document.getElementById('clientName').value.trim(),phone=document.getElementById('clientPhone').value.trim();
  if(!state.service||!state.professional||!state.date||!state.time||!name||!phone){toast('Preencha todas as etapas para continuar.');return;}
  const s=services.find(x=>x.id===state.service),p=professionals.find(x=>x.id===state.professional);
  if(!isSlotFree(state.date,state.professional,state.time,s.duration)){toast('Esse horário acabou de ficar indisponível.');renderSlots();return;}
  document.getElementById('reviewContent').innerHTML=`<div class="summary-line"><span>Cliente</span><strong>${name}</strong></div><div class="summary-line"><span>Serviço</span><strong>${s.name}</strong></div><div class="summary-line"><span>Profissional</span><strong>${p.name}</strong></div><div class="summary-line"><span>Data</span><strong>${fmtDate(state.date)}</strong></div><div class="summary-line"><span>Horário solicitado</span><strong>${state.time}–${addMinutes(state.time,s.duration)}</strong></div><div class="summary-line"><span>Valor</span><strong>${money(s.price)}</strong></div><p class="muted" style="margin-top:12px">O horário será enviado ao Studio e ficará aguardando confirmação.</p>`;
  document.getElementById('reviewCard').classList.remove('hidden');
}
async function confirmBooking(){
  const s=services.find(x=>x.id===state.service),p=professionals.find(x=>x.id===state.professional),name=document.getElementById('clientName').value.trim(),phone=document.getElementById('clientPhone').value.trim();
  if(!isSlotFree(state.date,state.professional,state.time,s.duration)){toast('Horário indisponível. Escolha outro.');renderSlots();return;}
  const booking={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),clientName:name,phone,serviceId:s.id,serviceName:s.name,professionalId:p.id,professionalName:p.name,date:state.date,time:state.time,endTime:addMinutes(state.time,s.duration),price:s.price,status:'pendente',createdAt:new Date().toISOString()};
  const cloud=await cloudCreateBooking(booking);
  if(!cloud.ok){toast('Não foi possível enviar a solicitação. Escolha outro horário.');return;}
  if(cloud.id)booking.id=cloud.id;
  const bookings=getBookings();bookings.push(booking);saveBookings(bookings);localStorage.setItem('sc_last_phone',phone);
  state={service:null,professional:null,date:null,time:null};document.getElementById('reviewCard').classList.add('hidden');
  toast('Solicitação enviada! Aguarde a confirmação do Studio.');renderAll();showClientView('myBookingsView');
}
