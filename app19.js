(function(){
  let currentProfilePhoto='';

  function addStyles(){
    if(document.getElementById('profilePhotoEditorStyle'))return;
    const s=document.createElement('style');
    s.id='profilePhotoEditorStyle';
    s.textContent=`.profile-photo-editor{margin:0 0 18px;padding:16px;border-radius:18px;border:1px solid #3b3120;background:linear-gradient(180deg,#161616,#101010)}.profile-photo-editor h3{margin:0 0 5px;color:#f2d27c;font-family:Georgia,serif}.profile-photo-editor .muted{font-size:12px;line-height:1.5}.profile-photo-editor input[type=file]{display:block;width:100%;margin-top:12px}.profile-photo-preview{margin-top:12px;border-radius:16px;overflow:hidden;border:1px solid #30291f;background:#090909;min-height:160px;display:grid;place-items:center}.profile-photo-preview img{display:block;width:100%;height:240px;object-fit:cover;object-position:center 35%}.profile-photo-preview span{padding:22px;color:#7f7667;font-size:12px}.profile-photo-status{margin-top:9px;color:#a99d87;font-size:11px}.client-profile-display{overflow:hidden;border-radius:22px;border:1px solid rgba(215,169,63,.25);margin:0 0 18px;background:#0d0d0d}.client-profile-display img{display:block;width:100%;height:310px;object-fit:cover;object-position:center 35%}@media(max-width:540px){.profile-photo-preview img{height:210px}.client-profile-display img{height:280px}}`;
    document.head.appendChild(s);
  }

  function applyProfilePhoto(url){
    if(!url)return;
    currentProfilePhoto=url;
    const adminProfile=document.getElementById('profilePanel');
    if(adminProfile){
      let card=adminProfile.querySelector('.admin-feature-photo');
      if(!card){card=document.createElement('div');card.className='admin-feature-photo admin-profile-photo';const form=adminProfile.querySelector('.admin-form');if(form)adminProfile.insertBefore(card,form);else adminProfile.prepend(card);}
      card.innerHTML=`<img src="${url}" alt="Foto do perfil do Studio" style="display:block;width:100%;height:300px;object-fit:cover;object-position:center 35%">`;
    }
    ['profileView','professionalView'].forEach(id=>{
      const panel=document.getElementById(id);if(!panel)return;
      let card=panel.querySelector('.client-profile-display');
      if(!card){card=document.createElement('div');card.className='client-profile-display';panel.prepend(card);}
      card.innerHTML=`<img src="${url}" alt="Studio Capricho Hair">`;
    });
    const preview=document.querySelector('#profilePhotoPreview img');if(preview)preview.src=url;
  }

  function ensureEditor(){
    if(!window.adminMode)return;
    const profile=document.getElementById('profilePanel');
    if(!profile||document.getElementById('profilePhotoEditor'))return;
    const box=document.createElement('div');
    box.id='profilePhotoEditor';box.className='profile-photo-editor';
    box.innerHTML=`<h3>Foto do Perfil</h3><div class="muted">Escolha a foto que representa o Studio. Ao salvar, ela também será atualizada automaticamente na área de Perfil das clientes.</div><div id="profilePhotoPreview" class="profile-photo-preview">${currentProfilePhoto?`<img src="${currentProfilePhoto}" alt="Foto atual">`:'<span>Nenhuma foto definida.</span>'}</div><input id="profilePhotoFile" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewAdminProfilePhoto()"><button class="btn primary top-gap" type="button" onclick="saveAdminProfilePhoto()">Salvar foto do Perfil</button><div id="profilePhotoStatus" class="profile-photo-status">JPG, PNG ou WebP • máximo 5 MB.</div>`;
    const form=profile.querySelector('.admin-form');if(form)profile.insertBefore(box,form);else profile.prepend(box);
  }

  function validate(file){
    if(!file)return 'Escolha uma foto primeiro.';
    if(file.size>5*1024*1024)return 'A imagem deve ter no máximo 5 MB.';
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))return 'Use uma imagem JPG, PNG ou WebP.';
    return '';
  }

  window.previewAdminProfilePhoto=function(){
    const input=document.getElementById('profilePhotoFile');const file=input?.files?.[0];const err=validate(file);
    if(err){toast(err);if(input)input.value='';return;}
    const p=document.getElementById('profilePhotoPreview');if(p)p.innerHTML=`<img src="${URL.createObjectURL(file)}" alt="Prévia da foto">`;
    const st=document.getElementById('profilePhotoStatus');if(st)st.textContent='Prévia pronta. Toque em Salvar foto do Perfil.';
  };

  window.saveAdminProfilePhoto=async function(){
    if(!window.sb||!window.currentAdminUser){toast('Faça login no painel.');return;}
    const input=document.getElementById('profilePhotoFile');const file=input?.files?.[0];const err=validate(file);
    if(err){toast(err);return;}
    const st=document.getElementById('profilePhotoStatus');if(st)st.textContent='Enviando foto...';
    const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    const path=`display/profile.${ext}`;
    const {error:uploadError}=await sb.storage.from('studio-assets').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'60'});
    if(uploadError){if(st)st.textContent='Falha ao enviar a foto.';toast('Não foi possível enviar a foto.');return;}
    const {data:pub}=sb.storage.from('studio-assets').getPublicUrl(path);
    const url=(pub?.publicUrl||'')+`?v=${Date.now()}`;
    if(!url){toast('Não foi possível gerar o endereço da foto.');return;}
    const {error:updateError}=await sb.from('studio_settings').update({profile_image_url:url,updated_at:new Date().toISOString()}).eq('id','main');
    if(updateError){if(st)st.textContent='Foto enviada, mas não foi possível ativá-la.';toast('Não foi possível salvar a foto.');return;}
    applyProfilePhoto(url);input.value='';if(st)st.textContent='Foto salva e publicada para as clientes.';toast('Foto do Perfil atualizada.');
  };

  async function load(){
    addStyles();
    if(window.sb){
      const {data,error}=await sb.from('studio_settings').select('profile_image_url').eq('id','main').maybeSingle();
      if(!error&&data?.profile_image_url)applyProfilePhoto(data.profile_image_url);
    }
    ensureEditor();
  }

  setTimeout(load,700);
  setTimeout(()=>{ensureEditor();if(currentProfilePhoto)applyProfilePhoto(currentProfilePhoto);},1600);
  setTimeout(()=>{ensureEditor();if(currentProfilePhoto)applyProfilePhoto(currentProfilePhoto);},3000);
})();