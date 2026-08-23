# Studio Capricho Hair — Versão 8

Novidades:
- Login e senha na Área do Studio com Supabase Authentication.
- Upload de fotos direto do celular/computador.
- Fotos salvas no Supabase Storage.
- Agendamentos enviados à nuvem por uma função que verifica conflito de horário.
- Serviços, perfil e portfólio preparados para sincronização online.
- O app continua funcionando localmente enquanto o Supabase não estiver configurado.

Ativação:
1. Crie um projeto gratuito no Supabase.
2. Execute `supabase-v8.sql` no SQL Editor.
3. Em Authentication > Users, crie o usuário administrador.
4. Em Project Settings > API, copie Project URL e anon public key.
5. Cole os dois valores em `config.js`.
6. Hospede a pasta em Vercel, Netlify ou GitHub Pages.

Nunca coloque a senha do administrador dentro do código.
