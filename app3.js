async function cancelBooking(id){const ok=await cloudCancelBooking(id);if(!ok){toast('Falha ao cancelar.');return;}const bookings=getBookings().map(b=>b.id===id?{...b,status:'cancelado'}:b);saveBookings(bookings);renderAll();toast('Agendamento cancelado.');}
function statusLabel(s){return s==='pendente'?'Aguardando confirmação':s==='confirmado'?'Confirmado':s==='proposta'?'Novo horário sugerido':s==='concluido'?'Concluído':s==='recusado'?'Recusado':s==='cancelado'?'Cancelado':s;}
async function syncClientBookings(){
  if(!sb)return;
  const local=getBookings();
  const ids=local.map(b=>b.id).filter(id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
  if(!ids.length)return;
  const {data,error}=await sb.rpc('get_booking_statuses',{p_ids:ids});
  if(error||!data)return;
  const byId=new Map(data.map(x=>[x.id,x]));
  const updated=local.map(b=>{
    const x=byId.get(b.id);if(!x)return b;
    return {...b,date:x.booking_date,time:(x.start_time||'').slice(0,5),endTime:(x.end_time||'').slice(0,5),serviceName:x.service_name||b.serviceName,professionalName:x.professional_name||b.professionalName,price:Number(x.price),status:x.status,proposedDate:x.proposed_date,proposedTime:(x.proposed_time||'').slice(0,5)};
  });
  saveBookings(updated);
}
async function setBookingStatus(id,status){
  if(!sb||!currentAdminUser){toast('Faça login.');return;}
  const {error}=await sb.from('bookings').update({status}).eq('id',id);if(error){toast('Não foi possível atualizar o agendamento.');return;}
  const bookings=getBookings().map(b=>b.id===id?{...b,status}:b);saveBookings(bookings);renderAll();toast(status==='confirmado'?'Agendamento confirmado.':status==='concluido'?'Atendimento marcado como concluído.':'Solicitação atualizada.');
}
async function suggestAlternative(id){
  if(!sb||!currentAdminUser){toast('Faça login.');return;}
  const b=getBookings().find(x=>x.id===id);if(!b)return;
  const date=prompt('Nova data (AAAA-MM-DD):',b.date);if(!date)return;
  const time=prompt('Novo horário (HH:MM):',b.time);if(!time)return;
  const dow=new Date(date+'T12:00:00').getDay();if(dow===0||dow===1){toast('O Studio não atende domingo ou segunda.');return;}
  if(time<'09:00'||time>'17:00'){toast('Escolha um horário entre 09:00 e 17:00.');return;}
  const {error}=await sb.from('bookings').update({status:'proposta',proposed_date:date,proposed_time:time}).eq('id',id);
  if(error){toast('Não foi possível sugerir outro horário.');return;}
  const bookings=getBookings().map(x=>x.id===id?{...x,status:'proposta',proposedDate:date,proposedTime:time}:x);saveBookings(bookings);renderAll();
  const phone=(b.phone||'').replace(/\D/g,'');
  const brPhone=phone.startsWith('55')?phone:'55'+phone;
  const msg=`Olá, ${b.clientName}! Aqui é do Studio Capricho Hair. Para o serviço ${b.serviceName}, o horário solicitado não está disponível. Podemos te atender em ${fmtDate(date)} às ${time}. Esse horário funciona para você?`;
  window.open(`https://wa.me/${brPhone}?text=${encodeURIComponent(msg)}`,'_blank','noopener,noreferrer');
  toast('Novo horário salvo e WhatsApp preparado.');
}
window.setBookingStatus=setBookingStatus;window.suggestAlternative=suggestAlternative;
function bookingStatusClass(s){return s==='confirmado'?'status-confirmado':s==='proposta'?'status-proposta':s==='recusado'?'status-recusado':s==='concluido'?'status-concluido':'';}
function renderMyBookings(){const phone=localStorage.getItem('sc_last_phone');const all=getBookings().filter(b=>!phone||b.phone===phone).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));const el=document.getElementById('myBookings');if(!all.length){el.innerHTML='<div class="card empty">Nenhum agendamento ainda.</div>';return;}el.innerHTML=all.map(b=>`<div class="card booking-card" style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:10px"><div><strong>${fmtDate(b.date)} • ${b.time}</strong><div class="muted">${b.serviceName} com ${b.professionalName}</div>${b.status==='proposta'&&b.proposedDate?`<div class="client-proposal"><strong>Novo horário sugerido pelo Studio</strong><div>${fmtDate(b.proposedDate)} às ${b.proposedTime}</div><div class="muted">Entre em contato com o Studio caso queira confirmar essa alteração.</div></div>`:''}${b.status==='confirmado'?`<div class="client-status-note success">Seu atendimento foi confirmado pelo Studio.</div>`:''}${b.status==='recusado'?`<div class="client-status-note danger">O Studio não conseguiu confirmar este horário.</div>`:''}${b.status==='concluido'?`<div class="client-status-note">Atendimento concluído. Obrigado por escolher o Studio Capricho Hair.</div>`:''}</div><span class="pill ${bookingStatusClass(b.status)}">${statusLabel(b.status)}</span></div></div>`).join('');}
function renderNextBooking(){const phone=localStorage.getItem('sc_last_phone'),now=new Date().toISOString().slice(0,10);const b=getBookings().filter(x=>!['cancelado','recusado','concluido'].includes(x.status)&&(!phone||x.phone===phone)&&x.date>=now).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0];const el=document.getElementById('nextBooking');if(!el)return;el.innerHTML=b?`<div class="card"><strong>${fmtDate(b.date)} • ${b.time}</strong><div class="muted">${b.serviceName} com ${b.professionalName}</div>${b.status==='proposta'&&b.proposedDate?`<div class="muted top-gap"><strong>Sugestão do Studio:</strong> ${fmtDate(b.proposedDate)} às ${b.proposedTime}</div>`:''}<div class="top-gap"></div><span class="pill ${bookingStatusClass(b.status)}">${statusLabel(b.status)}</span></div>`:'<div class="card empty">Você ainda não tem atendimento marcado.</div>';}
async function showClientView(id,btn){['homeView','bookView','professionalView','portfolioView','myBookingsView','profileView','reviewsView'].forEach(x=>document.getElementById(x)?.classList.add('hidden'));document.getElementById(id)?.classList.remove('hidden');document.querySelectorAll('#clientNav button').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');if(id==='bookView')renderSlots();if(id==='myBookingsView'){await syncClientBookings();renderMyBookings();}window.scrollTo({top:0,behavior:'smooth'});}
function showAdminTab(id,btn){document.querySelectorAll('.admin-panel').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.admin-tabs button').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');}
function saveServices(){localStorage.setItem('sc_services',JSON.stringify(services));}
function renderAdminServices(){const el=document.getElementById('adminServiceList');if(!el)return;el.innerHTML=services.map((s,i)=>`<div class="editable-item"><div><strong>${s.name}</strong><div class="muted">${money(s.price)} • ${s.duration} min</div></div><div class="editable-actions"><button class="small-btn" onclick="editService(${i})">Editar</button><button class="small-btn danger" onclick="removeService(${i})">Excluir</button></div></div>`).join('');}
async function addService(){const name=document.getElementById('newServiceName').value.trim(),price=Number(document.getElementById('newServicePrice').value||0),duration=Number(document.getElementById('newServiceDuration').value||60);if(!name){toast('Informe o nome do serviço.');return;}let item={id:'srv_'+Date.now(),name,price,duration};if(sb){if(!currentAdminUser){toast('Faça login.');return;}const {data,error}=await sb.from('services').insert({name,price,duration,active:true}).select().single();if(error){toast('Erro ao salvar serviço.');return;}item={id:data.id,name:data.name,price:Number(data.price),duration:data.duration};}services.push(item);saveServices();populateAdmin();renderAll();toast('Serviço adicionado.');}
function editService(i){const s=services[i],name=prompt('Nome do serviço:',s.name);if(name===null)return;const price=prompt('Preço:',s.price);if(price===null)return;const duration=prompt('Duração em minutos:',s.duration);if(duration===null)return;services[i]={...s,name:name.trim()||s.name,price:Number(price)||0,duration:Number(duration)||60};saveServices();populateAdmin();renderAll();toast('Serviço atualizado.');}
function removeService(i){if(!confirm('Excluir este serviço?'))return;services.splice(i,1);saveServices();populateAdmin();renderAll();toast('Serviço excluído.');}
function savePortfolio(){localStorage.setItem('sc_portfolio',JSON.stringify(portfolio));}
function renderAdminPortfolio(){const el=document.getElementById('adminPortfolioList');if(!el)return;el.innerHTML=portfolio.map((w,i)=>`<div class="editable-item"><div><strong>${w.title}</strong><div class="muted">${w.category}</div></div><div class="editable-actions"><button class="small-btn danger" onclick="removePortfolioItem(${i})">Excluir</button></div></div>`).join('');}
function previewPortfolioFile(){const file=document.getElementById('newWorkFile').files[0],st=document.getElementById('uploadStatus');if(!file){st.textContent='Nenhuma foto selecionada.';return;}st.textContent='Selecionada: '+file.name;document.getElementById('portfolioPreview').style.backgroundImage=`url('${URL.createObjectURL(file)}')`;}
function previewPortfolioImage(){const url=document.getElementById('newWorkImage').value.trim();document.getElementById('portfolioPreview').style.backgroundImage=url?`url('${url}')`:'none';}
async function addPortfolioItem(){const title=document.getElementById('newWorkTitle').value.trim(),category=document.getElementById('newWorkCategory').value.trim()||'Trabalho realizado',file=document.getElementById('newWorkFile').files[0];let image=document.getElementById('newWorkImage').value.trim();if(!title||(!file&&!image)){toast('Informe título e selecione uma foto ou URL.');return;}if(file&&sb){if(!currentAdminUser){toast('Faça login para enviar fotos.');return;}try{image=await uploadPortfolioFile(file);}catch(e){toast('Falha no upload.');return;}}if(sb&&currentAdminUser){const {error}=await sb.from('portfolio').insert({title,category,image_url:image,instagram_url:'https://www.instagram.com/caprichoohair_/',active:true});if(error){toast('Erro ao salvar no portfólio.');return;}}portfolio.push({title,category,image});savePortfolio();renderAll();toast('Foto adicionada ao portfólio.');}
function removePortfolioItem(i){if(!confirm('Excluir esta foto do portfólio?'))return;portfolio.splice(i,1);savePortfolio();renderAll();toast('Foto removida.');}
