(function(){
  if(!window.__ADMIN_ENTRY__) return;
  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
  function renderSalonSettings(){
    const p=document.getElementById('settingsPanel'); if(!p) return;
    const profile=window.studioProfile||{};
    p.innerHTML=`<div class="admin-pro-breadcrumb">Painel / Configurações</div>
    <div class="admin-pro-page-head"><div><h1>Configurações</h1><p>Edite os dados principais do salão diretamente por aqui.</p></div></div>
    <div class="admin-pro-settings-grid">
      <div class="admin-pro-card">
        <h3>Dados do salão</h3>
        <div class="admin-mobile-settings-form">
          <div><label>Nome do salão</label><input id="adminDisplayName" value="${esc(profile.name||profile.displayName||'Studio Capricho Hair')}" placeholder="Nome do salão"></div>
          <div><label>Especialidade</label><input id="adminSpecialty" value="${esc(profile.specialty||'')}" placeholder="Ex.: Especializada em Alisamento"></div>
          <div><label>Apresentação</label><textarea id="adminBio" placeholder="Apresentação do Studio">${esc(profile.bio||'')}</textarea></div>
          <div><label>Instagram</label><input id="adminInstagram" value="${esc(profile.instagram||'')}" placeholder="@studiocapricho"></div>
          <div><label>Endereço</label><input id="adminAddress" value="${esc(profile.address||'')}" placeholder="Endereço completo"></div>
          <button class="admin-pro-primary" onclick="adminMobileSaveSalon()">Salvar dados do salão</button>
        </div>
      </div>
      <div class="admin-pro-card"><h3>Formas de pagamento</h3><p class="muted">Configure os meios aceitos no Studio.</p><button class="btn secondary" onclick="adminProOpen('paymentsPanel')">Configurar pagamentos</button></div>
      <div class="admin-pro-card"><h3>Política de agendamento</h3><p class="muted">Cancelamento, remarcação e disponibilidade.</p><button class="btn secondary" onclick="adminProOpen('availabilityPanel')">Abrir disponibilidade</button></div>
      <div class="admin-pro-card"><h3>Integrações</h3><p class="muted">Supabase conectado. WhatsApp e calendário externo podem ser adicionados futuramente.</p></div>
    </div>`;
  }
  window.adminMobileSaveSalon=async function(){
    try{
      if(typeof window.saveStudioProfile==='function'){
        const r=window.saveStudioProfile();
        if(r&&typeof r.then==='function') await r;
        if(typeof window.toast==='function') toast('Dados do salão salvos.');
      }else{
        const p=window.studioProfile||{};
        p.name=document.getElementById('adminDisplayName')?.value.trim()||p.name;
        p.specialty=document.getElementById('adminSpecialty')?.value.trim()||'';
        p.bio=document.getElementById('adminBio')?.value.trim()||'';
        p.instagram=document.getElementById('adminInstagram')?.value.trim()||'';
        p.address=document.getElementById('adminAddress')?.value.trim()||'';
        window.studioProfile=p;
        localStorage.setItem('sc_studio_profile',JSON.stringify(p));
        if(typeof window.toast==='function') toast('Dados do salão salvos neste dispositivo.');
      }
      renderSalonSettings();
    }catch(e){ if(typeof window.toast==='function') toast('Não foi possível salvar. Tente novamente.'); }
  };

  function bindTopMenu(){
    const btn=document.querySelector('.admin-pro-menu-toggle');
    const side=document.getElementById('adminProSidebar');
    if(!btn||!side) return false;
    btn.style.display='flex';
    btn.style.pointerEvents='auto';
    btn.style.position='relative';
    btn.style.zIndex='5001';
    if(!btn.__scBound){
      const toggle=function(ev){
        if(ev){ev.preventDefault();ev.stopPropagation();}
        side.classList.toggle('open');
      };
      btn.addEventListener('click',toggle,{passive:false});
      btn.addEventListener('touchend',function(ev){
        ev.preventDefault();ev.stopPropagation();
        side.classList.toggle('open');
      },{passive:false});
      btn.__scBound=true;
    }
    side.querySelectorAll('.admin-pro-nav button').forEach(b=>{
      if(!b.__scCloseBound){
        b.addEventListener('click',()=>side.classList.remove('open'));
        b.__scCloseBound=true;
      }
    });
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    bindTopMenu();
    if(typeof window.adminProOpen==='function'){
      if(!window.adminProOpen.__mobileSettingsFix){
        const old=window.adminProOpen;
        const wrapped=function(id){
          const r=old.apply(this,arguments);
          if(id==='settingsPanel')setTimeout(renderSalonSettings,0);
          setTimeout(bindTopMenu,0);
          return r
        };
        wrapped.__mobileSettingsFix=true; window.adminProOpen=wrapped;
      }
      if(bindTopMenu()) clearInterval(timer);
    } else if(tries>150){clearInterval(timer)}
  },100);

  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(bindTopMenu,100)});
  window.addEventListener('pageshow',()=>setTimeout(bindTopMenu,100));
})();