const blockStyle=document.createElement('style');
blockStyle.textContent=`
.availability-manager{margin:28px 0 8px}.availability-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:12px}.availability-head .section-title{margin:2px 0 0}.availability-count{font-size:11px;color:#d7a93f;border:1px solid rgba(215,169,63,.3);background:#17130b;padding:7px 9px;border-radius:999px;white-space:nowrap}.availability-form{border-color:rgba(215,169,63,.2)}.whole-day-label{display:flex;align-items:center;gap:9px;text-transform:none;letter-spacing:0;font-size:13px;color:#f2eee4;cursor:pointer}.whole-day-label input{width:18px;height:18px;accent-color:#d7a93f}.availability-list{display:grid;gap:9px;margin-top:11px}.availability-item{display:flex;align-items:center;justify-content:space-between;gap:12px;background:linear-gradient(180deg,#151515,#101010);border:1px solid #30291f;border-radius:15px;padding:13px 14px}.availability-item strong{font-size:13px;color:#f2eee4}.calendar-day.blocked-day{border-color:#9a343c!important;background:#261014!important;color:#ff9ca2!important}.calendar-day.partially-blocked{border-color:#8b6b24!important;background:#211a0c!important}.calendar-day.blocked-day::after,.calendar-day.partially-blocked::after{content:"";display:block;width:5px;height:5px;border-radius:50%;margin:3px auto 0;background:currentColor}.availability-manager .small-btn.danger{color:#ff9ca2;background:#251014;border-color:#633039}@media(max-width:380px){.availability-head{align-items:flex-start;flex-direction:column}.availability-count{align-self:flex-start}}
`;
document.head.appendChild(blockStyle);

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
