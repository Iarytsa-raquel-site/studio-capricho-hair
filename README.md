# Studio Capricho Hair — MVP

Protótipo funcional do sistema de agendamento.

## O que já funciona
- Área da cliente
- Escolha de serviço
- Escolha de profissional
- Data e horário
- Bloqueio de conflito de horários
- Confirmação de agendamento
- Meus agendamentos
- Cancelamento
- Área administrativa
- Resumo de agendamentos e faturamento previsto
- Agendamento rápido pelo Studio
- Armazenamento local no navegador (localStorage)
- Manifesto PWA e service worker básico

## Como testar
1. Abra `index.html` no navegador.
2. Faça um agendamento.
3. Toque em “Área do Studio” para verificar se ele apareceu no painel.

## Importante
Esta versão usa apenas o navegador para salvar os dados. É ideal para protótipo e testes.
A próxima etapa é conectar Supabase para que os dados fiquem online, sincronizados e acessíveis em vários aparelhos.


## Melhorias da versão 2
- Perfil completo da profissional
- Especialidades e apresentação profissional
- Seção de experiência e informações do atendimento
- Portfólio de trabalhos realizados
- Galeria na página inicial
- Página completa de portfólio
- Avaliações
- Botões para agendar diretamente com a profissional
- Estrutura preparada para substituir os modelos por fotos reais do Studio

### Próxima melhoria recomendada
Enviar fotos reais dos trabalhos e informações exatas da profissional (nome, especialidades, anos de experiência, Instagram, WhatsApp, cursos/certificações e descrição) para personalizar completamente o app.

## Versão 3
- 4 fotos reais de trabalhos adicionadas ao portfólio.
- Bio profissional atualizada com as informações fornecidas do Instagram.
- Especialidade em alisamento destacada.
- Localização em Jundiaí e atendimento com hora marcada.
- Instagram @caprichoohair_ integrado ao perfil.
- Dados exibidos: 80 posts e 270 seguidores, conforme informações fornecidas pelo usuário.


## Versão 4 — experiência comercial
- Home redesenhada como vitrine completa do Studio.
- Hero com foto real e CTA de agendamento.
- Destaque para especialização em alisamento.
- Portfólio real integrado na tela inicial.
- Perfil profissional mais completo.
- Serviços visíveis logo na home.
- Passo a passo de como agendar.
- Área preparada para avaliações reais.
- Localização e Instagram em destaque.
- FAQ.
- Botão de agendamento fixo no rodapé.
- Removida avaliação fictícia.
- Profissional única ajustada para “Studio Capricho”, evitando inventar nomes.
- Dados públicos informados pelo usuário do Instagram exibidos no perfil.

## Versão 5
- Botão “Ver mais” sobre cada foto do portfólio.
- Cada botão direciona diretamente para o Instagram oficial informado: @caprichoohair_.
- O recurso aparece tanto nas fotos da página inicial quanto nas galerias que reutilizam o portfólio.


## Versão 6 — painel administrativo
- Painel dividido em Agenda, Serviços, Perfil e Portfólio.
- Cadastro, edição e exclusão de serviços pelo próprio app.
- Edição das informações do Studio sem mexer no código.
- Cadastro de novas imagens do portfólio via URL.
- Exclusão de fotos do portfólio.
- Persistência local das alterações.
- Nova seção visual de Antes e Depois.
- Mantido botão “Ver mais” para Instagram em cada foto.

### Observação
As mudanças desta versão ficam salvas no navegador do aparelho. Para sincronizar entre vários celulares e computadores, o próximo passo é conectar o app ao Supabase.
