const STUDIO_ADMIN_EMAIL='mirihaircapricho@gmail.com';

(function secureStudioAdmin(){
  const originalShowAdminLogin=showAdminLogin;
  showAdminLogin=function(){
    originalShowAdminLogin();
    const note=document.getElementById('authNote');
    if(note)note.textContent='Acesso protegido. Use a conta administrativa autorizada do Studio.';
  };

  adminLogin=async function(){
    if(!sb){toast('A conexão segura não está disponível.');return;}
    const email=(document.getElementById('adminEmail')?.value||'').trim().toLowerCase();
    const password=document.getElementById('adminPassword')?.value||'';
    if(email!==STUDIO_ADMIN_EMAIL){toast('E-mail ou senha inválidos.');return;}
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error||!data.user||String(data.user.email||'').toLowerCase()!==STUDIO_ADMIN_EMAIL){
      if(data?.user)await sb.auth.signOut();
      currentAdminUser=null;
      toast('E-mail ou senha inválidos.');
      return;
    }
    currentAdminUser=data.user;
    showAdminDashboard();
    await cloudLoad(true);
    if(typeof loadAdminClients==='function')await loadAdminClients();
    toast('Login realizado com segurança.');
  };

  checkAdminSession=async function(){
    if(!sb){showAdminLogin();return;}
    const {data}=await sb.auth.getSession();
    const user=data.session?.user||null;
    if(user&&String(user.email||'').toLowerCase()===STUDIO_ADMIN_EMAIL){
      currentAdminUser=user;
      showAdminDashboard();
      await cloudLoad(true);
    }else{
      if(user)await sb.auth.signOut();
      currentAdminUser=null;
      showAdminLogin();
    }
  };

  if(sb){
    sb.auth.onAuthStateChange(async(event,session)=>{
      if(event==='SIGNED_IN'&&session?.user&&String(session.user.email||'').toLowerCase()!==STUDIO_ADMIN_EMAIL){
        await sb.auth.signOut();
        currentAdminUser=null;
        showAdminLogin();
      }
    });
  }
})();
