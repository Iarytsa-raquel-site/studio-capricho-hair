(function(){
  if(!window.__ADMIN_ENTRY__) return;

  let menuAberto=false;
  const MOBILE_NAV=[
    ['dashboard','▦','Dashboard'],
    ['agendaPanel','📅','Agenda'],
    ['agendaPanel','📋','Agendamentos'],
    ['clientsPanel','👥','Clientes'],
    ['teamPanel','🧑‍💼','Profissionais / Equipe'],
    ['servicesPanel','✂️','Serviços'],
    ['performancePanel','💰','Financeiro'],
    ['reportsPanel','📈','Relatórios'],
    ['settingsPanel','⚙️','Configurações']
  ];

  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
  function getSidebar(){return document.getElementById('adminProSidebar')}

  function ensureSidebarContents(){
    const side=getSidebar(); if(!side) return false;
    let brand=side.querySelector('.admin-pro-brand');
    if(!brand){
      brand=document.createElement('div');brand.className='admin-pro-brand';
      brand.innerHTML='<div class="admin-pro-brand-mark">SC</div><div><strong>Studio Capricho</strong><small>Painel administrativo</small></div>';
      side.prepend(brand);
    }
    let nav=side.querySelector('.admin-pro-nav');
    if(!nav){nav=document.createElement('nav');nav.className='admin-pro-nav';side.appendChild(nav)}
    if(nav.querySelectorAll('button').length===0){
      nav.innerHTML=MOBILE_NAV.map(([id,ico,label],i)=>`<button type="button" data-pro="${id}" class="${i===0?'active':''}"><span class="ico">${ico}</span><span>${label}</span></button>`).join('');
    }
    nav.querySelectorAll('button').forEach(b=>{
      b.style.display='flex';b.style.visibility='visible';b.style.opacity='1';b.style.pointerEvents='auto';
      if(!b.__scNavBound){
        b.addEventListener('click',function(ev){
          ev.preventDefault();ev.stopPropagation();
          const id=this.dataset.pro;
          if(id&&typeof window.adminProOpen==='function') window.adminProOpen(id);
          setTimeout(()=>setMenu(false),30);
        });
        b.__scNavBound=true;
      }
    });
    return true;
  }

  function ensureOverlay(){
    let o=document.getElementById('adminProOverlay');
    if(!o){o=document.createElement('div');o.id='adminProOverlay';o.className='admin-pro-overlay';document.body.appendChild(o)}
    return o;
  }
  function syncMenu(){
    const side=getSidebar(),overlay=ensureOverlay();
    if(!side)return;
    ensureSidebarContents();
    side.classList.toggle('open',menuAberto);
    overlay.classList.toggle('show',menuAberto);
    document.body.classList.toggle('admin-menu-open',menuAberto);
    const btn=document.querySelector('.admin-pro-menu-toggle');
    if(btn){btn.setAttribute('aria-expanded',menuAberto?'true':'false');btn.setAttribute('aria-label',menuAberto?'Fechar menu':'Abrir menu')}
  }
  function setMenu(aberto){menuAberto=!!aberto;syncMenu()}
  function toggleMenu(){ensureSidebarContents();setMenu(!menuAberto)}
  window.adminMobileOpenMenu=()=>setMenu(true);
  window.adminMobileCloseMenu=()=>setMenu(false);
  window.adminMobileToggleMenu=toggleMenu;

  function bindMenu(){
    const side=getSidebar(),btn=document.querySelector('.admin-pro-menu-toggle');
    if(!side||!btn)return false;
    ensureSidebarContents();
    btn.style.display='flex';btn.style.pointerEvents='auto';
    btn.onclick=function(ev){ev.preventDefault();ev.stopPropagation();toggleMenu()};
    const overlay=ensureOverlay();
    overlay.onclick=function(ev){ev.preventDefault();setMenu(false)};
    let collapse=side.querySelector('.admin-mobile-collapse');
    if(!collapse){
      collapse=document.createElement('button');collapse.type='button';collapse.className='admin-mobile-collapse';
      collapse.innerHTML='<span>⇤</span> Recolher menu';collapse.onclick=function(ev){ev.preventDefault();setMenu(false)};side.appendChild(collapse);
    }
    syncMenu();
    return true;
  }

  function renderSalonSettings(){
    const p=document.getElementById('settingsPanel'); if(!p) return;
    const profile=window.studioProfile||{};
    p.innerHTML=`<div class="admin-pro-breadcrumb">Painel / Configurações</div><div class="admin-pro-page-head"><div><h1>Configurações</h1><p>Edite os dados principais do salão diretamente por aqui.</p></div></div><div class="admin-pro-settings-grid"><div class="admin-pro-card"><h3>Dados do salão</h3><div class="admin-mobile-settings-form"><div><label>Nome do salão</label><input id="adminDisplayName" value="${esc(profile.name||profile.displayName||'Studio Capricho Hair')}" placeholder="Nome do salão"></div><div><label>Especialidade</label><input id="adminSpecialty" value="${esc(profile.specialty||'')}" placeholder="Ex.: Especializada em Alisamento"></div><div><label>Apresentação</label><textarea id="adminBio" placeholder="Apresentação do Studio">${esc(profile.bio||'')}</textarea></div><div><label>Instagram</label><input id="adminInstagram" value="${esc(profile.instagram||'')}" placeholder="@studiocapricho"></div><div><label>Endereço</label><input id="adminAddress" value="${esc(profile.address||'')}" placeholder="Endereço completo"></div><button class="admin-pro-primary" onclick="adminMobileSaveSalon()">Salvar dados do salão</button></div></div><div class="admin-pro-card"><h3>Formas de pagamento</h3><p class="muted">Configure os meios aceitos no Studio.</p><button class="btn secondary" onclick="adminProOpen('paymentsPanel')">Configurar pagamentos</button></div><div class="admin-pro-card"><h3>Política de agendamento</h3><p class="muted">Cancelamento, remarcação e disponibilidade.</p><button class="btn secondary" onclick="adminProOpen('availabilityPanel')">Abrir disponibilidade</button></div><div class="admin-pro-card"><h3>Integrações</h3><p class="muted">Supabase conectado. WhatsApp e calendário externo podem ser adicionados futuramente.</p></div></div>`;
  }

  window.adminMobileSaveSalon=async function(){
    try{
      const p=window.studioProfile||{};
      p.name=document.getElementById('adminDisplayName')?.value.trim()||p.name;
      p.specialty=document.getElementById('adminSpecialty')?.value.trim()||'';
      p.bio=document.getElementById('adminBio')?.value.trim()||'';
      p.instagram=document.getElementById('adminInstagram')?.value.trim()||'';
      p.address=document.getElementById('adminAddress')?.value.trim()||'';
      window.studioProfile=p;localStorage.setItem('sc_studio_profile',JSON.stringify(p));
      if(typeof window.toast==='function') toast('Dados do salão salvos.');
      renderSalonSettings();
    }catch(e){ if(typeof window.toast==='function') toast('Não foi possível salvar. Tente novamente.'); }
  };

  let tries=0;
  const timer=setInterval(()=>{
    tries++;bindMenu();
    if(typeof window.adminProOpen==='function'){
      if(!window.adminProOpen.__mobileSettingsFix){
        const old=window.adminProOpen;
        const wrapped=function(id){const r=old.apply(this,arguments);if(id==='settingsPanel')setTimeout(renderSalonSettings,0);if(window.innerWidth<=760)setTimeout(()=>setMenu(false),30);setTimeout(bindMenu,0);return r};
        wrapped.__mobileSettingsFix=true;window.adminProOpen=wrapped;
      }
      if(bindMenu()) clearInterval(timer);
    } else if(tries>180){clearInterval(timer)}
  },100);

  const observer=new MutationObserver(()=>{ensureSidebarContents();bindMenu()});
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',()=>{if(window.innerWidth>760)setMenu(false);else syncMenu()});
  window.addEventListener('pageshow',()=>setTimeout(bindMenu,100));
})();