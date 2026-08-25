(()=>{'use strict';
const icons={home:'🏠',services:'✂️',pros:'👩‍🎨',bookings:'📅',profile:'👤'};
function enhanceNav(){document.querySelectorAll('[data-nav]').forEach(el=>{const id=el.getAttribute('data-nav');const icon=icons[id];if(!icon||el.dataset.iconEnhanced==='1')return;const text=el.textContent.trim();el.textContent=`${icon} ${text}`;el.dataset.iconEnhanced='1';});}
function enhanceActions(){document.querySelectorAll('[data-start-booking],#bookBtn,#drawerBook').forEach(el=>{if(el.dataset.iconEnhanced==='1')return;const text=el.textContent.trim();if(!text.includes('📅'))el.textContent=`📅 ${text}`;el.dataset.iconEnhanced='1';});}
function enhanceHeadings(){const map=[['Serviços','✂️'],['Profissionais','👩‍🎨'],['Meus agendamentos','📅'],['Perfil','👤']];document.querySelectorAll('h1,h2').forEach(el=>{if(el.dataset.iconEnhanced==='1')return;const t=el.textContent.trim();const hit=map.find(([label])=>t===label);if(hit){el.textContent=`${hit[1]} ${t}`;el.dataset.iconEnhanced='1';}});}
function run(){enhanceNav();enhanceActions();enhanceHeadings();}
const observer=new MutationObserver(()=>requestAnimationFrame(run));
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',run);run();
})();