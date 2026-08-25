(function(){
  if(!window.__ADMIN_ENTRY__) return;

  function moneySafe(v){
    try{return typeof window.money==='function'?window.money(Number(v||0)):Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
    catch(e){return 'R$ 0,00'}
  }

  function renderServicesPanel(){
    const p=document.getElementById('servicesPanel');
    if(!p) return;
    const list=Array.isArray(window.services)?window.services:[];
    p.innerHTML=`
      <div class="admin-pro-breadcrumb">Painel / Serviços</div>
      <div class="admin-pro-page-head">
        <div><h1>Serviços</h1><p>Cadastre, edite e organize os serviços oferecidos pelo Studio.</p></div>
      </div>
      <div class="admin-pro-card" style="margin-bottom:14px">
        <h3 style="margin-top:0">Novo serviço</h3>
        <div class="admin-mobile-settings-form">
          <div><label>Nome do serviço</label><input id="newServiceName" placeholder="Ex.: Escova"></div>
          <div><label>Preço</label><input id="newServicePrice" type="number" min="0" step="0.01" placeholder="0,00"></div>
          <div><label>Duração em minutos</label><input id="newServiceDuration" type="number" min="15" step="15" value="60"></div>
          <button class="admin-pro-primary" type="button" onclick="addService()">+ Adicionar serviço</button>
        </div>
      </div>
      <div class="admin-pro-card">
        <div class="admin-pro-card-head"><h3>Serviços cadastrados</h3><span class="muted">${list.length} item${list.length===1?'':'s'}</span></div>
        <div id="adminServiceList">
          ${list.length?list.map((s,i)=>`<div class="editable-item" style="padding:12px 0;border-bottom:1px solid #242427;display:flex;justify-content:space-between;gap:12px;align-items:center"><div><strong>${String(s.name||'Serviço')}</strong><div class="muted">${moneySafe(s.price)} • ${Number(s.duration||0)} min</div></div><div class="editable-actions" style="display:flex;gap:8px"><button class="small-btn" type="button" onclick="editService(${i})">Editar</button><button class="small-btn danger" type="button" onclick="removeService(${i})">Excluir</button></div></div>`).join(''):'<div class="admin-pro-empty">Nenhum serviço cadastrado.</div>'}
        </div>
      </div>`;
  }

  window.adminRenderServicesPanel=renderServicesPanel;

  let tries=0;
  const timer=setInterval(function(){
    tries++;
    if(typeof window.adminProOpen==='function'){
      if(!window.adminProOpen.__servicesFix){
        const old=window.adminProOpen;
        const wrapped=function(id){
          const r=old.apply(this,arguments);
          if(id==='servicesPanel') setTimeout(renderServicesPanel,0);
          return r;
        };
        wrapped.__servicesFix=true;
        window.adminProOpen=wrapped;
      }
      if(document.getElementById('servicesPanel')?.classList.contains('active')) renderServicesPanel();
      clearInterval(timer);
    } else if(tries>150){clearInterval(timer)}
  },100);

  const oldRenderAll=window.renderAll;
  if(typeof oldRenderAll==='function'&&!oldRenderAll.__servicesFix){
    const wrapped=function(){
      const r=oldRenderAll.apply(this,arguments);
      if(document.getElementById('servicesPanel')?.classList.contains('active')) setTimeout(renderServicesPanel,0);
      return r;
    };
    wrapped.__servicesFix=true;
    window.renderAll=wrapped;
  }

  window.addEventListener('pageshow',()=>setTimeout(()=>{if(document.getElementById('servicesPanel')?.classList.contains('active'))renderServicesPanel()},120));
})();