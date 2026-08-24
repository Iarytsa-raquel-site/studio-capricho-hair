(function(){
  function normalizePhone(v=''){return String(v).replace(/\D/g,'');}
  function isCancelableStatus(status){return ['pendente','confirmado','proposta'].includes(status);}

  async function cancelClientBooking(id){
    if(!sb){toast('Conexão indisponível.');return;}
    const b=getBookings().find(x=>x.id===id);
    if(!b){toast('Agendamento não encontrado.');return;}
    if(!isCancelableStatus(b.status)){toast('Este agendamento não pode mais ser cancelado.');return;}
    if(!confirm(`Cancelar o agendamento de ${b.serviceName} em ${fmtDate(b.date)} às ${b.time}?`))return;
    const phone=b.phone||localStorage.getItem('sc_last_phone')||'';
    if(!normalizePhone(phone)){toast('Não foi possível validar seu WhatsApp.');return;}
    const {error}=await sb.rpc('cancel_booking_by_phone',{p_booking_id:id,p_phone:phone});
    if(error){
      const msg=String(error.message||'');
      toast(msg.includes('STATUS_NAO_CANCELAVEL')?'Este agendamento não pode mais ser cancelado.':msg.includes('TELEFONE_NAO_CONFERE')?'Não foi possível validar este agendamento.':'Não foi possível cancelar agora.');
      return;
    }
    const updated=getBookings().map(x=>x.id===id?{...x,status:'cancelado',proposedDate:null,proposedTime:null}:x);
    saveBookings(updated);renderAll();toast('Agendamento cancelado com sucesso.');
  }
  window.cancelClientBooking=cancelClientBooking;

  function enhanceClientBookingCards(){
    const phone=localStorage.getItem('sc_last_phone');
    const list=getBookings().filter(b=>!phone||normalizePhone(b.phone)===normalizePhone(phone)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    const cards=[...document.querySelectorAll('#myBookings .booking-card')];
    cards.forEach((card,i)=>{
      const b=list[i];if(!b||!isCancelableStatus(b.status)||card.querySelector('.client-cancel-actions'))return;
      const wrap=document.createElement('div');wrap.className='client-cancel-actions';wrap.style.marginTop='12px';
      wrap.innerHTML=`<button class="btn danger" onclick="cancelClientBooking('${b.id}')">Cancelar agendamento</button><div class="muted" style="margin-top:7px">Ao cancelar, este horário será liberado novamente.</div>`;
      card.appendChild(wrap);
    });
  }

  const originalRenderMyBookings=renderMyBookings;
  renderMyBookings=function(){originalRenderMyBookings();enhanceClientBookingCards();};

  async function adminDeleteBooking(id){
    if(!sb||!currentAdminUser){toast('Faça login.');return;}
    const b=getBookings().find(x=>x.id===id);if(!b)return;
    if(!confirm(`Excluir definitivamente o agendamento de ${b.clientName}?\n\nEssa ação não poderá ser desfeita.`))return;
    const {error}=await sb.from('bookings').delete().eq('id',id);
    if(error){toast('Não foi possível excluir o agendamento.');return;}
    saveBookings(getBookings().filter(x=>x.id!==id));renderAll();toast('Agendamento removido.');
  }
  window.adminDeleteBooking=adminDeleteBooking;

  async function adminClearFinishedBookings(){
    if(!sb||!currentAdminUser){toast('Faça login.');return;}
    const removable=getBookings().filter(b=>['cancelado','recusado','concluido'].includes(b.status));
    if(!removable.length){toast('Não há atendimentos finalizados/cancelados para limpar.');return;}
    if(!confirm(`Remover ${removable.length} registros concluídos, recusados ou cancelados?`))return;
    const ids=removable.map(b=>b.id);
    const {error}=await sb.from('bookings').delete().in('id',ids);
    if(error){toast('Não foi possível limpar os registros.');return;}
    saveBookings(getBookings().filter(b=>!ids.includes(b.id)));renderAll();toast('Registros antigos removidos.');
  }
  window.adminClearFinishedBookings=adminClearFinishedBookings;

  async function adminClearAllBookings(){
    if(!sb||!currentAdminUser){toast('Faça login.');return;}
    const all=getBookings();if(!all.length){toast('A agenda já está vazia.');return;}
    const typed=prompt(`ATENÇÃO: isto excluirá TODOS os ${all.length} agendamentos registrados.\n\nPara confirmar, digite LIMPAR:`,'');
    if(typed!=='LIMPAR'){toast('Limpeza cancelada.');return;}
    const ids=all.map(b=>b.id);
    const {error}=await sb.from('bookings').delete().in('id',ids);
    if(error){toast('Não foi possível limpar toda a agenda.');return;}
    saveBookings([]);renderAll();toast('Agenda limpa.');
  }
  window.adminClearAllBookings=adminClearAllBookings;

  function enhanceAdminBookingCards(){
    const all=getBookings().filter(b=>b.status!=='cancelado').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    const shown=adminBookingFilter==='todos'?all:all.filter(b=>b.status===adminBookingFilter);
    const cards=[...document.querySelectorAll('#adminBookings .booking-card')];
    cards.forEach((card,i)=>{
      const b=shown[i];if(!b||card.querySelector('.admin-delete-booking'))return;
      const wrap=document.createElement('div');wrap.className='admin-delete-booking';wrap.style.marginTop='10px';
      wrap.innerHTML=`<button class="small-btn danger" onclick="adminDeleteBooking('${b.id}')">Excluir registro</button>`;
      card.appendChild(wrap);
    });
  }

  function ensureAdminCleanupToolbar(){
    const panel=document.getElementById('agendaPanel');if(!panel||document.getElementById('bookingCleanupToolbar'))return;
    const title=[...panel.querySelectorAll('.section-title')].find(x=>x.textContent.includes('Agenda de atendimentos'));
    if(!title)return;
    const box=document.createElement('div');box.id='bookingCleanupToolbar';box.className='card';box.style.marginBottom='12px';
    box.innerHTML=`<div class="mini-title">Manutenção da agenda</div><strong>Limpar registros de teste</strong><p class="muted">Você pode remover registros individualmente ou limpar a agenda após os testes.</p><div class="cta"><button class="btn ghost" onclick="adminClearFinishedBookings()">Limpar finalizados</button><button class="btn danger" onclick="adminClearAllBookings()">Limpar todos</button></div>`;
    title.insertAdjacentElement('afterend',box);
  }

  const originalRenderAdmin=renderAdmin;
  renderAdmin=function(){originalRenderAdmin();ensureAdminCleanupToolbar();enhanceAdminBookingCards();};

  setTimeout(()=>{enhanceClientBookingCards();ensureAdminCleanupToolbar();enhanceAdminBookingCards();},500);
})();
