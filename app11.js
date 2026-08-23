function ensurePerformancePanel(){
  const dashboard=document.getElementById('adminDashboard');if(!dashboard)return null;
  const tabs=dashboard.querySelector('.admin-tabs');
  let tab=[...tabs.querySelectorAll('button')].find(b=>b.textContent.trim()==='Desempenho');
  if(!tab){tab=document.createElement('button');tab.textContent='Desempenho';tab.setAttribute('onclick',"showAdminTab('performancePanel',this);renderPerformanceDashboard()");tabs.appendChild(tab);}
  let panel=document.getElementById('performancePanel');
  if(!panel){panel=document.createElement('div');panel.id='performancePanel';panel.className='admin-panel';dashboard.appendChild(panel);}
  return panel;
}
function monthKey(date){return (date||'').slice(0,7);}
function monthLabel(key){if(!key)return '';const [y,m]=key.split('-');return new Date(Number(y),Number(m)-1,1).toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}).replace('.','');}
function performanceData(){
  const completed=getBookings().filter(b=>b.status==='concluido');
  const now=new Date(),months=[];
  for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);}
  const byMonth=months.map(key=>{const items=completed.filter(b=>monthKey(b.date)===key);return {key,label:monthLabel(key),jobs:items.length,revenue:items.reduce((s,b)=>s+Number(b.price||0),0)};});
  const current=byMonth[byMonth.length-1]||{jobs:0,revenue:0},previous=byMonth[byMonth.length-2]||{jobs:0,revenue:0};
  const allRevenue=completed.reduce((s,b)=>s+Number(b.price||0),0),ticket=completed.length?allRevenue/completed.length:0;
  const services={};completed.forEach(b=>{services[b.serviceName]=(services[b.serviceName]||0)+1;});
  const topService=Object.entries(services).sort((a,b)=>b[1]-a[1])[0]||['—',0];
  return {completed,byMonth,current,previous,allRevenue,ticket,topService};
}
function perfDelta(current,previous){if(!previous)return current?100:0;return ((current-previous)/previous)*100;}
function perfDeltaHtml(value){const rounded=Math.round(value),cls=rounded>0?'up':rounded<0?'down':'flat',sign=rounded>0?'+':'';return `<span class="perf-delta ${cls}">${sign}${rounded}% vs mês anterior</span>`;}
function renderPerformanceDashboard(){
  const panel=ensurePerformancePanel();if(!panel)return;
  const d=performanceData(),maxRevenue=Math.max(1,...d.byMonth.map(x=>x.revenue)),maxJobs=Math.max(1,...d.byMonth.map(x=>x.jobs));
  panel.innerHTML=`<div class="performance-head"><div><div class="section-kicker">Gestão</div><h2 class="section-title">Painel de desempenho</h2><p class="muted">Resultados com base nos atendimentos marcados como concluídos.</p></div></div>
  <div class="performance-kpis"><div class="performance-kpi"><small>Faturamento no mês</small><strong>${money(d.current.revenue)}</strong>${perfDeltaHtml(perfDelta(d.current.revenue,d.previous.revenue))}</div><div class="performance-kpi"><small>Trabalhos no mês</small><strong>${d.current.jobs}</strong>${perfDeltaHtml(perfDelta(d.current.jobs,d.previous.jobs))}</div><div class="performance-kpi"><small>Ticket médio</small><strong>${money(d.ticket)}</strong><span>por atendimento concluído</span></div><div class="performance-kpi"><small>Serviço mais realizado</small><strong>${d.topService[0]}</strong><span>${d.topService[1]} ${d.topService[1]===1?'vez':'vezes'}</span></div></div>
  <div class="performance-card"><div class="performance-card-head"><div><span>Faturamento</span><strong>Últimos 6 meses</strong></div><strong>${money(d.byMonth.reduce((s,x)=>s+x.revenue,0))}</strong></div><div class="perf-chart">${d.byMonth.map(x=>`<div class="perf-col"><div class="perf-value">${x.revenue?money(x.revenue).replace(',00',''):''}</div><div class="perf-bar-wrap"><div class="perf-bar revenue" style="height:${Math.max(x.revenue?8:0,(x.revenue/maxRevenue)*100)}%"></div></div><span>${x.label}</span></div>`).join('')}</div></div>
  <div class="performance-card"><div class="performance-card-head"><div><span>Trabalhos realizados</span><strong>Atendimentos concluídos</strong></div><strong>${d.byMonth.reduce((s,x)=>s+x.jobs,0)}</strong></div><div class="perf-chart">${d.byMonth.map(x=>`<div class="perf-col"><div class="perf-value">${x.jobs||''}</div><div class="perf-bar-wrap"><div class="perf-bar jobs" style="height:${Math.max(x.jobs?8:0,(x.jobs/maxJobs)*100)}%"></div></div><span>${x.label}</span></div>`).join('')}</div></div>
  <div class="performance-card"><div class="performance-card-head"><div><span>Acumulado</span><strong>Histórico registrado</strong></div></div><div class="performance-total-grid"><div><small>Total de trabalhos concluídos</small><strong>${d.completed.length}</strong></div><div><small>Faturamento registrado</small><strong>${money(d.allRevenue)}</strong></div></div></div>`;
}
window.renderPerformanceDashboard=renderPerformanceDashboard;
const performanceBaseRenderAll=renderAll;renderAll=function(){performanceBaseRenderAll();if(document.getElementById('performancePanel')?.classList.contains('active'))renderPerformanceDashboard();};
setTimeout(()=>ensurePerformancePanel(),600);
