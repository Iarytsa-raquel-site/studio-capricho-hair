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
      .client-menu-button{position:fixed;top:18px;left:16px;z-index:1200;width:44px;height:44px;border-radius:14px;border:1px solid rgba(215,169,63,.35);background:#111;color:#f2d27c;font-size:23px;display:grid;place-items:center;box-shadow:0 8px 28px rgba(0,0,0,.35);cursor:pointer}
      .client-menu-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.62);backdrop-filter:blur(2px);z-index:1190;opacity:0;pointer-events:none;transition:.22s ease}
      .client-menu-backdrop.open{opacity:1;pointer-events:auto}
      .client-drawer{position:fixed;top:0;left:0;bottom:0;width:min(82vw,320px);z-index:1195;background:linear-gradient(180deg,#151515,#0c0c0c);border-right:1px solid rgba(215,169,63,.22);transform:translateX(-105%);transition:.25s ease;box-shadow:18px 0 45px rgba(0,0,0,.45);padding:78px 14px 20px;overflow:auto}
      .client-drawer.open{transform:translateX(0)}
      .client-drawer-head{position:absolute;left:16px;right:16px;top:16px;display:flex;align-items:center;gap:10px}
      .client-drawer-logo{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;border:1px solid rgba(215,169,63,.35);color:#f2d27c;font-weight:700;background:#111}
      .client-drawer-head strong{display:block;color:#f4efe5;font-size:14px}.client-drawer-head small{color:#948977;font-size:11px}
      .client-menu-list{display:grid;gap:7px}.client-menu-item{width:100%;display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:14px;border:1px solid transparent;background:transparent;color:#e9e3d8;text-align:left;font-size:14px;cursor:pointer}
      .client-menu-item:hover,.client-menu-item.active{background:#1d1912;border-color:rgba(215,169,63,.28);color:#f2d27c}.client-menu-icon{width:25px;text-align:center;font-size:17px}
      .client-menu-sep{height:1px;background:#2a241b;margin:8px 4px}.client-menu-note{padding:10px 14px 0;color:#807666;font-size:11px;line-height:1.5}
      body.client-menu-ready header{padding-left:70px}
      body.client-menu-ready #clientApp{padding-bottom:24px}
      @media(max-width:520px){.client-menu-button{top:14px;left:12px;width:42px;height:42px}body.client-menu-ready header{padding-left:62px}.client-drawer{width:min(86vw,310px)}}
    `;
    document.head.appendChild(s);
  }

  function closeClientDrawer(){document.getElementById('clientDrawer')?.classList.remove('open');document.getElementById('clientDrawerBackdrop')?.classList.remove('open');}
  function openClientDrawer(){if(window.adminMode)return;document.getElementById('clientDrawer')?.classList.add('open');document.getElementById('clientDrawerBackdrop')?.classList.add('open');}
  window.openClientDrawer=openClientDrawer;window.closeClientDrawer=closeClientDrawer;

  function activateMenu(id){document.querySelectorAll('.client-menu-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===id));}

  function goClientMenuView(id){closeClientDrawer();activateMenu(id);if(typeof window.showClientView==='function')window.showClientView(id);}
  window.goClientMenuView=goClientMenuView;

  function ensureMenu(){
    if(window.adminMode||document.getElementById('clientDrawer'))return;
    addStyles();document.body.classList.add('client-menu-ready');
    const btn=document.createElement('button');btn.id='clientMenuButton';btn.className='client-menu-button';btn.innerHTML='☰';btn.setAttribute('aria-label','Abrir menu');btn.onclick=openClientDrawer;document.body.appendChild(btn);
    const backdrop=document.createElement('div');backdrop.id='clientDrawerBackdrop';backdrop.className='client-menu-backdrop';backdrop.onclick=closeClientDrawer;document.body.appendChild(backdrop);
    const drawer=document.createElement('aside');drawer.id='clientDrawer';drawer.className='client-drawer';drawer.innerHTML=`<div class="client-drawer-head"><div class="client-drawer-logo">SC</div><div><strong>Studio Capricho Hair</strong><small>Menu da cliente</small></div></div><div class="client-menu-list">${CLIENT_MENU.map(([id,icon,label])=>`<button class="client-menu-item ${id==='homeView'?'active':''}" data-view="${id}" onclick="goClientMenuView('${id}')"><span class="client-menu-icon">${icon}</span>${label}</button>`).join('')}<div class="client-menu-sep"></div><div class="client-menu-note">Agende seu horário, acompanhe seus atendimentos e conheça os trabalhos do Studio em um só lugar.</div></div>`;document.body.appendChild(drawer);
  }

  const originalShow=window.showClientView;
  if(originalShow&&!originalShow.__clientMenuPatched){
    const wrapped=async function(id,btn){const r=await originalShow.apply(this,arguments);activateMenu(id);closeClientDrawer();return r;};
    wrapped.__clientMenuPatched=true;window.showClientView=wrapped;
  }

  function syncVisibility(){const show=!window.adminMode;['clientMenuButton','clientDrawer','clientDrawerBackdrop'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display=show?'':'none';});document.body.classList.toggle('client-menu-ready',show);if(!show)closeClientDrawer();}
  const oldOpenAdmin=window.openAdminArea;if(oldOpenAdmin){window.openAdminArea=async function(){const r=await oldOpenAdmin.apply(this,arguments);syncVisibility();return r;};}
  const oldOpenClient=window.openClientArea;if(oldOpenClient){window.openClientArea=function(){const r=oldOpenClient.apply(this,arguments);ensureMenu();syncVisibility();return r;};}

  ensureMenu();syncVisibility();
  setTimeout(()=>{ensureMenu();syncVisibility();},700);
})();