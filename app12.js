let studioExpenses=[];

function expenseMonthKey(date){return (date||'').slice(0,7);}
function todayIso(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}

async function loadStudioExpenses(){
  if(!sb||!currentAdminUser)return;
  const {data,error}=await sb.from('expenses').select('id,description,category,amount,expense_date,notes,created_at').order('expense_date',{ascending:false}).order('created_at',{ascending:false});
  if(error){toast('Não foi possível carregar as despesas.');return;}
  studioExpenses=(data||[]).map(x=>({id:x.id,description:x.description,category:x.category||'Outros',amount:Number(x.amount||0),date:x.expense_date,notes:x.notes||''}));
  if(document.getElementById('performancePanel')?.classList.contains('active'))renderPerformanceDashboard();
}

async function addStudioExpense(){
  if(!sb||!currentAdminUser){toast('Faça login para registrar despesas.');return;}
  const description=document.getElementById('expenseDescription')?.value.trim();
  const category=document.getElementById('expenseCategory')?.value||'Outros';
  const amount=Number(document.getElementById('expenseAmount')?.value||0);
  const date=document.getElementById('expenseDate')?.value||todayIso();
  const notes=document.getElementById('expenseNotes')?.value.trim()||null;
  if(!description){toast('Informe a descrição da despesa.');return;}
  if(!(amount>0)){toast('Informe um valor de despesa válido.');return;}
  const {data,error}=await sb.from('expenses').insert({description,category,amount,expense_date:date,notes}).select().single();
  if(error){toast('Não foi possível salvar a despesa.');return;}
  studioExpenses.unshift({id:data.id,description:data.description,category:data.category,amount:Number(data.amount),date:data.expense_date,notes:data.notes||''});
  renderPerformanceDashboard();
  toast('Despesa registrada.');
}

async function removeStudioExpense(id){
  if(!sb||!currentAdminUser){toast('Faça login.');return;}
  if(!confirm('Excluir esta despesa?'))return;
  const {error}=await sb.from('expenses').delete().eq('id',id);
  if(error){toast('Não foi possível excluir a despesa.');return;}
  studioExpenses=studioExpenses.filter(x=>x.id!==id);
  renderPerformanceDashboard();
  toast('Despesa excluída.');
}

function expenseSummary(){
  const now=new Date();
  const currentKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const previousDate=new Date(now.getFullYear(),now.getMonth()-1,1);
  const previousKey=`${previousDate.getFullYear()}-${String(previousDate.getMonth()+1).padStart(2,'0')}`;
  const current=studioExpenses.filter(x=>expenseMonthKey(x.date)===currentKey).reduce((s,x)=>s+x.amount,0);
  const previous=studioExpenses.filter(x=>expenseMonthKey(x.date)===previousKey).reduce((s,x)=>s+x.amount,0);
  return {current,previous,currentKey,previousKey};
}

function renderExpenseRows(){
  const currentMonth=expenseSummary().currentKey;
  const rows=studioExpenses.filter(x=>expenseMonthKey(x.date)===currentMonth);
  if(!rows.length)return '<div class="expense-empty">Nenhuma despesa registrada neste mês.</div>';
  return rows.map(x=>`<div class="expense-row"><div><strong>${x.description}</strong><span>${x.category} • ${fmtDate(x.date)}</span>${x.notes?`<small>${x.notes}</small>`:''}</div><div><strong>${money(x.amount)}</strong><button class="small-btn danger" onclick="removeStudioExpense('${x.id}')">Excluir</button></div></div>`).join('');
}

