window.STUDIO_FACHADA=null;
(function(){
  const img=document.createElement('script');
  img.src='homeimage.js?v=2';
  img.onload=function(){
    const patch=document.createElement('script');
    patch.src='homepatch.js?v=2';
    document.head.appendChild(patch);
  };
  document.head.appendChild(img);
})();