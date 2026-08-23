function bookingWhatsAppNumber(phone=''){
  const digits=String(phone).replace(/\D/g,'');
  return digits.startsWith('55')?digits:`55${digits}`;
}

function bookingMessageText(b,type){
  const name=(b.clientName||'').trim().split(' ')[0]||'cliente';
  const date=fmtDate(b.date);
  const time=b.time||'';
  const service=b.serviceName||'seu atendimento';
  if(type==='confirmacao')return `Olá, ${name}! Aqui é do Studio Capricho Hair. Seu atendimento de ${service} está confirmado para ${date} às ${time}. Esperamos você! ✨`;
  if(type==='lembrete')return `Oi, ${name}! Passando para lembrar do seu horário no Studio Capricho Hair: ${date} às ${time}, para ${service}. Se precisar falar com a gente, é só responder esta mensagem. 💛`;
  if(type==='reagendamento')return `Olá, ${name}! Aqui é do Studio Capricho Hair. Precisamos conversar sobre seu horário de ${service}, marcado para ${date} às ${time}. Pode nos responder por aqui para combinarmos o melhor horário?`;
  if(type==='pos')return `Oi, ${name}! Foi um prazer te atender no Studio Capricho Hair. 💛 Esperamos que tenha amado o resultado do seu ${service}. Quando quiser cuidar novamente do seu cabelo, estaremos por aqui!`;
  return `Olá, ${name}! Aqui é do Studio Capricho Hair.`;
}

function openBookingWhatsApp(id,type){
  const b=getBookings().find(x=>x.id===id);
  if(!b){toast('Agendamento não encontrado.');return;}
  const phone=bookingWhatsAppNumber(b.phone);
  if(!phone||phone==='55'){toast('WhatsApp da cliente não informado.');return;}
  const text=bookingMessageText(b,type);
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer');
}
window.openBookingWhatsApp=openBookingWhatsApp;

function addQuickMessageButtons(){
  const all=getBookings().filter(b=>b.status!=='cancelado').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const bookings=adminBookingFilter==='todos'?all:all.filter(b=>b.status===adminBookingFilter);
  const cards=[...document.querySelectorAll('#adminBookings .booking-card')];
  cards.forEach((card,i)=>{
    const b=bookings[i];if(!b||card.querySelector('.quick-message-actions'))return;
    const wrap=document.createElement('div');
    wrap.className='quick-message-actions';
    wrap.innerHTML=`<div class="quick-message-label">Mensagens rápidas no WhatsApp</div><div class="quick-message-grid"><button onclick="openBookingWhatsApp('${b.id}','confirmacao')">✓ Confirmação</button><button onclick="openBookingWhatsApp('${b.id}','lembrete')">⏰ Lembrete</button><button onclick="openBookingWhatsApp('${b.id}','reagendamento')">↻ Reagendar</button><button onclick="openBookingWhatsApp('${b.id}','pos')">♡ Pós-atendimento</button></div>`;
    card.appendChild(wrap);
  });
}

const baseRenderAdminQuickMessages=renderAdmin;
renderAdmin=function(){
  baseRenderAdminQuickMessages();
  addQuickMessageButtons();
};

setTimeout(()=>{if(adminMode)addQuickMessageButtons();},500);
