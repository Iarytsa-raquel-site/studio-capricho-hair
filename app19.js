(function(){
  let currentProfilePhoto='';

  function cleanAdminProfile(){
    const profile=document.getElementById('profilePanel');
    if(!profile)return;
    profile.querySelectorAll('.admin-feature-photo,.admin-profile-photo,#profilePhotoEditor,.profile-photo-editor').forEach(el=>el.remove());
  }

  function applyProfilePhoto(url){
    if(!url)return;
    currentProfilePhoto=url;
    ['profileView','professionalView'].forEach(id=>{
      const panel=document.getElementById(id);if(!panel)return;
      let card=panel.querySelector('.client-profile-display');
      if(!card){card=document.createElement('div');card.className='client-profile-display';panel.prepend(card);}
      card.innerHTML=`<img src="${url}" alt="Studio Capricho Hair">`;
    });
    cleanAdminProfile();
  }

  async function load(){
    cleanAdminProfile();
    if(window.sb){
      const {data,error}=await sb.from('studio_settings').select('profile_image_url').eq('id','main').maybeSingle();
      if(!error&&data?.profile_image_url)applyProfilePhoto(data.profile_image_url);
    }
    cleanAdminProfile();
  }

  setTimeout(load,500);
  setTimeout(cleanAdminProfile,1200);
  setTimeout(cleanAdminProfile,2200);
  const obs=new MutationObserver(()=>cleanAdminProfile());
  obs.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>obs.disconnect(),8000);
})();