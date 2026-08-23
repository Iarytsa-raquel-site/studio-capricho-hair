let blockManagerReady=false;

function ensureAvailabilityManager(){
  const panel=document.getElementById('agendaPanel');
  if(!panel)return null;
  let box=document.getElementById('availabilityManager');
  if(box)return box;
  box=document.createElement('section');
  box.id='availabilityManager';
  box.className='availability-manager';
  const quickTitle=[...panel.querySelectorAll('.section-title')].find(x=>x.textContent.includes('Agendamento rápido'));
  if(quickTitle)quickTitle.insertAdjacentElement('beforebegin',box);else panel.appendChild(box);
  blockManagerReady=true;
  return box;
}

function blockProfessionalOptions(){
  return `<option value="">Todo o Studio</option>`+professionals.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
}

function renderAvailabilityManager(){
  const box=ensureAvailabilityManager();if(!box)return;
  const today=localISODate();
  const blocks=[...availabilityBlocks].filter(b=>b.date>=today).sort((a,b)=>(a.date+(a.startTime||'00:00')).localeCompare(b.date+(b.startTime||'00:00')));
  box.innerHTML=`
    <div class="availability-head">
      <div><div class="section-kicker">Disponibilidade</div><h2 class="section-title">Bloquear dia ou horário</h2></div>
      <span class="availability-count">${blocks.length} ${blocks.length===1?'bloqueio':'bloqueios'}</span>
    </div>
    <div class="card availability-form">
      <label>Data</label>
      <input id="blockDate" type="date" min="${today}" value="${adminCalendarSelected||today}" />
      <label>Profissional</label>
      <select id="blockProfessional">${blockProfessionalOptions()}</select>
      <label class="whole-day-label"><input id="blockWholeDay" type="checkbox" checked onchange="toggleBlockTimes()" /> Bloquear o dia inteiro</label>
      <div id="blockTimes" class="row hidden">
        <div><label>Das</label><input id="blockStart" type="time" value="09:00" /></div>
        <div><label>Até</label><input id="blockEnd" type="time" value="12:00" /></div>
      </div>
      <label>Motivo (opcional)</label>
      <input id="blockReason" placeholder="Ex.: compromisso pessoal" />
      <button class="btn primary top-gap" onclick="addAvailabilityBlock()">Bloquear agenda</button>
    </div>
    <div class="availability-list">${blocks.length?blocks.map(b=>{
      const p=b.professionalId?professionals.find(x=>x.id===b.professionalId)?.name||'Profissional':'Todo o Studio';
      const period=!b.startTime&&!b.endTime?'Dia inteiro':`${b.startTime||'00:00'} às ${b.endTime||'23:59'}`;
      return `<div class="availability-item"><div><strong>${fmtDate(b.date)} • ${period}</strong><div class="muted">${p}</div></div><button class="small-btn danger" onclick="removeAvailabilityBlock('${b.id}')">Liberar</button></div>`;
    }).join(''):'<div class="card empty">Nenhum dia ou horário bloqueado.</div>'}</div>`;
}

function toggleBlockTimes(){
  const whole=document.getElementById('blockWholeDay')?.checked;
  document.getElementById('blockTimes')?.classList.toggle('hidden',whole);
}

async function addAvailabilityBlock(){
  if(!sb||!currentAdminUser){toast('Faça login para bloquear a agenda.');return;}
  const date=document.getElementById('blockDate')?.value;
  const professionalId=document.getElementById('blockProfessional')?.value||null;
  const whole=document.getElementById('blockWholeDay')?.checked;
  const start=whole?null:document.getElementById('blockStart')?.value;
  const end=whole?null:document.getElementById('blockEnd')?.value;
  const reason=document.getElementById('blockReason')?.value.trim()||null;
  if(!date){toast('Escolha a data.');return;}
  if(!whole&&(!start||!end||start>=end)){toast('Informe um intervalo de horário válido.');return;}
  const payload={block_date:date,professional_id:professionalId,start_time:start,end_time:end,reason};
  const {data,error}=await sb.from('availability_blocks').insert(payload).select().single();
  if(error){toast('Não foi possível bloquear esse período.');return;}
  availabilityBlocks.push({id:data.id,professionalId:data.professional_id,date:data.block_date,startTime:(data.start_time||'').slice(0,5)||null,endTime:(data.end_time||'').slice(0,5)||null});
  renderSlots();renderAvailabilityManager();renderAdminCalendar(getBookings().filter(b=>b.status!=='cancelado'));
  toast(whole?'Dia bloqueado na agenda.':'Horário bloqueado na agenda.');
}

async function removeAvailabilityBlock(id){
  if(!sb||!currentAdminUser){toast('Faça login.');return;}
  const {error}=await sb.from('availability_blocks').delete().eq('id',id);
  if(error){toast('Não foi possível liberar esse período.');return;}
  availabilityBlocks=availabilityBlocks.filter(b=>b.id!==id);
  renderSlots();renderAvailabilityManager();renderAdminCalendar(getBookings().filter(b=>b.status!=='cancelado'));
  toast('Período liberado para agendamentos.');
}

window.toggleBlockTimes=toggleBlockTimes;
window.addAvailabilityBlock=addAvailabilityBlock;
window.removeAvailabilityBlock=removeAvailabilityBlock;

const originalRenderAdmin=renderAdmin;
renderAdmin=function(){originalRenderAdmin();renderAvailabilityManager();};

const originalRenderAdminCalendar=renderAdminCalendar;
renderAdminCalendar=function(all){
  originalRenderAdminCalendar(all);
  document.querySelectorAll('.calendar-day').forEach(btn=>{
    const day=btn.querySelector('span')?.textContent;
    if(!day)return;
    const y=adminCalendarDate.getFullYear(),m=adminCalendarDate.getMonth()+1;
    const iso=`${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if(availabilityBlocks.some(b=>b.date===iso&&!b.startTime&&!b.endTime))btn.classList.add('blocked-day');
    else if(availabilityBlocks.some(b=>b.date===iso))btn.classList.add('partially-blocked');
  });
};

setTimeout(()=>{if(adminMode)renderAvailabilityManager();},300);
