(()=>{
'use strict';
const cfg=window.STUDIO_CONFIG||{};
const sb=(window.supabase&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY)?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
let busy=false,timer=null,lastIds=[];

function toast(msg){
  const e=document.querySelector('#toast');
  if(!e)return;
  e.textContent=msg;
  e.classList.add('show');
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>e.classList.remove('show'),2600);
}

function ensureStyles(){
  if(document.querySelector('#serviceOrderV6Styles'))return;
  const style=document.createElement('style');
  style.id='serviceOrderV6Styles';
  style.textContent=`
    .service-order-help{margin:0 0 14px;padding:12px 14px;border:1px solid rgba(212,175,55,.22);border-radius:12px;background:rgba(212,175,55,.055);color:#d8d8d3;font-size:13px;line-height:1.45}
    .service-order-help strong{color:#f0d580;display:block;margin-bottom:3px}
    #serviceList .row{gap:12px}
    #serviceList .row>div:first-child{min-width:0;flex:1}
    .service-order-number{display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:28px;margin-right:8px;padding:0 7px;border-radius:999px;border:1px solid rgba(212,175,55,.28);background:rgba(212,175,55,.07);color:#f0d580;font-size:12px;font-weight:800;vertical-align:middle}
    .service-order-controls{display:inline-flex;gap:6px;align-items:center}
    .service-order-controls .small-btn{min-width:38px;min-height:38px;padding:7px 9px;font-size:16px;line-height:1}
    .service-order-controls .small-btn:disabled{opacity:.3;cursor:not-allowed}
    @media(max-width:720px){#serviceList .row{align-items:flex-start;flex-direction:column}.service-order-controls{width:100%;flex-wrap:wrap}.service-order-controls .small-btn{flex:0 0 auto}.service-order-edit{margin-left:auto}}
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
  return row.querySelector('[data-edit-service]')?.getAttribute('data-edit-service')||row.querySelector('[data-toggle-service]')?.getAttribute('data-toggle-service')||'';
}

function addHelp(list){
  const card=list.closest('.card');
  if(!card||card.querySelector('.service-order-help'))return;
  const help=document.createElement('div');
  help.className='service-order-help';
  help.innerHTML='<strong>↕ Organizar sequência</strong>Use as setas para escolher a ordem em que os serviços aparecem. A ordem fica salva automaticamente.';
  list.before(help);
}

function decorateRows(list,ordered){
  const rows=[...list.children].filter(el=>el.classList.contains('row'));
  const byId=new Map(rows.map(r=>[String(getRowId(r)),r]));
  ordered.forEach(item=>{
    const row=byId.get(String(item.id));
    if(row)list.appendChild(row);
  });
  const finalRows=[...list.children].filter(el=>el.classList.contains('row'));
  finalRows.forEach((row,index)=>{
    const id=getRowId(row);
    if(!id)return;
    const info=row.children[0];
    const actions=row.querySelector('.actions');
    if(info&&!info.querySelector('.service-order-number')){
      const chip=document.createElement('span');
      chip.className='service-order-number';
      chip.textContent=String(index+1);
      info.insertBefore(chip,info.firstChild);
    }else if(info){
      const chip=info.querySelector('.service-order-number');
      if(chip)chip.textContent=String(index+1);
    }
    const edit=actions?.querySelector('[data-edit-service]');
    if(edit){edit.textContent='✏️ Editar';edit.classList.add('service-order-edit');}
    let controls=actions?.querySelector('.service-order-controls');
    if(actions&&!controls){
      controls=document.createElement('span');
      controls.className='service-order-controls';
      controls.innerHTML=`<button class="small-btn" type="button" data-service-move="up" data-service-id="${id}" title="Mover para cima" aria-label="Mover serviço para cima">↑</button><button class="small-btn" type="button" data-service-move="down" data-service-id="${id}" title="Mover para baixo" aria-label="Mover serviço para baixo">↓</button>`;
      actions.insertBefore(controls,actions.firstChild);
    }
    const up=actions?.querySelector('[data-service-move="up"]');
    const down=actions?.querySelector('[data-service-move="down"]');
    if(up)up.disabled=index===0;
    if(down)down.disabled=index===finalRows.length-1;
  });
}

async function enhance(force=false){
  const list=document.querySelector('#serviceList');
  if(!list||busy||!sb)return;
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
      decorateRows(list,ordered);
    }
  }catch(e){console.warn('Falha ao carregar ordem dos serviços',e)}
}

async function normalize(rows){
  const changes=rows.map((r,i)=>({id:r.id,current:Number(r.sort_order),next:i+1})).filter(x=>x.current!==x.next);
  for(const x of changes){
    const {error}=await sb.from('services').update({sort_order:x.next}).eq('id',x.id);
    if(error)throw error;
  }
}

async function moveService(id,dir){
  if(busy||!sb)return;
  busy=true;
  try{
    let rows=await fetchOrdered();
    await normalize(rows);
    rows=await fetchOrdered();
    const i=rows.findIndex(x=>String(x.id)===String(id));
    if(i<0)return;
    const j=dir==='up'?i-1:i+1;
    if(j<0||j>=rows.length)return;
    const a=rows[i],b=rows[j],ao=Number(a.sort_order),bo=Number(b.sort_order);
    let r=await sb.from('services').update({sort_order:bo}).eq('id',a.id);if(r.error)throw r.error;
    r=await sb.from('services').update({sort_order:ao}).eq('id',b.id);if(r.error)throw r.error;
    lastIds=[];
    toast('Ordem dos serviços atualizada.');
  }catch(e){
    console.error(e);
    toast('Não foi possível alterar a ordem.');
  }finally{
    busy=false;
    await enhance(true);
  }
}

document.addEventListener('click',ev=>{
  const btn=ev.target.closest('[data-service-move]');
  if(!btn)return;
  ev.preventDefault();
  ev.stopPropagation();
  moveService(btn.getAttribute('data-service-id'),btn.getAttribute('data-service-move'));
},true);

const observer=new MutationObserver(()=>{
  clearTimeout(timer);
  timer=setTimeout(()=>enhance(false),80);
});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',()=>enhance(true));
})();
