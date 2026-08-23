let recurringAvailabilityBlocks=[];
const WEEKDAY_NAMES=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

async function loadRecurringAvailabilityBlocks(){
  if(!sb)return;
  const {data,error}=await sb.rpc('get_recurring_availability_blocks_public');
  if(!error&&data){
    recurringAvailabilityBlocks=data.map(x=>({id:x.id,professionalId:x.professional_id,weekday:Number(x.weekday),startTime:(x.start_time||'').slice(0,5)||null,endTime:(x.end_time||'').slice(0,5)||null}));
    renderSlots();
    if(typeof renderAvailabilityManager==='function')renderAvailabilityManager();
    if(typeof renderAdminCalendar==='function')renderAdminCalendar(getBookings().filter(b=>b.status!=='cancelado'));
  }
}

function isRecurringBlocked(date,professionalId,time,end){
  const dow=new Date(date+'T12:00:00').getDay();
  return recurringAvailabilityBlocks.some(bl=>{
    if(bl.weekday!==dow)return false;
    if(bl.professionalId&&bl.professionalId!==professionalId)return false;
    if(!bl.startTime&&!bl.endTime)return true;
    return overlaps(time,end,bl.startTime||'00:00',bl.endTime||'23:59');
  });
}

const baseIsSlotFree=isSlotFree;
isSlotFree=function(date,professionalId,time,duration){
  const end=addMinutes(time,duration);
  if(isRecurringBlocked(date,professionalId,time,end))return false;
  return baseIsSlotFree(date,professionalId,time,duration);
};

function recurringProfessionalOptions(){
  return `<option value="">Todo o Studio</option>`+professionals.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
}

function recurringBlockListHtml(){
  const blocks=[...recurringAvailabilityBlocks].sort((a,b)=>(a.weekday-(b.weekday))||((a.startTime||'00:00').localeCompare(b.startTime||'00:00')));
  if(!blocks.length)return '<div class="card empty">Nenhuma folga recorrente cadastrada.</div>';
  return blocks.map(b=>{
    const p=b.professionalId?professionals.find(x=>x.id===b.professionalId)?.name||'Profissional':'Todo o Studio';
    const period=!b.startTime&&!b.endTime?'Dia inteiro':`${b.startTime} às ${b.endTime}`;
    return `<div class="availability-item recurring-item"><div><strong>${WEEKDAY_NAMES[b.weekday]} • ${period}</strong><div class="muted">${p} • repete toda semana</div></div><button class="small-btn danger" onclick="removeRecurringBlock('${b.id}')">Remover</button></div>`;
  }).join('');
}

function recurringManagerHtml(){
  return `<div class="recurring-manager">
    <div class="availability-head recurring-head"><div><div class="section-kicker">Rotina semanal</div><h3>Folgas recorrentes</h3></div><span class="availability-count">${recurringAvailabilityBlocks.length}</span></div>
    <div class="card availability-form">
      <label>Dia da semana</label>
      <select id="recurringWeekday"><option value="0">Domingo</option><option value="1">Segunda-feira</option><option value="2">Terça-feira</option><option value="3">Quarta-feira</option><option value="4">Quinta-feira</option><option value="5">Sexta-feira</option><option value="6">Sábado</option></select>
      <label>Profissional</label><select id="recurringProfessional">${recurringProfessionalOptions()}</select>
      <label class="whole-day-label"><input id="recurringWholeDay" type="checkbox" checked onchange="toggleRecurringTimes()" /> Bloquear o dia inteiro</label>
      <div id="recurringTimes" class="row hidden"><div><label>Das</label><input id="recurringStart" type="time" value="09:00" /></div><div><label>Até</label><input id="recurringEnd" type="time" value="12:00" /></div></div>
      <label>Motivo (opcional)</label><input id="recurringReason" placeholder="Ex.: folga semanal" />
      <button class="btn secondary top-gap" onclick="addRecurringBlock()">Adicionar folga recorrente</button>
    </div>
    <div class="availability-list recurring-list">${recurringBlockListHtml()}</div>
  </div>`;
}

function toggleRecurringTimes(){
  const whole=document.getElementById('recurringWholeDay')?.checked;
  document.getElementById('recurringTimes')?.classList.toggle('hidden',whole);
}

async function addRecurringBlock(){
  if(!sb||!currentAdminUser){toast('Faça login para configurar a rotina semanal.');return;}
  const weekday=Number(document.getElementById('recurringWeekday')?.value);
  const professionalId=document.getElementById('recurringProfessional')?.value||null;
  const whole=document.getElementById('recurringWholeDay')?.checked;
  const start=whole?null:document.getElementById('recurringStart')?.value;
  const end=whole?null:document.getElementById('recurringEnd')?.value;
  const reason=document.getElementById('recurringReason')?.value.trim()||null;
  if(!whole&&(!start||!end||start>=end)){toast('Informe um intervalo válido.');return;}
  const {data,error}=await sb.from('recurring_availability_blocks').insert({weekday,professional_id:professionalId,start_time:start,end_time:end,reason,active:true}).select().single();
  if(error){toast('Não foi possível salvar a folga recorrente.');return;}
  recurringAvailabilityBlocks.push({id:data.id,professionalId:data.professional_id,weekday:Number(data.weekday),startTime:(data.start_time||'').slice(0,5)||null,endTime:(data.end_time||'').slice(0,5)||null});
  renderSlots();renderAvailabilityManager();renderAdminCalendar(getBookings().filter(b=>b.status!=='cancelado'));
  toast('Folga semanal adicionada.');
}

async function removeRecurringBlock(id){
  if(!sb||!currentAdminUser){toast('Faça login.');return;}
  const {error}=await sb.from('recurring_availability_blocks').delete().eq('id',id);
  if(error){toast('Não foi possível remover a folga recorrente.');return;}
  recurringAvailabilityBlocks=recurringAvailabilityBlocks.filter(b=>b.id!==id);
  renderSlots();renderAvailabilityManager();renderAdminCalendar(getBookings().filter(b=>b.status!=='cancelado'));
  toast('Folga recorrente removida.');
}

window.toggleRecurringTimes=toggleRecurringTimes;
window.addRecurringBlock=addRecurringBlock;
window.removeRecurringBlock=removeRecurringBlock;

if(typeof renderAvailabilityManager==='function'){
  const baseRenderAvailabilityManager=renderAvailabilityManager;
  renderAvailabilityManager=function(){
    baseRenderAvailabilityManager();
    const box=document.getElementById('availabilityManager');
    if(box&&!box.querySelector('.recurring-manager'))box.insertAdjacentHTML('beforeend',recurringManagerHtml());
  };
}

if(typeof renderAdminCalendar==='function'){
  const baseRecurringCalendar=renderAdminCalendar;
  renderAdminCalendar=function(all){
    baseRecurringCalendar(all);
    document.querySelectorAll('.calendar-day').forEach(btn=>{
      const day=btn.querySelector('span')?.textContent;if(!day)return;
      const y=adminCalendarDate.getFullYear(),m=adminCalendarDate.getMonth()+1;
      const iso=`${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const dow=new Date(iso+'T12:00:00').getDay();
      if(recurringAvailabilityBlocks.some(b=>b.weekday===dow&&!b.startTime&&!b.endTime))btn.classList.add('recurring-blocked');
      else if(recurringAvailabilityBlocks.some(b=>b.weekday===dow))btn.classList.add('recurring-partial');
    });
  };
}

loadRecurringAvailabilityBlocks();
setTimeout(loadRecurringAvailabilityBlocks,1000);
