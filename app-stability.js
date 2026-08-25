(function(){
  'use strict';
  if(window.__SC_STABILITY_LOADED__) return;
  window.__SC_STABILITY_LOADED__=true;

  function safeJson(value,fallback){
    try{const parsed=JSON.parse(value);return parsed==null?fallback:parsed}catch(e){return fallback}
  }

  // Protege os dados locais contra JSON corrompido e evita travar o app ao abrir.
  window.getBookings=function(){
    const v=safeJson(localStorage.getItem('sc_bookings'),'__bad__');
    if(v==='__bad__'||!Array.isArray(v)){
      try{localStorage.setItem('sc_bookings','[]')}catch(e){}
      return [];
    }
    return v;
  };
  window.saveBookings=function(items){
    try{localStorage.setItem('sc_bookings',JSON.stringify(Array.isArray(items)?items:[]));return true}
    catch(e){return false}
  };

  window.money=function(v){
    const n=Number(v);
    return (Number.isFinite(n)?n:0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  };
  window.fmtDate=function(iso){
    if(!iso||typeof iso!=='string') return '';
    const p=iso.split('-');
    return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:iso;
  };
  window.addMinutes=function(hhmm,mins){
    if(!hhmm||typeof hhmm!=='string'||!hhmm.includes(':')) return '';
    const p=hhmm.split(':').map(Number); if(p.some(Number.isNaN)) return '';
    const d=new Date(2000,0,1,p[0],p[1]+Number(mins||0));
    return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  };

  // Toast nunca deve derrubar a navegação se o elemento ainda não existir.
  let toastTimer=null;
  window.toast=function(msg){
    let el=document.getElementById('toast');
    if(!el){el=document.createElement('div');el.id='toast';el.className='toast hidden';document.body.appendChild(el)}
    el.textContent=String(msg||'');el.classList.remove('hidden');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),2600);
  };

  function closeDuplicateOverlays(){
    document.querySelectorAll('.admin-pro-overlay').forEach((el,i)=>{if(i>0)el.remove()});
    document.querySelectorAll('#adminProSidebar').forEach((el,i)=>{if(i>0)el.remove()});
  }

  function normalizeButtons(root=document){
    root.querySelectorAll('button,[role="button"],.clickable,.admin-pro-nav button').forEach(el=>{
      el.style.touchAction='manipulation';
      el.style.webkitTapHighlightColor='transparent';
      if(el.tagName==='BUTTON'&&!el.getAttribute('type')) el.setAttribute('type','button');
    });
  }

  function fixMobileAdmin(){
    if(!window.__ADMIN_ENTRY__) return;
    closeDuplicateOverlays();normalizeButtons();
    const side=document.getElementById('adminProSidebar');
    const btn=document.querySelector('.admin-pro-menu-toggle');
    if(btn){
      btn.style.display='flex';btn.style.pointerEvents='auto';btn.disabled=false;
      if(!btn.__stableFallback){
        btn.addEventListener('pointerup',function(ev){
          if(ev.pointerType==='mouse') return;
          ev.preventDefault();ev.stopPropagation();
          if(typeof window.adminMobileToggleMenu==='function') window.adminMobileToggleMenu();
          else side?.classList.toggle('open');
        },{passive:false});
        btn.__stableFallback=true;
      }
    }
    if(side){
      side.style.visibility='visible';
      side.querySelectorAll('.admin-pro-nav button').forEach(b=>{b.style.display='flex';b.style.pointerEvents='auto';b.disabled=false});
    }
  }

  // Evita que um erro assíncrono isolado congele a experiência do WebView.
  window.addEventListener('unhandledrejection',function(ev){
    console.error('[Studio Capricho] erro assíncrono:',ev.reason);
    ev.preventDefault();
  });
  window.addEventListener('error',function(ev){
    console.error('[Studio Capricho] erro:',ev.error||ev.message);
  });

  // Fecha menu lateral ao voltar do background do Android e restaura clique do topo.
  document.addEventListener('visibilitychange',function(){
    if(!document.hidden){setTimeout(()=>{normalizeButtons();fixMobileAdmin()},80)}
  });
  window.addEventListener('pageshow',function(){setTimeout(()=>{normalizeButtons();fixMobileAdmin()},80)});

  const observer=new MutationObserver(function(mutations){
    let needs=false;
    for(const m of mutations){if(m.addedNodes&&m.addedNodes.length){needs=true;break}}
    if(needs){normalizeButtons();fixMobileAdmin()}
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  document.addEventListener('DOMContentLoaded',function(){normalizeButtons();fixMobileAdmin()});
  setTimeout(()=>{normalizeButtons();fixMobileAdmin()},300);
  setTimeout(()=>{normalizeButtons();fixMobileAdmin()},1000);
})();