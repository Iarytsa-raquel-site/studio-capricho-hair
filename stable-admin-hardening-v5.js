(()=>{
'use strict';
if(window.__SC_HARDENING_V5__) return;
window.__SC_HARDENING_V5__=true;
const $=(s,r=document)=>r.querySelector(s);
const toast=(msg)=>{const el=$('#toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2600)};

// Evita apenas cliques realmente duplicados no mesmo controle.
let last={el:null,at:0};
document.addEventListener('click',(ev)=>{const el=ev.target.closest('button,a,[role="button"]');if(!el)return;const now=Date.now();if(last.el===el&&now-last.at<300){ev.preventDefault();ev.stopImmediatePropagation();return}last={el,at:now}},true);

// Proteção de submit: só marca o formulário; não desabilita o botão antes do handler principal.
document.addEventListener('submit',(ev)=>{const form=ev.target;if(!(form instanceof HTMLFormElement))return;if(form.dataset.submitting==='1'){ev.preventDefault();ev.stopImmediatePropagation();return}form.dataset.submitting='1';setTimeout(()=>{form.dataset.submitting='0'},2200)},true);

function closeMenu(){ $('#sidebar')?.classList.remove('open');$('#overlay')?.classList.remove('show');document.body.classList.remove('menu-open') }
document.addEventListener('click',(ev)=>{if(innerWidth<=900&&ev.target.closest('[data-page],[data-go]'))closeMenu()});
document.addEventListener('keydown',(ev)=>{if(ev.key==='Escape')closeMenu()});

function syncNetworkState(){const el=$('#connectionState');if(!el)return;if(!navigator.onLine){el.textContent='Sem internet';el.dataset.offline='1'}else if(el.dataset.offline==='1'){el.textContent='Conexão restaurada';delete el.dataset.offline;setTimeout(()=>$('#refreshButton')?.click(),500)}}
addEventListener('online',syncNetworkState);addEventListener('offline',syncNetworkState);syncNetworkState();

addEventListener('error',(ev)=>{console.error('[Studio Capricho v5]',ev.error||ev.message);if(!String(ev.message||'').toLowerCase().includes('script error'))toast('Ocorreu um erro nesta tela. Tente novamente.')});
addEventListener('unhandledrejection',(ev)=>{console.error('[Studio Capricho v5] Promise rejeitada:',ev.reason);toast('Uma operação não foi concluída. Tente novamente.')});

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&navigator.onLine){const last=Number(sessionStorage.getItem('sc_last_resume')||0),now=Date.now();if(now-last>30000){sessionStorage.setItem('sc_last_resume',String(now));setTimeout(()=>$('#refreshButton')?.click(),350)}}});

document.addEventListener('focusin',(ev)=>{if(innerWidth>900)return;const t=ev.target;if(!(t instanceof HTMLInputElement||t instanceof HTMLSelectElement||t instanceof HTMLTextAreaElement))return;setTimeout(()=>t.scrollIntoView({behavior:'smooth',block:'center'}),250)});

// Se o WebView mudar de largura/orientação, garante que overlays antigos não bloqueiem cliques.
addEventListener('resize',()=>{if(innerWidth>900)closeMenu()});
window.STUDIO_STABLE_BUILD='v5';
})();