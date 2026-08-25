(()=>{
'use strict';
if(window.__SC_HARDENING_V4__) return;
window.__SC_HARDENING_V4__=true;

const $=(s,r=document)=>r.querySelector(s);
const toast=(msg)=>{
  const el=$('#toast');
  if(!el) return;
  el.textContent=msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>el.classList.remove('show'),2600);
};

// Evita toques/cliques duplicados no WebView/Android sem bloquear navegação normal.
let lastAction={key:'',at:0};
document.addEventListener('click',(ev)=>{
  const btn=ev.target.closest('button,a,[role="button"]');
  if(!btn) return;
  const key=[btn.id,btn.dataset.page,btn.dataset.go,btn.dataset.status,btn.dataset.id,btn.dataset.editService,btn.dataset.toggleService,btn.textContent?.trim()].filter(Boolean).join('|');
  const now=Date.now();
  if(key && lastAction.key===key && now-lastAction.at<450){
    ev.preventDefault();
    ev.stopImmediatePropagation();
    return;
  }
  lastAction={key,at:now};
},true);

// Durante submits, impede envio repetido e reabilita em caso de erro/timeout.
document.addEventListener('submit',(ev)=>{
  const form=ev.target;
  if(!(form instanceof HTMLFormElement)) return;
  if(form.dataset.submitting==='1'){
    ev.preventDefault();
    ev.stopImmediatePropagation();
    return;
  }
  form.dataset.submitting='1';
  const buttons=[...form.querySelectorAll('button[type="submit"]')];
  buttons.forEach(b=>{b.dataset.oldDisabled=String(b.disabled);b.disabled=true;b.classList.add('is-loading')});
  setTimeout(()=>{
    form.dataset.submitting='0';
    buttons.forEach(b=>{b.disabled=b.dataset.oldDisabled==='true';b.classList.remove('is-loading')});
  },1800);
},true);

// Fecha o menu mobile após mudança de rota e ao usar voltar/ESC.
document.addEventListener('click',(ev)=>{
  if(ev.target.closest('[data-page],[data-go]') && innerWidth<=900){
    $('#sidebar')?.classList.remove('open');
    $('#overlay')?.classList.remove('show');
  }
});
document.addEventListener('keydown',(ev)=>{
  if(ev.key==='Escape'){
    $('#sidebar')?.classList.remove('open');
    $('#overlay')?.classList.remove('show');
  }
});

// Feedback de conectividade para atendimento no celular.
function syncNetworkState(){
  const el=$('#connectionState');
  if(!el) return;
  if(!navigator.onLine){
    el.textContent='Sem internet';
    el.dataset.offline='1';
  }else if(el.dataset.offline==='1'){
    el.textContent='Conexão restaurada';
    delete el.dataset.offline;
    setTimeout(()=>$('#refreshButton')?.click(),500);
  }
}
window.addEventListener('online',syncNetworkState);
window.addEventListener('offline',syncNetworkState);
syncNetworkState();

// Erros inesperados ficam registrados, mas não derrubam a interface.
window.addEventListener('error',(ev)=>{
  console.error('[Studio Capricho v4]',ev.error||ev.message);
  if(String(ev.message||'').toLowerCase().includes('script error')) return;
  toast('Ocorreu um erro nesta tela. Atualize os dados e tente novamente.');
});
window.addEventListener('unhandledrejection',(ev)=>{
  console.error('[Studio Capricho v4] Promise rejeitada:',ev.reason);
  toast('Uma operação não foi concluída. Tente novamente.');
});

// Melhora estabilidade ao voltar do segundo plano no Android/WebView.
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible' && navigator.onLine){
    const last=Number(sessionStorage.getItem('sc_last_resume')||0);
    const now=Date.now();
    if(now-last>30000){
      sessionStorage.setItem('sc_last_resume',String(now));
      setTimeout(()=>$('#refreshButton')?.click(),350);
    }
  }
});

// Impede campos e botões ficarem escondidos atrás do teclado em telas pequenas.
document.addEventListener('focusin',(ev)=>{
  if(innerWidth>900) return;
  const t=ev.target;
  if(!(t instanceof HTMLInputElement||t instanceof HTMLSelectElement||t instanceof HTMLTextAreaElement)) return;
  setTimeout(()=>t.scrollIntoView({behavior:'smooth',block:'center'}),250);
});

// Marca build para diagnóstico sem afetar dados.
window.STUDIO_STABLE_BUILD='v4';
})();