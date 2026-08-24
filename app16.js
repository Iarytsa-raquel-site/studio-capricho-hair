(function(){
  let sharedHeroUrl='';

  function styleSharedHero(){
    if(document.getElementById('sharedHeroStyle'))return;
    const s=document.createElement('style');s.id='sharedHeroStyle';
    s.textContent=`.shared-hero-card,.admin-feature-photo{overflow:hidden;border-radius:24px;border:1px solid rgba(215,169,63,.32);background:#0d0d0d;box-shadow:0 16px 38px rgba(0,0,0,.38);margin:0 0 22px}.shared-hero-card img,.admin-feature-photo img{display:block;width:100%;height:340px;object-fit:cover;object-position:center 38%}.admin-profile-photo img{height:300px}.hero-image-manager{margin:0 0 18px;padding:16px;border-radius:18px;border:1px solid #3c321f;background:linear-gradient(180deg,#151515,#101010)}.hero-image-manager strong{display:block;color:#f2d27c;margin-bottom:5px}.hero-image-manager .muted{font-size:12px;line-height:1.45}.hero-image-manager input[type=file]{display:block;width:100%;margin-top:12px}.hero-image-preview{margin-top:12px;border-radius:14px;overflow:hidden;border:1px solid #30291f;background:#0b0b0b}.hero-image-preview img{width:100%;height:190px;object-fit:cover;display:block}.hero-image-actions{display:flex;gap:9px;margin-top:12px}.hero-image-actions .btn{flex:1}.hero-image-status{margin-top:9px;font-size:12px;color:#aaa08e}@media(max-width:540px){.shared-hero-card,.admin-feature-photo{border-radius:20px}.shared-hero-card img,.admin-feature-photo img{height:320px}.admin-profile-photo img{height:280px}}`;
    document.head.appendChild(s);
  }

  function applyImage(url){
    if(!url)return;
    sharedHeroUrl=url;
    const dash=document.getElementById('adminDashboard');
    if(dash){
      const old=dash.querySelector(':scope > .profile-cover');if(old)old.style.display='none';
      const home=document.getElementById('adminHomePanel');
      if(home){let card=home.querySelector('.admin-feature-photo');if(!card){card=document.createElement('div');card.className='admin-feature-photo';home.prepend(card);}card.innerHTML=`<img src="${url}" alt="Studio Capricho Hair">`;}
      const profile=document.getElementById('profilePanel');
      if(profile){let card=profile.querySelector('.admin-feature-photo');if(!card){card=document.createElement('div');card.className='admin-feature-photo admin-profile-photo';profile.prepend(card);}card.innerHTML=`<img src="${url}" alt="Studio Capricho Hair">`;}
    }
    const clientHome=document.getElementById('homeView');
    if(clientHome){
      let card=document.getElementById('studioHomeImage');
      if(!card){card=document.createElement('div');card.id='studioHomeImage';card.className='shared-hero-card';clientHome.prepend(card);}
      card.innerHTML=`<img src="${url}" alt="Trabalho realizado no Studio Capricho Hair">`;
    }
    const preview=document.querySelector('#heroImagePreview img');if(preview)preview.src=url;
  }

  function fallbackImage(){
    if(window.STUDIO_HOME_IMAGE){applyImage(window.STUDIO_HOME_IMAGE);return;}
    if(document.querySelector('script[data-shared-homeimage-loader]'))return;
    const s=document.createElement('script');s.src='homeimage.js?v=33';s.dataset.sharedHomeimageLoader='true';s.onload=()=>{if(window.STUDIO_HOME_IMAGE)applyImage(window.STUDIO_HOME_IMAGE);};document.body.appendChild(s);
  }

  async function loadSharedHero(){
    styleSharedHero();
    if(!window.sb){fallbackImage();return;}
    const {data,error}=await sb.from('studio_settings').select('hero_image_url').eq('id','main').maybeSingle();
    if(!error&&data?.hero_image_url)applyImage(data.hero_image_url);else fallbackImage();
    ensureHeroManager();
  }

  function ensureHeroManager(){
    if(!window.adminMode)return;
    const profile=document.getElementById('profilePanel');if(!profile||document.getElementById('heroImageManager'))return;
    const box=document.createElement('div');box.id='heroImageManager';box.className='hero-image-manager';
    box.innerHTML=`<strong>Foto principal do Studio</strong><div class="muted">Esta imagem aparece automaticamente na Home do painel e também na tela inicial das clientes.</div><input id="heroImageFile" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewSharedHeroFile()"><div id="heroImagePreview" class="hero-image-preview">${sharedHeroUrl?`<img src="${sharedHeroUrl}" alt="Prévia">`:''}</div><div class="hero-image-actions"><button class="btn primary" onclick="saveSharedHeroImage()">Salvar nova foto</button></div><div id="heroImageStatus" class="hero-image-status">Escolha uma imagem de até 5 MB.</div>`;
    const form=profile.querySelector('.admin-form');if(form)profile.insertBefore(box,form);else profile.prepend(box);
  }

  window.previewSharedHeroFile=function(){
    const file=document.getElementById('heroImageFile')?.files?.[0];if(!file)return;
    if(file.size>5*1024*1024){toast('Escolha uma imagem de até 5 MB.');document.getElementById('heroImageFile').value='';return;}
    const url=URL.createObjectURL(file);const p=document.getElementById('heroImagePreview');if(p)p.innerHTML=`<img src="${url}" alt="Prévia da nova foto">`;
    const st=document.getElementById('heroImageStatus');if(st)st.textContent='Prévia pronta. Toque em Salvar nova foto.';
  };

  window.saveSharedHeroImage=async function(){
    if(!window.sb||!window.currentAdminUser){toast('Faça login no painel.');return;}
    const input=document.getElementById('heroImageFile');const file=input?.files?.[0];if(!file){toast('Escolha uma foto primeiro.');return;}
    if(file.size>5*1024*1024){toast('A imagem deve ter no máximo 5 MB.');return;}
    const allowed=['image/jpeg','image/png','image/webp'];if(!allowed.includes(file.type)){toast('Use uma imagem JPG, PNG ou WebP.');return;}
    const st=document.getElementById('heroImageStatus');if(st)st.textContent='Enviando foto...';
    const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    const path=`hero/studio-main.${ext}`;
    const {error:uploadError}=await sb.storage.from('studio-assets').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'60'});
    if(uploadError){if(st)st.textContent='Falha ao enviar a imagem.';toast('Não foi possível enviar a foto.');return;}
    const {data:pub}=sb.storage.from('studio-assets').getPublicUrl(path);
    const url=(pub?.publicUrl||'')+`?v=${Date.now()}`;
    if(!url){toast('Não foi possível gerar o endereço da foto.');return;}
    const {error:updateError}=await sb.from('studio_settings').update({hero_image_url:url,updated_at:new Date().toISOString()}).eq('id','main');
    if(updateError){if(st)st.textContent='Foto enviada, mas não foi possível ativá-la.';toast('Não foi possível salvar a nova foto.');return;}
    applyImage(url);if(input)input.value='';if(st)st.textContent='Foto atualizada. Ela já será usada no app das clientes.';toast('Foto principal atualizada com sucesso.');
  };

  window.refreshSharedHero=loadSharedHero;
  setTimeout(loadSharedHero,700);
  setTimeout(()=>{ensureHeroManager();if(sharedHeroUrl)applyImage(sharedHeroUrl);},1800);
})();
