(function(){
  let displayPhotos={hero:'',profile:''};

  function addStyles(){
    if(document.getElementById('displayPhotosStyle'))return;
    const s=document.createElement('style');s.id='displayPhotosStyle';
    s.textContent=`.display-photo-grid{display:grid;gap:16px}.display-photo-card{background:linear-gradient(180deg,#151515,#0f0f0f);border:1px solid #342c20;border-radius:20px;padding:16px}.display-photo-card h3{margin:0 0 5px;color:#f2d27c;font-family:Georgia,serif}.display-photo-card .muted{font-size:12px;line-height:1.5}.display-photo-preview{margin-top:13px;border-radius:16px;overflow:hidden;border:1px solid #30291f;background:#090909;min-height:150px;display:grid;place-items:center}.display-photo-preview img{display:block;width:100%;height:220px;object-fit:cover}.display-photo-preview span{color:#746c60;font-size:12px;padding:20px}.display-photo-card input[type=file]{display:block;width:100%;margin-top:13px}.display-photo-actions{display:flex;gap:9px;margin-top:12px}.display-photo-actions .btn{flex:1}.display-photo-note{margin-top:9px;color:#a99d87;font-size:11px}.client-profile-display{overflow:hidden;border-radius:22px;border:1px solid rgba(215,169,63,.25);margin:0 0 18px;background:#0d0d0d}.client-profile-display img{display:block;width:100%;height:310px;object-fit:cover;object-position:center 35%}@media(max-width:540px){.display-photo-preview img{height:190px}.client-profile-display img{height:280px}}`;
    document.head.appendChild(s);
  }

  function ensurePanel(){
    const dash=document.getElementById('adminDashboard');if(!dash)return null;
    let p=document.getElementById('displayPhotosPanel');
    if(!p){p=document.createElement('div');p.id='displayPhotosPanel';p.className='admin-panel';dash.appendChild(p);}
    return p;
  }

  function insertMenuItem(){
    if(!window.adminMode)return;
    const drawer=document.getElementById('adminDrawer');if(!drawer||drawer.querySelector('[data-panel="displayPhotosPanel"]'))return;
    const list=drawer.querySelector('.admin-menu-list');if(!list)return;
    const profileBtn=list.querySelector('[data-panel="profilePanel"]');
    const btn=document.createElement('button');btn.className='admin-menu-item';btn.dataset.panel='displayPhotosPanel';btn.innerHTML='<span class="admin-menu-icon">▣</span>Fotos de exibição';btn.onclick=()=>openDisplayPhotosPanel();
    if(profileBtn)profileBtn.insertAdjacentElement('beforebegin',btn);else list.appendChild(btn);
  }

  function openDisplayPhotosPanel(){
    const p=ensurePanel();if(!p)return;
    document.querySelectorAll('#adminDashboard .admin-panel').forEach(x=>x.classList.remove('active'));
    p.classList.add('active');
    document.querySelectorAll('.admin-menu-item').forEach(x=>x.classList.toggle('active',x.dataset.panel==='displayPhotosPanel'));
    window.closeAdminDrawer?.();renderPanel();window.scrollTo({top:0,behavior:'smooth'});
  }
  window.openDisplayPhotosPanel=openDisplayPhotosPanel;

  function renderPanel(){
    const p=ensurePanel();if(!p)return;
    p.innerHTML=`<div class="section-kicker">Aparência do app</div><h2 class="section-title" style="margin-top:0">Fotos de exibição</h2><p class="muted">Altere aqui as imagens que aparecem automaticamente para as clientes. As mudanças ficam salvas no Supabase e valem para todos os dispositivos.</p><div class="display-photo-grid"><div class="display-photo-card"><h3>Foto principal da Home</h3><div class="muted">Aparece no topo da tela inicial das clientes e na Home do painel do Studio.</div><div id="displayHeroPreview" class="display-photo-preview">${displayPhotos.hero?`<img src="${displayPhotos.hero}" alt="Foto principal">`:'<span>Nenhuma foto configurada</span>'}</div><input id="displayHeroFile" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewDisplayPhoto('hero')"><div class="display-photo-actions"><button class="btn primary" onclick="saveDisplayPhoto('hero')">Salvar foto da Home</button></div><div id="displayHeroStatus" class="display-photo-note">JPG, PNG ou WebP • máximo 5 MB.</div></div><div class="display-photo-card"><h3>Foto do Perfil / Profissional</h3><div class="muted">Aparece na área de Perfil e na apresentação da profissional no app das clientes.</div><div id="displayProfilePreview" class="display-photo-preview">${displayPhotos.profile?`<img src="${displayPhotos.profile}" alt="Foto de perfil">`:'<span>Nenhuma foto configurada</span>'}</div><input id="displayProfileFile" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewDisplayPhoto('profile')"><div class="display-photo-actions"><button class="btn primary" onclick="saveDisplayPhoto('profile')">Salvar foto do Perfil</button></div><div id="displayProfileStatus" class="display-photo-note">JPG, PNG ou WebP • máximo 5 MB.</div></div></div>`;
  }

  function validFile(file){
    if(!file)return 'Escolha uma foto primeiro.';
    if(file.size>5*1024*1024)return 'A imagem deve ter no máximo 5 MB.';
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))return 'Use uma imagem JPG, PNG ou WebP.';
    return '';
  }

  window.previewDisplayPhoto=function(type){
    const input=document.getElementById(type==='hero'?'displayHeroFile':'displayProfileFile');const file=input?.files?.[0];const err=validFile(file);if(err){toast(err);if(input)input.value='';return;}
    const preview=document.getElementById(type==='hero'?'displayHeroPreview':'displayProfilePreview');if(preview)preview.innerHTML=`<img src="${URL.createObjectURL(file)}" alt="Prévia">`;
    const st=document.getElementById(type==='hero'?'displayHeroStatus':'displayProfileStatus');if(st)st.textContent='Prévia pronta. Toque em salvar.';
  };

  function applyHero(url){
    if(!url)return;displayPhotos.hero=url;
    const home=document.getElementById('homeView');if(home){let card=document.getElementById('studioHomeImage');if(!card){card=document.createElement('div');card.id='studioHomeImage';card.className='shared-hero-card';home.prepend(card);}card.innerHTML=`<img src="${url}" alt="Studio Capricho Hair">`;}
    const adminHome=document.getElementById('adminHomePanel');if(adminHome){let card=adminHome.querySelector('.admin-feature-photo');if(!card){card=document.createElement('div');card.className='admin-feature-photo';adminHome.prepend(card);}card.innerHTML=`<img src="${url}" alt="Studio Capricho Hair">`;}
  }

  function applyProfile(url){
    if(!url)return;displayPhotos.profile=url;
    ['profileView','professionalView'].forEach(id=>{const panel=document.getElementById(id);if(!panel)return;let card=panel.querySelector('.client-profile-display');if(!card){card=document.createElement('div');card.className='client-profile-display';panel.prepend(card);}card.innerHTML=`<img src="${url}" alt="Studio Capricho Hair">`;});
    const adminProfile=document.getElementById('profilePanel');if(adminProfile){let card=adminProfile.querySelector('.admin-feature-photo');if(!card){card=document.createElement('div');card.className='admin-feature-photo admin-profile-photo';adminProfile.prepend(card);}card.innerHTML=`<img src="${url}" alt="Studio Capricho Hair">`;}
  }

  window.saveDisplayPhoto=async function(type){
    if(!window.sb||!window.currentAdminUser){toast('Faça login no painel.');return;}
    const input=document.getElementById(type==='hero'?'displayHeroFile':'displayProfileFile');const file=input?.files?.[0];const err=validFile(file);if(err){toast(err);return;}
    const st=document.getElementById(type==='hero'?'displayHeroStatus':'displayProfileStatus');if(st)st.textContent='Enviando foto...';
    const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';const path=`display/${type}.${ext}`;
    const {error:uploadError}=await sb.storage.from('studio-assets').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'60'});
    if(uploadError){if(st)st.textContent='Falha ao enviar.';toast('Não foi possível enviar a foto.');return;}
    const {data:pub}=sb.storage.from('studio-assets').getPublicUrl(path);const url=(pub?.publicUrl||'')+`?v=${Date.now()}`;if(!url){toast('Não foi possível gerar o endereço da foto.');return;}
    const field=type==='hero'?'hero_image_url':'profile_image_url';const payload={updated_at:new Date().toISOString()};payload[field]=url;
    const {error:updateError}=await sb.from('studio_settings').update(payload).eq('id','main');
    if(updateError){if(st)st.textContent='Foto enviada, mas não foi possível ativá-la.';toast('Não foi possível salvar a foto.');return;}
    if(type==='hero')applyHero(url);else applyProfile(url);if(input)input.value='';if(st)st.textContent='Foto salva e publicada para as clientes.';renderPanel();toast('Foto de exibição atualizada.');
  };

  async function loadPhotos(){
    addStyles();
    if(!window.sb)return;
    const {data,error}=await sb.from('studio_settings').select('hero_image_url,profile_image_url').eq('id','main').maybeSingle();
    if(!error&&data){if(data.hero_image_url)applyHero(data.hero_image_url);if(data.profile_image_url)applyProfile(data.profile_image_url);}
    if(window.adminMode){ensurePanel();insertMenuItem();document.getElementById('heroImageManager')?.remove();}
  }

  setTimeout(loadPhotos,900);
  setTimeout(()=>{insertMenuItem();if(window.adminMode)document.getElementById('heroImageManager')?.remove();},1800);
})();