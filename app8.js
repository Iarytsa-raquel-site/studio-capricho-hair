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
renderAdmin=function(){baseRenderAdminQuickMessages();addQuickMessageButtons();};

function initProfessionalLogin(){
  if(!document.querySelector('link[href*="login.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='login.css?v=24';document.head.appendChild(l);}
  const shell=document.querySelector('#adminLoginView .login-shell');if(!shell)return;
  const subtitle=shell.querySelector('p.muted');if(subtitle)subtitle.textContent='Acesso seguro para gerenciamento da agenda e clientes.';
  const password=document.getElementById('adminPassword');
  if(password&&!password.closest('.password-wrap')){const wrap=document.createElement('div');wrap.className='password-wrap';password.parentNode.insertBefore(wrap,password);wrap.appendChild(password);const toggle=document.createElement('button');toggle.type='button';toggle.className='password-toggle';toggle.setAttribute('aria-label','Mostrar ou ocultar senha');toggle.textContent='◉';toggle.onclick=()=>{password.type=password.type==='password'?'text':'password';toggle.textContent=password.type==='password'?'◉':'◎';};wrap.appendChild(toggle);}
  if(!shell.querySelector('.login-security')){const auth=document.getElementById('authNote');const sec=document.createElement('div');sec.className='login-security';sec.innerHTML='<span>✓</span><span>Conexão protegida • acesso exclusivo do Studio</span>';if(auth)auth.insertAdjacentElement('beforebegin',sec);else shell.appendChild(sec);const divider=document.createElement('div');divider.className='login-divider';sec.insertAdjacentElement('afterend',divider);const helper=document.createElement('div');helper.className='login-helper';helper.textContent='Se esquecer sua senha, use a recuperação por e-mail abaixo.';divider.insertAdjacentElement('afterend',helper);}
  if(!document.querySelector('script[data-password-reset-loader]')){const s=document.createElement('script');s.src='password-reset.js?v=24';s.dataset.passwordResetLoader='true';s.onload=()=>window.initPasswordRecoveryUi?.();document.body.appendChild(s);}else window.initPasswordRecoveryUi?.();
}

function loadAdminSecurityLayer(){
  if(document.querySelector('script[data-admin-security-loader]'))return;
  const s=document.createElement('script');s.src='app9.js?v=25';s.dataset.adminSecurityLoader='true';
  s.onload=()=>{if(document.querySelector('script[data-booking-flow-hardening]'))return;const h=document.createElement('script');h.src='app10.js?v=26';h.dataset.bookingFlowHardening='true';document.body.appendChild(h);};
  document.body.appendChild(s);
}

function loadPerformanceDashboard(){
  if(!document.querySelector('link[data-performance-style]')){const l=document.createElement('link');l.rel='stylesheet';l.href='performance.css?v=27';l.dataset.performanceStyle='true';document.head.appendChild(l);}
  if(!document.querySelector('link[data-expenses-style]')){const l=document.createElement('link');l.rel='stylesheet';l.href='expenses.css?v=28';l.dataset.expensesStyle='true';document.head.appendChild(l);}
  if(!document.querySelector('script[data-performance-loader]')){
    const s=document.createElement('script');s.src='app11.js?v=27';s.dataset.performanceLoader='true';
    s.onload=()=>{if(document.querySelector('script[data-expenses-loader]'))return;const e=document.createElement('script');e.src='app12.js?v=28';e.dataset.expensesLoader='true';document.body.appendChild(e);};
    document.body.appendChild(s);
  }
}

function loadBookingManagement(){
  if(document.querySelector('script[data-booking-management-loader]'))return;
  const s=document.createElement('script');s.src='app13.js?v=29';s.dataset.bookingManagementLoader='true';document.body.appendChild(s);
}

setTimeout(()=>{if(adminMode)addQuickMessageButtons();initProfessionalLogin();loadAdminSecurityLayer();loadPerformanceDashboard();loadBookingManagement();},250);
