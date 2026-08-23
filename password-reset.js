(function(){
  function resetRedirectUrl(){
    return window.location.origin + window.location.pathname;
  }

  function addRecoveryUi(){
    const shell=document.querySelector('#adminLoginView .login-shell');
    if(!shell || document.getElementById('forgotPasswordBtn')) return;

    const enterBtn=[...shell.querySelectorAll('button')].find(b=>b.textContent.trim()==='Entrar');
    const forgot=document.createElement('button');
    forgot.id='forgotPasswordBtn';
    forgot.type='button';
    forgot.className='btn ghost';
    forgot.style.marginTop='10px';
    forgot.textContent='Esqueci minha senha';
    forgot.addEventListener('click',requestPasswordReset);
    if(enterBtn) enterBtn.insertAdjacentElement('afterend',forgot);
    else shell.appendChild(forgot);

    const panel=document.createElement('div');
    panel.id='newPasswordPanel';
    panel.className='card hidden';
    panel.style.marginTop='14px';
    panel.innerHTML=`
      <strong>Definir nova senha</strong>
      <p class="muted">Digite uma nova senha para a Área do Studio.</p>
      <label>Nova senha</label>
      <input id="newAdminPassword" type="password" placeholder="Mínimo de 8 caracteres" autocomplete="new-password" />
      <label>Confirmar nova senha</label>
      <input id="confirmAdminPassword" type="password" placeholder="Repita a nova senha" autocomplete="new-password" />
      <button type="button" class="btn primary" style="margin-top:12px" id="saveNewPasswordBtn">Salvar nova senha</button>
    `;
    shell.appendChild(panel);
    panel.querySelector('#saveNewPasswordBtn').addEventListener('click',finishPasswordReset);
  }

  async function requestPasswordReset(){
    if(typeof sb==='undefined' || !sb){
      toast('A conexão com o Supabase não está disponível.');
      return;
    }
    const input=document.getElementById('adminEmail');
    const email=(input?.value||'').trim();
    if(!email){
      toast('Digite o e-mail do administrador primeiro.');
      input?.focus();
      return;
    }
    const btn=document.getElementById('forgotPasswordBtn');
    if(btn){btn.disabled=true;btn.textContent='Enviando...';}
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:resetRedirectUrl()});
    if(btn){btn.disabled=false;btn.textContent='Esqueci minha senha';}
    if(error){
      console.error(error);
      toast('Não foi possível enviar o e-mail de recuperação.');
      return;
    }
    toast('E-mail de recuperação enviado. Verifique sua caixa de entrada.');
    const note=document.getElementById('authNote');
    if(note) note.textContent='Enviamos um link para redefinir sua senha. Abra o e-mail e volte por esse link.';
  }

  function showNewPasswordPanel(){
    const panel=document.getElementById('newPasswordPanel');
    if(panel) panel.classList.remove('hidden');
    const note=document.getElementById('authNote');
    if(note) note.textContent='Link de recuperação confirmado. Agora escolha uma nova senha.';
    document.getElementById('newAdminPassword')?.focus();
  }

  async function finishPasswordReset(){
    if(typeof sb==='undefined' || !sb) return;
    const p1=document.getElementById('newAdminPassword')?.value||'';
    const p2=document.getElementById('confirmAdminPassword')?.value||'';
    if(p1.length<8){toast('A nova senha precisa ter pelo menos 8 caracteres.');return;}
    if(p1!==p2){toast('As senhas não são iguais.');return;}
    const btn=document.getElementById('saveNewPasswordBtn');
    if(btn){btn.disabled=true;btn.textContent='Salvando...';}
    const {error}=await sb.auth.updateUser({password:p1});
    if(btn){btn.disabled=false;btn.textContent='Salvar nova senha';}
    if(error){console.error(error);toast('Não foi possível alterar a senha.');return;}
    toast('Senha alterada com sucesso. Faça login novamente.');
    document.getElementById('newAdminPassword').value='';
    document.getElementById('confirmAdminPassword').value='';
    document.getElementById('newPasswordPanel')?.classList.add('hidden');
    await sb.auth.signOut();
    if(typeof showAdminLogin==='function') showAdminLogin();
  }

  window.requestPasswordReset=requestPasswordReset;
  window.finishPasswordReset=finishPasswordReset;

  document.addEventListener('DOMContentLoaded',()=>{
    addRecoveryUi();
    if(typeof sb!=='undefined' && sb){
      sb.auth.onAuthStateChange((event)=>{
        if(event==='PASSWORD_RECOVERY'){
          setTimeout(showNewPasswordPanel,0);
        }
      });
    }
  });
})();
