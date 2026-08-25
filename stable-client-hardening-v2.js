(()=>{'use strict';
const $=s=>document.querySelector(s);let lastTap={el:null,at:0};
function closeDrawerSafe(){const d=$('#drawer'),b=$('#backdrop');d?.classList.remove('open');b?.classList.remove('open');document.body.classList.remove('drawer-open')}
function normalizeViewport(){if(innerWidth>900)closeDrawerSafe();document.documentElement.style.setProperty('--app-height',`${window.innerHeight}px`)}
window.addEventListener('resize',normalizeViewport,{passive:true});window.addEventListener('orientationchange',()=>setTimeout(normalizeViewport,120),{passive:true});normalizeViewport();
document.addEventListener('click',e=>{const btn=e.target.closest('button,[role="button"]');if(!btn)return;const now=Date.now();if(lastTap.el===btn&&now-lastTap.at<350){e.preventDefault();e.stopImmediatePropagation();return}lastTap={el:btn,at:now}},true);
document.addEventListener('submit',e=>{const f=e.target;if(!(f instanceof HTMLFormElement))return;const s=f.querySelector('[type="submit"]');if(s?.dataset.sending==='1'){e.preventDefault();return}if(s){s.dataset.sending='1';setTimeout(()=>{delete s.dataset.sending},1200)}},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawerSafe()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){normalizeViewport();window.dispatchEvent(new Event('sc-client-resume'))}});
window.addEventListener('online',()=>{document.body.classList.remove('offline');window.dispatchEvent(new Event('sc-client-resume'))});window.addEventListener('offline',()=>document.body.classList.add('offline'));
document.addEventListener('focusin',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))setTimeout(()=>e.target.scrollIntoView({block:'center',behavior:'smooth'}),180)});
window.addEventListener('error',e=>{console.error('Client UI error:',e.error||e.message)});window.addEventListener('unhandledrejection',e=>{console.error('Client async error:',e.reason)});
})();