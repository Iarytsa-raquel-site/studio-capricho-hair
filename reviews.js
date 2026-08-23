(function(){
  let reviewsCache=[];
  function stars(n){ return '★'.repeat(n) + '☆'.repeat(5-n); }
  function injectClientReviews(){
    if(document.getElementById('reviewsView')) return;
    const clientApp=document.getElementById('clientApp');
    if(!clientApp) return;
    const section=document.createElement('section');
    section.id='reviewsView';
    section.className='hidden';
    section.innerHTML=`
      <h2 class="section-title">Avaliações das clientes</h2>
      <p class="muted">Veja experiências de clientes e deixe sua avaliação do atendimento.</p>
      <div id="reviewsList"></div>
      <h2 class="section-title">Deixe sua avaliação</h2>
      <div class="card">
        <label>Seu nome</label>
        <input id="reviewName" placeholder="Seu nome" />
        <label>Serviço realizado</label>
        <select id="reviewService"><option value="">Selecione o serviço</option></select>
        <label>Nota</label>
        <select id="reviewRating">
          <option value="5">★★★★★ — Excelente</option>
          <option value="4">★★★★☆ — Muito bom</option>
          <option value="3">★★★☆☆ — Bom</option>
          <option value="2">★★☆☆☆ — Regular</option>
          <option value="1">★☆☆☆☆ — Ruim</option>
        </select>
        <label>Comentário</label>
        <textarea id="reviewComment" placeholder="Conte como foi sua experiência"></textarea>
        <button class="btn primary" style="margin-top:12px" onclick="submitClientReview()">Enviar avaliação</button>
        <p class="muted" style="font-size:12px">As avaliações são revisadas pelo Studio antes de serem publicadas.</p>
      </div>`;
    clientApp.appendChild(section);
    const nav=document.getElementById('clientNav');
    if(nav && !document.getElementById('reviewsNavBtn')){
      const b=document.createElement('button');
      b.id='reviewsNavBtn';
      b.innerHTML='★<br>Avaliações';
      b.onclick=function(){showClientView('reviewsView',this)};
      nav.appendChild(b);
    }
  }
  function injectAdminReviews(){
    const tabs=document.querySelector('.admin-tabs');
    if(tabs && !document.getElementById('reviewsAdminTab')){
      const b=document.createElement('button');
      b.id='reviewsAdminTab';
      b.textContent='Avaliações';
      b.onclick=function(){showAdminTab('reviewsPanel',this); loadAdminReviews();};
      tabs.appendChild(b);
    }
    const dash=document.getElementById('adminDashboard');
    if(dash && !document.getElementById('reviewsPanel')){
      const panel=document.createElement('div');
      panel.id='reviewsPanel';
      panel.className='admin-panel';
      panel.innerHTML=`<h2 class="section-title">Avaliações das clientes</h2><p class="muted">Aprove ou exclua avaliações enviadas pelo site.</p><div id="adminReviewsList"></div>`;
      dash.appendChild(panel);
    }
  }
  function fillReviewServices(){
    const sel=document.getElementById('reviewService');
    if(!sel || typeof services==='undefined') return;
    sel.innerHTML='<option value="">Selecione o serviço</option>'+services.map(s=>`<option value="${s.name}">${s.name}</option>`).join('');
  }
  async function loadReviews(){
    const el=document.getElementById('reviewsList');
    if(!el) return;
    if(typeof sb==='undefined' || !sb){el.innerHTML='<div class="card"><p class="muted">Avaliações estarão disponíveis quando a conexão estiver ativa.</p></div>';return;}
    const {data,error}=await sb.from('reviews').select('*').eq('approved',true).order('created_at',{ascending:false});
    if(error){console.error(error);return;}
    reviewsCache=data||[];
    if(!reviewsCache.length){el.innerHTML='<div class="card"><strong>Seja a primeira a avaliar</strong><p class="muted">Ainda não há avaliações publicadas.</p></div>';return;}
    el.innerHTML=reviewsCache.map(r=>`<div class="card" style="margin-bottom:10px"><div class="stars">${stars(Number(r.rating))}</div><strong>${escapeHtml(r.client_name)}</strong>${r.service_name?`<div class="muted">${escapeHtml(r.service_name)}</div>`:''}<p>${escapeHtml(r.comment)}</p></div>`).join('');
  }
  async function submitClientReview(){
    if(typeof sb==='undefined' || !sb){toast('Sem conexão com o sistema.');return;}
    const client_name=document.getElementById('reviewName').value.trim();
    const service_name=document.getElementById('reviewService').value || null;
    const rating=Number(document.getElementById('reviewRating').value);
    const comment=document.getElementById('reviewComment').value.trim();
    if(!client_name || !comment){toast('Informe seu nome e comentário.');return;}
    const {error}=await sb.from('reviews').insert({client_name,rating,comment,service_name,approved:false});
    if(error){console.error(error);toast('Não foi possível enviar a avaliação.');return;}
    document.getElementById('reviewName').value='';
    document.getElementById('reviewComment').value='';
    document.getElementById('reviewRating').value='5';
    document.getElementById('reviewService').value='';
    toast('Avaliação enviada! Ela aparecerá após aprovação do Studio.');
  }
  async function loadAdminReviews(){
    const el=document.getElementById('adminReviewsList');
    if(!el || typeof sb==='undefined' || !sb || !currentAdminUser) return;
    const {data,error}=await sb.from('reviews').select('*').order('created_at',{ascending:false});
    if(error){console.error(error);return;}
    if(!data?.length){el.innerHTML='<div class="card"><p class="muted">Nenhuma avaliação recebida.</p></div>';return;}
    el.innerHTML=data.map(r=>`<div class="card" style="margin-bottom:10px"><div class="stars">${stars(Number(r.rating))}</div><strong>${escapeHtml(r.client_name)}</strong>${r.service_name?`<div class="muted">${escapeHtml(r.service_name)}</div>`:''}<p>${escapeHtml(r.comment)}</p><div class="muted" style="margin-bottom:10px">Status: ${r.approved?'Publicada':'Aguardando aprovação'}</div><div class="link-btns">${r.approved?'':`<button class="btn primary" onclick="approveReview('${r.id}')">Aprovar</button>`}<button class="btn ghost" onclick="deleteReview('${r.id}')">Excluir</button></div></div>`).join('');
  }
  async function approveReview(id){if(!currentAdminUser)return;const {error}=await sb.from('reviews').update({approved:true}).eq('id',id);if(error){toast('Não foi possível aprovar.');return;}toast('Avaliação publicada.');loadAdminReviews();loadReviews();}
  async function deleteReview(id){if(!currentAdminUser)return;if(!confirm('Excluir esta avaliação?'))return;const {error}=await sb.from('reviews').delete().eq('id',id);if(error){toast('Não foi possível excluir.');return;}toast('Avaliação excluída.');loadAdminReviews();loadReviews();}
  function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  window.submitClientReview=submitClientReview;
  window.approveReview=approveReview;
  window.deleteReview=deleteReview;
  window.loadAdminReviews=loadAdminReviews;
  function initReviews(){injectClientReviews();injectAdminReviews();setTimeout(()=>{fillReviewServices();loadReviews();},300);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initReviews);
  else initReviews();
})();
