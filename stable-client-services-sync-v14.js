(()=>{
'use strict';
const cfg=window.STUDIO_CONFIG||{};
const sb=(window.supabase&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY)?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
if(!sb)return;
let rows=[],signature='',timer=null,checking=false;

function serviceIdFromCard(card){
  return card?.getAttribute('data-toggle-service')||card?.querySelector?.('[data-start-service]')?.getAttribute('data-start-service')||'';
}

function applyOrder(){
  if(!rows.length)return;
  const pos=new Map(rows.map((r,i)=>[String(r.id),i]));
  const cards=[...document.querySelectorAll('[data-toggle-service], article.card:has([data-start-service])')];
  const parents=new Map();
  cards.forEach(card=>{
    const target=card.matches('[data-toggle-service]')?card:card.closest('article.card');
    if(!target?.parentElement)return;
    const id=serviceIdFromCard(target);
    if(!id||!pos.has(String(id)))return;
    if(!parents.has(target.parentElement))parents.set(target.parentElement,[]);
    parents.get(target.parentElement).push(target);
  });
  parents.forEach((list,parent)=>{
    list.sort((a,b)=>(pos.get(String(serviceIdFromCard(a)))??99999)-(pos.get(String(serviceIdFromCard(b)))??99999));
    list.forEach(el=>parent.appendChild(el));
  });
}

function makeSignature(list){
  return list.map(x=>[x.id,x.sort_order,x.name,x.price,x.duration,x.active].join('~')).join('|');
}

function inBooking(){return !!document.querySelector('.booking-shell');}
function notify(msg){
  const e=document.querySelector('#toast');
  if(!e)return;
  e.textContent=msg;e.classList.add('show');clearTimeout(notify.t);notify.t=setTimeout(()=>e.classList.remove('show'),3200);
}

async function fetchServices(initial=false){
  if(checking)return;
  checking=true;
  try{
    const {data,error}=await sb.from('services').select('id,name,price,duration,active,sort_order,created_at').order('sort_order',{ascending:true,nullsFirst:false}).order('created_at',{ascending:true});
    if(error)throw error;
    const next=data||[],nextSig=makeSignature(next),changed=signature&&nextSig!==signature;
    rows=next;signature=nextSig;applyOrder();
    if(changed&&!initial){
      if(inBooking()) notify('Os serviços foram atualizados no Studio. A nova lista aparecerá ao sair deste agendamento.');
      else setTimeout(()=>location.reload(),450);
    }
  }catch(e){console.warn('Sincronização de serviços indisponível',e)}
  finally{checking=false}
}

const observer=new MutationObserver(()=>{
  clearTimeout(timer);
  timer=setTimeout(applyOrder,70);
});
observer.observe(document.documentElement,{childList:true,subtree:true});

window.addEventListener('load',()=>fetchServices(true));
window.addEventListener('focus',()=>fetchServices(false));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')fetchServices(false)});
setInterval(()=>fetchServices(false),30000);

try{
  sb.channel('client-services-live-v14')
    .on('postgres_changes',{event:'*',schema:'public',table:'services'},()=>{
      clearTimeout(timer);timer=setTimeout(()=>fetchServices(false),350);
    })
    .subscribe();
}catch(e){console.warn('Realtime de serviços indisponível',e)}
})();
