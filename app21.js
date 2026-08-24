(function(){
  const CLIENT_MENU=[
    ['homeView','🏠','Início'],
    ['bookView','📅','Agendar horário'],
    ['myBookingsView','🗓️','Meus agendamentos'],
    ['portfolioView','🖼️','Portfólio'],
    ['professionalView','✂️','Profissional'],
    ['profileView','👤','Perfil e contato']
  ];

  function addStyles(){
    if(document.getElementById('clientDrawerStyle'))return;
    const s=document.createElement('style');s.id='clientDrawerStyle';
    s.textContent=`
      #clientNav{display:none!important}
      body.client-menu-ready{overflow-x:hidden}
      body.client-menu-ready .app{width:100%;max-width:480px;min-height:100dvh;margin:0 auto;overflow-x:hidden}
      body.client-menu-ready header{min-height:64px;padding:10px 12px 10px 64px;gap:8px}
      body.client-menu-ready header .brand{min-width:0;gap:8px}
      body.client-menu-ready header .logo{width:38px;height:38px;border-radius:12px;font-size:14px;flex:none}
      body.client-menu-ready header .brand strong{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px}
      body.client-menu-ready header .brand small{font-size:8px}
      body.client-menu-ready header .sync-badge{display:none}
      body.client-menu-ready header .mode-btn{display:none!important}
      body.client-menu-ready #clientApp{padding:14px 12px calc(28px + env(safe-area-inset-bottom));width:100%;overflow-x:hidden}
      body.client-menu-ready #clientApp section{width:100%;max-width:100%;overflow-x:hidden}
      body.client-menu-ready .section-title{font-size:21px;margin:24px 0 12px}
      body.client-menu-ready .card,body.client-menu-ready .feature,body.client-menu-ready .profile-cover,body.client-menu-ready .contact-card{border-radius:16px}
      body.client-menu-ready input,body.client-menu-ready select,body.client-menu-ready textarea{font-size:16px}
      body.client-menu-ready .btn{min-height:50px;font-size:14px}
      body.client-menu-ready .sticky-book{bottom:14px;width:calc(100% - 24px);max-width:456px}
      .client-menu-button{position:fixed;top:max(11px,env(safe-area-inset-top));left:12px;z-index:1200;width:42px;height:42px;border-radius:13px;border:1px solid rgba(215,169,63,.35);background:#111;color:#f2d27c;font-size:22px;display:grid;place-items:center;box-shadow:0 8px 28px rgba(0,0,0,.35);cursor:pointer;-webkit-tap-highlight-color:transparent}
      .client-menu-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.66);backdrop-filter:blur(3px);z-index:1190;opacity:0;pointer-events:none;transition:.22s ease}
      .client-menu-backdrop.open{opacity:1;pointer-events:auto}
      .client-drawer{position:fixed;top:0;left:0;bottom:0;width:min(88vw,330px);z-index:1195;background:linear-gradient(180deg,#151515,#0c0c0c);border-right:1px solid rgba(215,169,63,.22);transform:translateX(-105%);transition:.25s ease;box-shadow:18px 0 45px rgba(0,0,0,.45);padding:calc(74px + env(safe-area-inset-top)) 12px calc(20px + env(safe-area-inset-bottom));overflow-y:auto;overscroll-behavior:contain}
      .client-drawer.open{transform:translateX(0)}
      .client-drawer-head{position:absolute;left:14px;right:14px;top:calc(14px + env(safe-area-inset-top));display:flex;align-items:center;gap:10px}
      .client-drawer-logo{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;border:1px solid rgba(215,169,63,.35);color:#f2d27c;font-weight:700;background:#111;flex:none}
      .client-drawer-head strong{display:block;color:#f4efe5;font-size:14px}.client-drawer-head small{color:#948977;font-size:10px}
      .client-menu-list{display:grid;gap:6px}.client-menu-item{width:100%;display:flex;align-items:center;gap:12px;padding:14px 13px;min-height:50px;border-radius:14px;border:1px solid transparent;background:transparent;color:#e9e3d8;text-align:left;font-size:14px;cursor:pointer;-webkit-tap-highlight-color:transparent}
      .client-menu-item:active,.client-menu-item.active{background:#1d1912;border-color:rgba(215,169,63,.28);color:#f2d27c}.client-menu-icon{width:26px;text-align:center;font-size:18px;flex:none}
      .client-menu-sep{height:1px;background:#2a241b;margin:8px 4px}.client-menu-note{padding:10px 13px 0;color:#807666;font-size:11px;line-height:1.5}
      @media(max-width:480px){
        body.client-menu-ready .app{max-width:none}
        body.client-menu-ready .grid.two{grid-template-columns:1fr}
        body.client-menu-ready .row{flex-direction:column;gap:0}
        body.client-menu-ready .slots{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
        body.client-menu-ready .slot{padding:12px 4px;font-size:13px}
        body.client-menu-ready .portfolio-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
        body.client-menu-ready .work-meta{padding:9px;font-size:12px}
        body.client-menu-ready .hero-photo{border-radius:20px;margin-bottom:15px}
        body.client-menu-ready .hero-photo::after{font-size:21px;left:14px;bottom:16px;width:68%}
        body.client-menu-ready .profile-head{align-items:flex-start}
        body.client-menu-ready .avatar{width:58px;height:58px;border-radius:18px;font-size:19px}
        body.client-menu-ready .booking-card{padding:13px}
      }
      @media(max-width:360px){
        body.client-menu-ready header .brand strong{max-width:135px;font-size:13px}
        body.client-menu-ready .slots{grid-template-columns:repeat(2,minmax(0,1fr))}
        body.client-menu-ready .portfolio-grid{grid-template-columns:1fr 1fr}
        .client-drawer{width:92vw}
      }
    `;
    document.head.appendChild(s);
  }

  function closeClientDrawer(){document.getElementById('clientDrawer')?.classList.remove('open');document.getElementById('clientDrawerBackdrop')?.classList.remove('open');}
  function openClientDrawer(){if(window.adminMode)return;document.getElementById('clientDrawer')?.classList.add('open');document.getElementById('clientDrawerBackdrop')?.classList.add('open');}
  window.openClientDrawer=openClientDrawer;window.closeClientDrawer=closeClientDrawer;
  function activateMenu(id){document.querySelectorAll('.client-menu-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===id));}
  function goClientMenuView(id){closeClientDrawer();activateMenu(id);if(typeof window.showClientView==='function')window.showClientView(id);}
  window.goClientMenuView=goClientMenuView;
  function ensureMenu(){if(window.adminMode||document.getElementById('clientDrawer'))return;addStyles();document.body.classList.add('client-menu-ready');const btn=document.createElement('button');btn.id='clientMenuButton';btn.className='client-menu-button';btn.innerHTML='☰';btn.setAttribute('aria-label','Abrir menu');btn.onclick=openClientDrawer;document.body.appendChild(btn);const backdrop=document.createElement('div');backdrop.id='clientDrawerBackdrop';backdrop.className='client-menu-backdrop';backdrop.onclick=closeClientDrawer;document.body.appendChild(backdrop);const drawer=document.createElement('aside');drawer.id='clientDrawer';drawer.className='client-drawer';drawer.innerHTML=`<div class="client-drawer-head"><div class="client-drawer-logo">SC</div><div><strong>Studio Capricho Hair</strong><small>Menu da cliente</small></div></div><div class="client-menu-list">${CLIENT_MENU.map(([id,icon,label])=>`<button class="client-menu-item ${id==='homeView'?'active':''}" data-view="${id}" onclick="goClientMenuView('${id}')"><span class="client-menu-icon">${icon}</span>${label}</button>`).join('')}<div class="client-menu-sep"></div><div class="client-menu-note">Agende seu horário, acompanhe seus atendimentos e conheça os trabalhos do Studio em um só lugar.</div></div>`;document.body.appendChild(drawer);}
  const originalShow=window.showClientView;if(originalShow&&!originalShow.__clientMenuPatched){const wrapped=async function(id,btn){const r=await originalShow.apply(this,arguments);activateMenu(id);closeClientDrawer();return r;};wrapped.__clientMenuPatched=true;window.showClientView=wrapped;}
  function syncVisibility(){const show=!window.adminMode;['clientMenuButton','clientDrawer','clientDrawerBackdrop'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display=show?'':'none';});document.body.classList.toggle('client-menu-ready',show);if(!show)closeClientDrawer();}
  const oldOpenAdmin=window.openAdminArea;if(oldOpenAdmin){window.openAdminArea=async function(){const r=await oldOpenAdmin.apply(this,arguments);syncVisibility();return r;};}
  const oldOpenClient=window.openClientArea;if(oldOpenClient){window.openClientArea=function(){const r=oldOpenClient.apply(this,arguments);ensureMenu();syncVisibility();return r;};}
  ensureMenu();syncVisibility();setTimeout(()=>{ensureMenu();syncVisibility();},700);
})();