const performanceRenderWithRevenue=renderPerformanceDashboard;
renderPerformanceDashboard=function(){
  const panel=ensurePerformancePanel();if(!panel)return;
  const d=performanceData(),e=expenseSummary();
  const net=d.current.revenue-e.current;
  const previousNet=d.previous.revenue-e.previous;
  const margin=d.current.revenue>0?(net/d.current.revenue)*100:0;
  const maxRevenue=Math.max(1,...d.byMonth.map(x=>x.revenue));
  const maxJobs=Math.max(1,...d.byMonth.map(x=>x.jobs));
  const monthlyFinance=d.byMonth.map(x=>{const expenses=studioExpenses.filter(e=>expenseMonthKey(e.date)===x.key).reduce((s,e)=>s+e.amount,0);return {...x,expenses,profit:x.revenue-expenses};});
  const maxFinance=Math.max(1,...monthlyFinance.flatMap(x=>[Math.max(0,x.revenue),Math.max(0,x.expenses),Math.max(0,x.profit)]));

  panel.innerHTML=`<div class="performance-head"><div><div class="section-kicker">Gestão financeira</div><h2 class="section-title">Desempenho e lucro</h2><p class="muted">Valores calculados com atendimentos concluídos e despesas registradas.</p></div></div>
  <div class="performance-kpis finance-kpis"><div class="performance-kpi"><small>Faturamento no mês</small><strong>${money(d.current.revenue)}</strong>${perfDeltaHtml(perfDelta(d.current.revenue,d.previous.revenue))}</div><div class="performance-kpi expense-kpi"><small>Despesas no mês</small><strong>${money(e.current)}</strong><span>custos registrados</span></div><div class="performance-kpi profit-kpi"><small>Lucro líquido no mês</small><strong>${money(net)}</strong>${perfDeltaHtml(perfDelta(net,previousNet))}</div><div class="performance-kpi"><small>Margem líquida</small><strong>${Math.round(margin)}%</strong><span>lucro ÷ faturamento</span></div><div class="performance-kpi"><small>Trabalhos no mês</small><strong>${d.current.jobs}</strong>${perfDeltaHtml(perfDelta(d.current.jobs,d.previous.jobs))}</div><div class="performance-kpi"><small>Ticket médio</small><strong>${money(d.ticket)}</strong><span>por atendimento concluído</span></div></div>

  <div class="performance-card"><div class="performance-card-head"><div><span>Resultado financeiro</span><strong>Últimos 6 meses</strong></div></div><div class="finance-legend"><span><i class="legend-revenue"></i>Faturamento</span><span><i class="legend-expense"></i>Despesas</span><span><i class="legend-profit"></i>Lucro</span></div><div class="finance-chart">${monthlyFinance.map(x=>`<div class="finance-col"><div class="finance-bars"><div class="finance-bar revenue" title="Faturamento ${money(x.revenue)}" style="height:${Math.max(x.revenue?6:0,(Math.max(0,x.revenue)/maxFinance)*100)}%"></div><div class="finance-bar expense" title="Despesas ${money(x.expenses)}" style="height:${Math.max(x.expenses?6:0,(Math.max(0,x.expenses)/maxFinance)*100)}%"></div><div class="finance-bar profit" title="Lucro ${money(x.profit)}" style="height:${Math.max(x.profit>0?6:0,(Math.max(0,x.profit)/maxFinance)*100)}%"></div></div><span>${x.label}</span></div>`).join('')}</div></div>

  <div class="performance-card"><div class="performance-card-head"><div><span>Trabalhos realizados</span><strong>Atendimentos concluídos</strong></div><strong>${d.byMonth.reduce((s,x)=>s+x.jobs,0)}</strong></div><div class="perf-chart">${d.byMonth.map(x=>`<div class="perf-col"><div class="perf-value">${x.jobs||''}</div><div class="perf-bar-wrap"><div class="perf-bar jobs" style="height:${Math.max(x.jobs?8:0,(x.jobs/maxJobs)*100)}%"></div></div><span>${x.label}</span></div>`).join('')}</div></div>

  <div class="performance-card expense-manager"><div class="performance-card-head"><div><span>Controle de despesas</span><strong>Registrar custo</strong></div><strong>${money(e.current)}</strong></div><div class="expense-form"><label>Descrição</label><input id="expenseDescription" placeholder="Ex.: compra de produtos"/><div class="row"><div><label>Categoria</label><select id="expenseCategory"><option>Produtos</option><option>Materiais</option><option>Aluguel</option><option>Água / Luz</option><option>Marketing</option><option>Transporte</option><option>Manutenção</option><option>Outros</option></select></div><div><label>Valor</label><input id="expenseAmount" type="number" min="0" step="0.01" placeholder="0,00"/></div></div><label>Data</label><input id="expenseDate" type="date" value="${todayIso()}"/><label>Observação (opcional)</label><input id="expenseNotes" placeholder="Detalhes do gasto"/><button class="btn primary top-gap" onclick="addStudioExpense()">Adicionar despesa</button></div><div class="expense-list"><h3>Despesas deste mês</h3>${renderExpenseRows()}</div></div>

  <div class="performance-card"><div class="performance-card-head"><div><span>Acumulado</span><strong>Histórico registrado</strong></div></div><div class="performance-total-grid"><div><small>Total de trabalhos concluídos</small><strong>${d.completed.length}</strong></div><div><small>Faturamento registrado</small><strong>${money(d.allRevenue)}</strong></div><div><small>Despesas registradas</small><strong>${money(studioExpenses.reduce((s,x)=>s+x.amount,0))}</strong></div><div><small>Resultado líquido registrado</small><strong>${money(d.allRevenue-studioExpenses.reduce((s,x)=>s+x.amount,0))}</strong></div></div></div>`;
}

window.loadStudioExpenses=loadStudioExpenses;
window.addStudioExpense=addStudioExpense;
window.removeStudioExpense=removeStudioExpense;
window.renderPerformanceDashboard=renderPerformanceDashboard;

const baseShowAdminTabExpenses=showAdminTab;
showAdminTab=function(id,btn){baseShowAdminTabExpenses(id,btn);if(id==='performancePanel'){loadStudioExpenses();renderPerformanceDashboard();}};

setTimeout(()=>{if(currentAdminUser)loadStudioExpenses();},800);
