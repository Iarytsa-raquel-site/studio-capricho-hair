(function(){
  function applyNewHome(){
    const home=document.getElementById('homeView');
    if(!home)return;
    const oldHero=home.querySelector('.hero-photo');
    if(oldHero) oldHero.remove();
    const facade=document.getElementById('studioFacadeCard');
    if(facade) facade.remove();
    const trust=home.querySelector('.trust-row');
    if(trust){const note=trust.nextElementSibling;if(note&&note.classList.contains('muted'))note.remove();trust.remove();}
    home.querySelectorAll('.contact-card').forEach(card=>{if(card.textContent.includes('Instagram'))card.remove();});
    if(window.STUDIO_HOME_IMAGE&&!document.getElementById('studioHomeImage')){
      const card=document.createElement('div');
      card.id='studioHomeImage';
      card.style.cssText='overflow:hidden;margin:0 0 22px;border-radius:24px;border:1px solid #45361b;background:#111;box-shadow:0 14px 36px rgba(0,0,0,.35)';
      card.innerHTML=`<img src="${window.STUDIO_HOME_IMAGE}" alt="Trabalho realizado no Studio Capricho Hair" style="display:block;width:100%;height:auto;aspect-ratio:3/4;object-fit:cover;object-position:center">`;
      home.prepend(card);
    }
  }
  applyNewHome();
  window.addEventListener('load',applyNewHome);
  const obs=new MutationObserver(applyNewHome);
  obs.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>obs.disconnect(),5000);
})();