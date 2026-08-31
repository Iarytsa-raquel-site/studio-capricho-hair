# Studio Capricho Hair — Sistema de gestão

Sistema comercial responsivo para estúdios de beleza, com página pública, orçamento, solicitações de horário, painel administrativo, agenda, clientes, disponibilidade, conclusão de atendimentos, financeiro e recibos em PDF.

## O que está pronto

- Página pública com identidade preto/dourado, informações do estúdio e catálogo carregado do banco.
- Orçamento com vários serviços, quantidades, subtotais e total.
- Data/horário somente entre disponibilidades livres.
- Registro do pedido antes da abertura do WhatsApp.
- Login de administradores por e-mail e senha (Supabase Auth).
- Dashboard com faturamento, despesas, lucro, ticket, agenda e gráfico de seis meses.
- CRUD de serviços, clientes, horários, agendamentos, despesas e configurações.
- Confirmação de solicitação que cria agendamento sem duplicar.
- Conclusão idempotente, forma de pagamento e recibo PDF.
- Financeiro baseado apenas em atendimentos concluídos.
- Reabertura/cancelamento com retirada correta do faturamento.
- RLS, validação no banco, preço recalculado no servidor, rate limit e bloqueio de conflito.

## Supabase já configurado

O projeto real do Studio Capricho Hair já recebeu as migrações. Os 40 serviços, clientes e agendamentos anteriores foram preservados; antes da atualização foi criado o snapshot privado `backup_capricho_20260830`, protegido por RLS e sem acesso pela API pública.

A conta que já existia no Supabase Auth foi autorizada como administradora. Use o mesmo e-mail e senha dessa conta em `/admin`. Se a senha tiver sido esquecida, redefina-a em **Supabase > Authentication > Users**.

Para instalar uma nova cópia vendável em outro projeto:

1. Crie um projeto gratuito em `supabase.com`.
2. Execute `supabase/migrations/20260830000000_initial.sql` no SQL Editor.
3. Crie a conta em **Authentication > Users > Add user**.
4. Autorize a administradora:

```sql
insert into public.administrators (user_id, email)
select id, email from auth.users where email = 'SEU-EMAIL@EXEMPLO.COM'
on conflict (user_id) do update set active = true, email = excluded.email;
```

5. Em **Project Settings > API**, copie apenas:
   - Project URL
   - chave pública `anon`/`publishable`

Nunca use a chave `service_role` no site.

## Variáveis necessárias em outra instalação

Configure no ambiente de publicação:

```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=SUA-CHAVE-PUBLICA-ANON
```

A chave `anon` é pública por definição. A proteção está nas políticas RLS e nas funções `security definer` validadas.

## Primeiro uso

1. Entre em `/admin` com a conta criada.
2. Revise os 40 serviços e seus preços reais.
3. Revise a disponibilidade inicial, criada de terça a sábado, das 09h às 17h, para os próximos 45 dias.
4. Revise **Configurações**.
5. Faça um pedido de teste na página pública.
6. Confirme o pedido, conclua o agendamento e confira o recibo e o financeiro.

## Personalização para outro negócio

No painel, altere nome, especialidade, slogan, WhatsApp, Instagram, endereço, cidade, horário, mensagem do recibo e cores. O monograma fica em `components/monogram.tsx`; troque `CH` pelas iniciais desejadas. O visual global fica em `app/globals.css`.

Para vender a manicures, nail designers, barbearias ou clínicas, use a mesma estrutura do banco e adapte apenas os textos, unidades de serviço e identidade visual. Não altere as funções de conclusão, conflito de horário ou recálculo de preço sem revisar as dependências.

## Tabelas

| Tabela | Finalidade |
|---|---|
| `administrators` | Lista autorizada de usuários do Auth |
| `studio_settings` | Identidade, contatos e dados dos recibos |
| `services` | Catálogo e preços oficiais |
| `clients` | Cadastro e vínculo do histórico |
| `availability` | Datas, horários, bloqueios e ativação |
| `quotes` | Solicitações e status |
| `quote_items` | Itens e preços congelados do orçamento |
| `appointments` | Agenda e conclusão |
| `appointment_items` | Serviços executados no agendamento |
| `attendances` | Receita concluída e recibo único |
| `expenses` | Saídas financeiras |

## Políticas e funções de segurança

- RLS ativado em todas as tabelas.
- `is_admin()`: valida a conta autenticada na lista de administradores.
- Público lê somente configurações do estúdio e serviços ativos.
- Dados privados exigem usuário autenticado e autorizado.
- `submit_public_request()`: valida campos, normaliza telefone, limita repetições, trava o horário e recalcula os itens usando `services.price`.
- `public_available_dates()` e `public_available_slots()`: expõem somente horários livres.
- `confirm_quote()`: cria um único agendamento e impede conflito.
- `complete_appointment()`: cria um único atendimento e recibo.
- `set_appointment_status()`: reabre/cancela e atualiza o financeiro.
- `admin_save_appointment()`: cria ou edita a agenda, vincula a cliente e evita conflitos.
- `admin_dashboard()`: consolida indicadores somente para administradores.
- Índice parcial exclusivo impede dois agendamentos ativos no mesmo horário.

## Publicação gratuita

A combinação recomendada é Supabase Free para dados/autenticação e o Site já preparado para publicação. Depois de configurar as duas variáveis acima, publique uma nova versão. O endereço público e `/admin` funcionarão no mesmo domínio.

Também é possível usar uma hospedagem compatível com Next/Vinext e variáveis de ambiente. Preserve `.openai/hosting.json`, os scripts de build e as rotas de API.

## Checklist de validação

- [x] Build de produção e lint.
- [x] Renderização das rotas `/` e `/admin`.
- [x] Serviços públicos sem preço fixo no navegador.
- [x] RLS e autorização administrativa presentes em todas as tabelas.
- [x] Recalculo de preço oficial no banco.
- [x] Rate limit, honeypot, hash de duplicidade e normalização do telefone.
- [x] Bloqueio de horário duplicado.
- [x] Confirmação idempotente de solicitação.
- [x] Conclusão idempotente e recibo único.
- [x] Faturamento originado somente de `attendances`.
- [x] Reabertura/cancelamento remove a receita correspondente.
- [x] Geração e reemissão do PDF.
- [x] Abertura do WhatsApp do estúdio e da cliente.
- [x] Layout e menu adaptados para celular, tablet e computador.
- [x] Integração com projeto Supabase real, chave pública moderna e administradora autorizada.
- [x] Snapshot privado dos dados anteriores e migrações aplicadas.
- [ ] Login interativo com a senha da administradora (a senha não é acessível ao sistema de implantação).
