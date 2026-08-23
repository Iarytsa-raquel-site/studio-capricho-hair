(function(){
  function proposalErrorMessage(error){
    const msg=String(error?.message||'');
    if(msg.includes('HORARIO_INDISPONIVEL'))return 'Esse horário já está ocupado. Escolha outro.';
    if(msg.includes('HORARIO_BLOQUEADO'))return 'Esse período está bloqueado na agenda. Escolha outro horário.';
    if(msg.includes('STUDIO_FECHADO'))return 'O Studio não atende aos domingos ou segundas-feiras.';
    if(msg.includes('FORA_DO_HORARIO'))return 'Escolha um horário dentro do período de atendimento.';
    if(msg.includes('ACESSO_NEGADO'))return 'Seu acesso administrativo não está autorizado.';
    return 'Não foi possível sugerir esse horário. Tente novamente.';
  }

  suggestAlternative=async function(id){
    if(!sb||!currentAdminUser){toast('Faça login.');return;}
    const b=getBookings().find(x=>x.id===id);if(!b){toast('Agendamento não encontrado.');return;}
    const date=prompt('Nova data (AAAA-MM-DD):',b.proposedDate||b.date);if(!date)return;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){toast('Informe a data no formato AAAA-MM-DD.');return;}
    const time=prompt('Novo horário (HH:MM):',b.proposedTime||b.time);if(!time)return;
    if(!/^\d{2}:\d{2}$/.test(time)){toast('Informe o horário no formato HH:MM.');return;}

    const {error}=await sb.rpc('suggest_booking_alternative_admin',{p_booking_id:id,p_date:date,p_time:time});
    if(error){toast(proposalErrorMessage(error));return;}

    const bookings=getBookings().map(x=>x.id===id?{...x,status:'proposta',proposedDate:date,proposedTime:time}:x);
    saveBookings(bookings);renderAll();

    const phone=(b.phone||'').replace(/\D/g,'');
    if(phone){
      const brPhone=phone.startsWith('55')?phone:'55'+phone;
      const msg=`Olá, ${b.clientName}! Aqui é do Studio Capricho Hair. Para o serviço ${b.serviceName}, podemos te atender em ${fmtDate(date)} às ${time}. Esse horário funciona para você?`;
      window.open(`https://wa.me/${brPhone}?text=${encodeURIComponent(msg)}`,'_blank','noopener,noreferrer');
    }
    toast('Novo horário validado e enviado para aprovação da cliente.');
  };
  window.suggestAlternative=suggestAlternative;

  const originalAccept=acceptBookingProposal;
  acceptBookingProposal=async function(id){
    if(!sb){toast('Conexão indisponível.');return;}
    const b=getBookings().find(x=>x.id===id);if(!b||b.status!=='proposta')return;
    const phone=b.phone||localStorage.getItem('sc_last_phone')||'';
    if(!phone){toast('Não foi possível validar seu agendamento.');return;}
    const {error}=await sb.rpc('accept_booking_proposal',{p_booking_id:id,p_phone:phone});
    if(error){
      const msg=String(error.message||'');
      toast(msg.includes('HORARIO_INDISPONIVEL')?'Esse horário não está mais disponível.':msg.includes('HORARIO_BLOQUEADO')?'Esse horário foi bloqueado pelo Studio. Aguarde uma nova sugestão.':'Não foi possível aceitar o novo horário.');
      await syncClientBookings();renderMyBookings();return;
    }
    await syncClientBookings();renderMyBookings();toast('Novo horário aceito e confirmado!');
  };
  window.acceptBookingProposal=acceptBookingProposal;
})();