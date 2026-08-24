(function(){
 function applyAdminPhoto(){
  if(!window.STUDIO_HOME_IMAGE)return;
  const dash=document.getElementById('adminDashboard');if(!dash)return;
  const old=dash.querySelector(':scope > .profile-cover');if(old)old.style.display='none';
  const home=document.getElementById('adminHomePanel');
  if(home&&!home.querySelector('.admin-feature-photo')){
   const img=document.createElement('div');img.className='admin-feature-photo';img.innerHTML=`<img src="${window.STUDIO_HOME_IMAGE}" alt="Studio Capricho Hair">`;home.prepend(img);
  }
  const profile=document.getElementById('profilePanel');
  if(profile&&!profile.querySelector('.admin-feature-photo')){
   const img=document.createElement('div');img.className='admin-feature-photo admin-profile-photo';img.innerHTML=`<img src="${window.STUDIO_HOME_IMAGE}" alt="Studio Capricho Hair">`;profile.prepend(img);
  }
 }
 function addStyle(){if(document.getElementById('adminPhotoStyle'))return;const s=document.createElement('style');s.id='adminPhotoStyle';s.textContent=`.admin-feature-photo{overflow:hidden;border-radius:24px;border:1px solid rgba(215,169,63,.32);background:#0d0d0d;box-shadow:0 16px 38px rgba(0,0,0,.38);margin:0 0 22px}.admin-feature-photo img{display:block;width:100%;height:310px;object-fit:cover;object-position:center 38%}.admin-profile-photo img{height:280px}@media(max-width:540px){.admin-feature-photo{border-radius:20px}.admin-feature-photo img{height:290px}.admin-profile-photo img{height:260px}}`;document.head.appendChild(s);}
 function start(){addStyle();if(window.STUDIO_HOME_IMAGE){applyAdminPhoto();return;}const s=document.createElement('script');s.src='homeimage.js?v=31';s.onload=applyAdminPhoto;document.body.appendChild(s);}
 start();setTimeout(applyAdminPhoto,1200);setTimeout(applyAdminPhoto,2200);
})();