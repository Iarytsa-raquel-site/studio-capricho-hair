(function(){
  function cleanAdminHome(){
    const p=document.getElementById('adminHomePanel');
    if(!p)return;
    p.querySelectorAll('.admin-feature-photo,.shared-hero-card,#studioHomeImage').forEach(el=>el.remove());
    const accessTitle=[...p.querySelectorAll('.section-title,h3,h2')].find(el=>el.textContent.trim()==='Acesso rápido');
    if(accessTitle)accessTitle.remove();
    p.querySelectorAll('.admin-shortcuts').forEach(el=>el.remove());
  }

  function renderCleanAdminHome(){
    const p=document.getElementById('adminHomePanel');if(!p)return;
    const all=typeof getBookings==='function'?getBookings():[];
    const d=new Date(),today=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const todayJobs=all.filter(b=>b.date===today&&!['cancelado','recusado'].includes(b.status));
    const pending=all.filter(b=>b.status==='pendente').length;
    const completed=all.filter(b=>b.status==='concluido');
    const revenue=completed.reduce((s,b)=>s+Number(b.price||0),0);
    p.innerHTML=`<div class="section-kicker">Visão geral</div><h2 class="section-title" style="margin-top:0">Home do Studio</h2><div class="admin-home-grid"><div class="admin-home-card"><small>Atendimentos hoje</small><strong>${todayJobs.length}</strong></div><div class="admin-home-card"><small>Aguardando confirmação</small><strong>${pending}</strong></div><div class="admin-home-card"><small>Concluídos</small><strong>${completed.length}</strong></div><div class="admin-home-card"><small>Faturamento registrado</small><strong>${typeof money==='function'?money(revenue):`R$ ${revenue.toFixed(2).replace('.',',')}`}</strong></div></div>`;
  }

  function patch(){
    window.renderAdminHome=renderCleanAdminHome;
    const oldGo=window.goAdminPanel;
    if(oldGo&&!oldGo.__cleanHomePatched){
      const wrapped=function(id){const r=oldGo.apply(this,arguments);if(id==='adminHomePanel')setTimeout(renderCleanAdminHome,0);return r;};
      wrapped.__cleanHomePatched=true;window.goAdminPanel=wrapped;
    }
    if(document.getElementById('adminHomePanel'))renderCleanAdminHome();
    cleanAdminHome();
  }

  patch();
  setTimeout(patch,700);
  setTimeout(patch,1500);
  const obs=new MutationObserver(()=>cleanAdminHome());
  obs.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>obs.disconnect(),8000);
})();
