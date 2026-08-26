(()=>{
'use strict';
const cfg=window.STUDIO_CONFIG||{};
const sb=(window.supabase&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY)?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
let busy=false,timer=null,lastIds=[],drag=null;

function toast(msg){
  const e=document.querySelector('#toast');
  if(!e)return;
  e.textContent=msg;
  e.classList.add('show');
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>e.classList.remove('show'),2600);
}

function ensureStyles(){
  if(document.querySelector('#serviceOrderV7Styles'))return;
  const style=document.createElement('style');
  style.id='serviceOrderV7Styles';
  style.textContent=`
    .service-order-help{margin:0 0 14px;padding:12px 14px;border:1px solid rgba(212,175,55,.22);border-radius:12px;background:rgba(212,175,55,.055);color:#d8d8d3;font-size:13px;line-height:1.45}
    .service-order-help strong{color:#f0d580;display:block;margin-bottom:3px}
    #serviceList .row{gap:12px;transition:transform .14s ease,background .14s ease,border-color .14s ease,opacity .14s ease}
    #serviceList .row>div:first-child{min-width:0;flex:1}
    .service-order-number{display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:28px;margin-right:8px;padding:0 7px;border-radius:999px;border:1px solid rgba(212,175,55,.28);background:rgba(212,175,55,.07);color:#f0d580;font-size:12px;font-weight:800;vertical-align:middle}
    .service-order-controls{display:inline-flex;gap:6px;align-items:center}
    .service-order-controls .small-btn{min-width:38px;min-height:38px;padding:7px 9px;font-size:16px;line-height:1}
    .service-order-controls .small-btn:disabled{opacity:.3;cursor:not-allowed}
    .service-order-handle{cursor:grab;touch-action:none!important;user-select:none;-webkit-user-select:none;font-size:19px!important;letter-spacing:-3px;padding-right:12px!important;color:#f0d580!important;border-color:rgba(212,175,55,.38)!important;background:rgba(212,175,55,.075)!important}
    .service-order-handle:active{cursor:grabbing}
    #serviceList.is-dragging{touch-action:none;overscroll-behavior:contain}
    #serviceList .row.service-dragging{opacity:.6;border-color:#d4af37!important;background:rgba(212,175,55,.08)!important;box-shadow:0 12px 32px rgba(0,0,0,.28)}
    #serviceList .row.service-dragging .service-order-handle{cursor:grabbing;background:rgba(212,175,55,.16)!important}
    .service-order-saving{opacity:.65;pointer-events:none}
    @media(max-width:720px){
      #serviceList .row{align-items:flex-start;flex-direction:column}
      .service-order-controls{width:100%;flex-wrap:wrap}
      .service-order-controls .small-btn{flex:0 0 auto;min-width:44px;min-height:44px}
      .service-order-handle{min-width:52px!important}
      .service-order-edit{margin-left:auto}
    }
    @media(prefers-reduced-motion:reduce){#serviceList .row{transition:none!important}}
  `;
  document.head.appendChild(style);
}

async function fetchOrdered(){
  if(!sb)return[];
  const {data,error}=await sb.from('services').select('id,sort_order,created_at').order('sort_order',{ascending:true,nullsFirst:false}).order('created_at',{ascending:true});
  if(error)throw error;
  return data||[];
}

function getRowId(row){
  return row?.dataset?.serviceOrderId||row?.querySelector('[data-edit-service]')?.getAttribute('data-edit-service')||row?.querySelector('[data-toggle-service]')?.getAttribute('data-toggle-service')||'';
}

function rowsOf(list){
  return [...list.children].filter(el=>el.classList.contains('row')&&getRowId(el));
}

function addHelp(list){
  const card=list.closest('.card');
  if(!card)return;
  const old=card.querySelector('.service-order-help');
  if(old){
    old.innerHTML='<strong>↕ Organizar sequência</strong>Segure o botão <b>⋮⋮</b> e arraste o serviço para a posição desejada. No computador você também pode arrastar com o mouse. As setas ↑ ↓ continuam disponíveis e a ordem é salva automaticamente.';
    return;
  }
  const help=document.createElement('div');
  help.className='service-order-help';
  help.innerHTML='<strong>↕ Organizar sequência</strong>Segure o botão <b>⋮⋮</b> e arraste o serviço para a posição desejada. No computador você também pode arrastar com o mouse. As setas ↑ ↓ continuam disponíveis e a ordem é salva automaticamente.';
  list.before(help);
}

function renumber(list){
  const rows=rowsOf(list);
  rows.forEach((row,index)=>{
    const chip=row.querySelector('.service-order-number');
    if(chip)chip.textContent=String(index+1);
    const up=row.querySelector('[data-service-move="up"]');
    const down=row.querySelector('[data-service-move="down"]');
    if(up)up.disabled=busy||index===0;
    if(down)down.disabled=busy||index===rows.length-1;
    const handle=row.querySelector('[data-service-drag]');
    if(handle)handle.disabled=busy;
  });
}

function decorateRows(list,ordered){
  const rows=rowsOf(list);
  const byId=new Map(rows.map(r=>[String(getRowId(r)),r]));
  ordered.forEach(item=>{
    const row=byId.get(String(item.id));
    if(row)list.appendChild(row);
  });
  const finalRows=rowsOf(list);
  finalRows.forEach((row,index)=>{
    const id=getRowId(row);
    if(!id)return;
    row.dataset.serviceOrderId=id;
    row.classList.add('service-order-row');
    const info=row.children[0];
    const actions=row.querySelector('.actions');
    if(info&&!info.querySelector('.service-order-number')){
      const chip=document.createElement('span');
      chip.className='service-order-number';
      chip.textContent=String(index+1);
      info.insertBefore(chip,info.firstChild);
    }
    const edit=actions?.querySelector('[data-edit-service]');
    if(edit){edit.textContent='✏️ Editar';edit.classList.add('service-order-edit');}
    let controls=actions?.querySelector('.service-order-controls');
    if(actions&&!controls){
      controls=document.createElement('span');
      controls.className='service-order-controls';
      controls.innerHTML=`<button class="small-btn service-order-handle" type="button" data-service-drag="${id}" title="Segure e arraste" aria-label="Segure e arraste para mudar a posição">⋮⋮</button><button class="small-btn" type="button" data-service-move="up" data-service-id="${id}" title="Mover para cima" aria-label="Mover serviço para cima">↑</button><button class="small-btn" type="button" data-service-move="down" data-service-id="${id}" title="Mover para baixo" aria-label="Mover serviço para baixo">↓</button>`;
      actions.insertBefore(controls,actions.firstChild);
    }else if(controls&&!controls.querySelector('[data-service-drag]')){
      const handle=document.createElement('button');
      handle.className='small-btn service-order-handle';
      handle.type='button';
      handle.setAttribute('data-service-drag',id);
      handle.title='Segure e arraste';
      handle.setAttribute('aria-label','Segure e arraste para mudar a posição');
      handle.textContent='⋮⋮';
      controls.insertBefore(handle,controls.firstChild);
    }
  });
  renumber(list);
}

async function enhance(force=false){
  const list=document.querySelector('#serviceList');
  if(!list||busy||drag||!sb)return;
  try{
    const ordered=await fetchOrdered();
    const ids=ordered.map(x=>String(x.id));
    if(force||ids.join('|')!==lastIds.join('|')||!list.dataset.orderEnhanced){
      lastIds=ids;
      ensureStyles();
      addHelp(list);
      decorateRows(list,ordered);
      list.dataset.orderEnhanced='1';
    }else{
      ensureStyles();
      addHelp(list);
      decorateRows(list,ordered);
    }
  }catch(e){console.warn('Falha ao carregar ordem dos serviços',e)}
}

async function persistDomOrder(list){
  if(busy||!sb)return;
  const ids=rowsOf(list).map(getRowId).filter(Boolean);
  if(!ids.length)return;
  busy=true;
  list.classList.add('service-order-saving');
  renumber(list);
  try{
    const current=await fetchOrdered();
    const currentPos=new Map(current.map(x=>[String(x.id),Number(x.sort_order)]));
    const changes=ids.map((id,index)=>({id,next:index+1,current:currentPos.get(String(id))})).filter(x=>x.current!==x.next);
    for(const x of changes){
      const {error}=await sb.from('services').update({sort_order:x.next}).eq('id',x.id);
      if(error)throw error;
    }
    lastIds=[...ids];
    toast('Sequência dos serviços salva.');
  }catch(e){
    console.error(e);
    lastIds=[];
    toast('Não foi possível salvar a nova sequência.');
  }finally{
    busy=false;
    list.classList.remove('service-order-saving');
    await enhance(true);
  }
}

async function moveService(id,dir){
  if(busy||drag||!sb)return;
  const list=document.querySelector('#serviceList');
  if(!list)return;
  const rows=rowsOf(list);
  const i=rows.findIndex(r=>String(getRowId(r))===String(id));
  if(i<0)return;
  const j=dir==='up'?i-1:i+1;
  if(j<0||j>=rows.length)return;
  const row=rows[i],target=rows[j];
  if(dir==='up')list.insertBefore(row,target);
  else list.insertBefore(target,row);
  renumber(list);
  await persistDomOrder(list);
}

function restoreOrder(list,ids){
  const map=new Map(rowsOf(list).map(r=>[String(getRowId(r)),r]));
  ids.forEach(id=>{const row=map.get(String(id));if(row)list.appendChild(row)});
  renumber(list);
}

function startDrag(ev,handle){
  if(busy||drag||ev.button>0)return;
  const row=handle.closest('#serviceList .row');
  const list=row?.parentElement;
  if(!row||!list)return;
  ev.preventDefault();
  ev.stopPropagation();
  drag={pointerId:ev.pointerId,handle,row,list,startIds:rowsOf(list).map(getRowId),moved:false};
  row.classList.add('service-dragging');
  list.classList.add('is-dragging');
  try{handle.setPointerCapture(ev.pointerId)}catch{}
}

function moveDrag(ev){
  if(!drag||ev.pointerId!==drag.pointerId)return;
  ev.preventDefault();
  const el=document.elementFromPoint(ev.clientX,ev.clientY);
  const target=el?.closest?.('#serviceList .row');
  if(!target||target===drag.row||target.parentElement!==drag.list)return;
  const rect=target.getBoundingClientRect();
  const before=ev.clientY<rect.top+(rect.height/2);
  const reference=before?target:target.nextSibling;
  if(reference===drag.row)return;
  drag.list.insertBefore(drag.row,reference);
  drag.moved=true;
  renumber(drag.list);
}

async function finishDrag(ev,cancelled=false){
  if(!drag||ev.pointerId!==drag.pointerId)return;
  ev.preventDefault();
  const d=drag;
  drag=null;
  try{d.handle.releasePointerCapture(ev.pointerId)}catch{}
  d.row.classList.remove('service-dragging');
  d.list.classList.remove('is-dragging');
  if(cancelled){
    restoreOrder(d.list,d.startIds);
    return;
  }
  if(d.moved)await persistDomOrder(d.list);
}

document.addEventListener('click',ev=>{
  const btn=ev.target.closest('[data-service-move]');
  if(!btn)return;
  ev.preventDefault();
  ev.stopPropagation();
  moveService(btn.getAttribute('data-service-id'),btn.getAttribute('data-service-move'));
},true);

document.addEventListener('pointerdown',ev=>{
  const handle=ev.target.closest('[data-service-drag]');
  if(handle)startDrag(ev,handle);
},true);
document.addEventListener('pointermove',moveDrag,{capture:true,passive:false});
document.addEventListener('pointerup',ev=>finishDrag(ev,false),true);
document.addEventListener('pointercancel',ev=>finishDrag(ev,true),true);

const observer=new MutationObserver(()=>{
  if(drag)return;
  clearTimeout(timer);
  timer=setTimeout(()=>enhance(false),90);
});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',()=>enhance(true));
})();
