# Fichário TCG

Controle da coleção de Pokémon TCG com o menor preço da LigaPokemon (português, NM).

- Site estático (HTML + JS), publicado no Cloudflare Pages.
- Dados e login no Supabase (projeto `fichario-holo`). O acesso é restrito ao e-mail do dono por RLS.
- Preços atualizados diariamente por uma tarefa agendada do Claude, que coleta na Liga pelo navegador do app Claude e grava na tabela `prices`.

Tabelas: `sets`, `cards`, `owned` (cartas que você tem e valor pago), `prices` (histórico diário), `sys` (apoio da coleta).
