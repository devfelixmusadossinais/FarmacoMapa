> **Um site só:** a landing (os `.html` da raiz + css/img/js/assets) abre em `/` e o app abre em `/app`. O `prebuild` copia a landing para `public/` (gerada, fora do git). Edite a landing nos arquivos da raiz.

# Mapa Mental Bioanálise

App de estudo, mobile primeiro, para revisar bioanálise com mapas mentais. A interface está em português. O catálogo traz 170 mapas em 14 áreas, mais 5 vagas de bônus ainda vazias.

O progresso, os favoritos e a meta do dia ficam no navegador. O e-mail da compra libera o acesso neste aparelho. A imagem de um mapa só é servida depois desse acesso.

## Rodar localmente

Requisitos: Node.js 22.

```bash
npm install
npm run dev
```

Abre em [http://127.0.0.1:4178](http://127.0.0.1:4178).

No ambiente de desenvolvimento, o e-mail de demonstração é `estudante@exemplo.com` (está em `data/allowlist.json`). Remova esse endereço antes de publicar.

Para simular a versão já compilada:

```bash
npm run build
npm start
```

## Rotas

| Rota | O que faz |
| --- | --- |
| `/app` | Porta de acesso, onboarding (nome, foco, meta 2/3/5) e início com “continuar estudando” |
| `/app/mapas` | Biblioteca. Filtro `?area=` e busca `?q=` sem acento |
| `/app/mapas/[slug]` | Mapa: zoom 100–300%, lightbox, favoritar, marcar revisado |
| `/app/favoritos` | Mapas marcados com o coração |
| `/app/bonus` | As 5 vagas de bônus |
| `/app/sugestoes` | Formulário. O pedido fica neste navegador |
| `/app/premium` | O que a versão completa inclui e o e-mail liberado |

No celular o menu abre pela esquerda. No desktop a mesma navegação fica fixa ao lado.

## Como trocar ou acrescentar um mapa

Não use a pasta `public/`. Arquivo em `public` fica com URL aberta, sem checar a compra.

1. Salve o JPG em `content/mapas/<slug>.jpg`. O nome do arquivo é o slug, sem subpasta.
2. No `data/catalogo.json`, edite o objeto ou acrescente um no array `mapas`:

```json
{
  "id": "serie-vermelha",
  "slug": "serie-vermelha",
  "titulo": "Série vermelha",
  "area": "hematologia",
  "keywords": ["hemacia", "vcm", "hcm"],
  "image": "serie-vermelha.jpg",
  "resumo": "",
  "pontosChave": []
}
```

`image` é o nome do arquivo dentro de `content/mapas/`. `null` significa “ainda sem arquivo” (é o caso dos 5 bônus). `area` é o `id` de uma das 14 áreas. `keywords` entram na busca. O slug vira a URL: `/mapas/serie-vermelha`.

Os bônus estão no array `bonus`. `area` fica `null`.

### Áreas

Coleta de amostras (7), Tubos de coleta (3), Hematologia (22), Coagulação (9), Urinálise (11), Bioquímica clínica (41), Microbiologia (14), Parasitologia (8), Imunologia (20), Biossegurança (1), Controle de qualidade (10), Endocrinologia (16), Líquidos biológicos (4), Banco de sangue (4). A soma é 170. A contagem do menu sai do JSON.

## Acesso

A pessoa digita o e-mail da compra. O servidor compara com:

1. `data/allowlist.json` — lista versionada
2. `data/allowlist.runtime.json` — gravada pelo webhook no `next dev` (não vai para o git)
3. `ALLOWLIST_EMAILS` — e-mails separados por vírgula

Se o e-mail existe, a resposta grava o cookie httpOnly `mmb_acesso`, assinado com `ACCESS_SECRET` (180 dias). Sem a variável, o desenvolvimento usa um segredo fixo e inseguro. Defina `ACCESS_SECRET` antes de qualquer deploy. O modelo está em `.env.example`.

Sair apaga o cookie. O progresso não vai embora com o logout.

### Imagens

`GET /api/mapas/[slug]/imagem` confere o cookie e só então devolve o JPG. Sem cookie: 401. Sem imagem publicada: 404. O arquivo pedido é o campo `image` do catálogo, resolvido dentro de `content/mapas/`, então `../` não escapa.

No `next dev` e no `next start` a rota lê o disco. Na Netlify os ~120 MB de JPG não cabem numa função: o zip de uma Lambda tem limite de 50 MB, e JPEG quase não comprime. Por isso o plugin local `netlify/plugins/mapas-blobs` (onPostBuild) copia os JPGs para a pasta de blobs do deploy, com a chave `mapas/<arquivo>`. A função fica pequena e lê o blob com `getDeployStore()` depois do cookie. `outputFileTracingExcludes` tira `content/mapas` do bundle para o deploy não estourar o limite.

Não use `output: 'export'`. Export estático não tem como barrar a imagem.

O JSON do catálogo viaja com a página. Título, área e palavras-chave não são secretos. O que fica protegido é o arquivo de imagem.

## Webhook da Hotmart ou da Kiwify

Os dois endpoints existem e estão desligados até existir `WEBHOOK_SECRET`:

- `POST /api/webhooks/hotmart`
- `POST /api/webhooks/kiwify`

Envie o segredo no header `x-webhook-token`.

Hotmart, compra aprovada:

```json
{ "event": "PURCHASE_APPROVED", "data": { "buyer": { "email": "aluno@email.com" } } }
```

Também aceita `PURCHASE_COMPLETE`. Reembolso, cancelamento, chargeback e protesto (`PURCHASE_REFUNDED`, `PURCHASE_CANCELED`, `PURCHASE_CHARGEBACK`, `PURCHASE_PROTEST`) tiram o e-mail só da lista de runtime.

Kiwify:

```json
{ "order_status": "paid", "Customer": { "email": "aluno@email.com" } }
```

`paid` e `approved` liberam. `refunded`, `chargedback`, `canceled` revogam na lista de runtime.

No `next dev`, o e-mail entra em `data/allowlist.runtime.json` e o próximo login passa. Essa gravação não serve em produção: na Netlify o disco da function não é durável e cada instância tem o seu. Antes de apontar a Hotmart ou a Kiwify para cá, troque `adicionarEmail` e `removerEmail` em `lib/acesso-store.ts` por uma loja de verdade (Netlify Blobs, Supabase ou o banco que você já usa). A allowlist versionada e a variável de ambiente continuam manuais: a revogação do webhook não apaga essas duas origens.

Sugestão de encaixe com Blobs, no lugar do `writeFileSync`:

```ts
import { getStore } from "@netlify/blobs";

const store = getStore("acesso");
await store.setJSON("emails", { emails });
```

E `emailsAutorizados()` passa a ler essa chave além do JSON e do env.

## O que fica no navegador

| Chave | Conteúdo |
| --- | --- |
| `mmb:perfil` | Nome, área de foco, meta 2, 3 ou 5 |
| `mmb:progresso` | Revisados, revisados de hoje, último mapa aberto |
| `mmb:favoritos` | Slugs |
| `mmb:sugestoes` | Formulário de sugestões |

A meta do dia conta mapas (não bônus) marcados como revisados na data local. “Continuar estudando” abre o último mapa visitado.

## Deploy na Netlify

Não publique enquanto a lista de exemplo e o segredo de desenvolvimento estiverem valendo.

1. Tire `estudante@exemplo.com` de `data/allowlist.json`.
2. No painel da Netlify, defina `ACCESS_SECRET` e, quando for ligar o webhook, `WEBHOOK_SECRET`. `ALLOWLIST_EMAILS` é opcional.
3. Conecte o repositório GitHub. O `netlify.toml` já define Node 22, o comando de build e `@netlify/plugin-nextjs`. Não fixe a versão do plugin: a Netlify atualiza o runtime de Next.
4. Não configure a pasta de publish como `out` ou `public`. O plugin entrega as páginas e as functions.
5. Não apague o passo `node scripts/publicar-mapas-netlify.mjs`. Sem ele o deploy sobe, mas a rota de imagem responde 404 na Netlify, porque a função não carrega os JPGs.
6. Confira um mapa logado (a imagem abre) e a mesma URL sem cookie (401).

Os blobs são do deploy, não uma loja global. Um deploy antigo não mistura a imagem com o próximo, e um deploy que falha não apaga a produção.

O site deste repositório não foi publicado em lugar nenhum.

## Cakto (acesso autom�tico)

Webhook: `POST /api/webhooks/cakto`, eventos `purchase_approved`, `refund` e `chargeback`. Valida `X-Cakto-Signature` (HMAC) ou o campo `secret` do corpo contra `CAKTO_WEBHOOK_SECRET`. O e-mail do comprador vai para o Netlify Blobs (loja `acessos`); o login em `/app` aceita quem tem pelo menos um pedido pago, mais `data/allowlist.json` (admin) e `ALLOWLIST_EMAILS`.

O produto é identificado por `data.product.id` ou `data.product` como string; `data` também pode ser uma lista (v2). `CAKTO_PRODUCT_ID_PREMIUM` sobrescreve o padrão público `93beac58-83e0-4d39-92a0-8ed4dc95438e`; `CAKTO_PRODUCT_ID_BASICO` sobrescreve `7c2de375-ee33-4ae2-8cc5-b272bbfd854e`. Produto desconhecido é ignorado, inclusive em reembolso/chargeback, com o ID registrado no log.

Básico libera 80 mapas por cotas proporcionais de maior resto e nenhum bônus; Premium libera o catálogo completo (170 mapas e 5 bônus). Gere `data/plano-basico.json` com `python scripts/gerar-plano-basico.py`; empates seguem a ordem das áreas no catálogo, com mínimo de um mapa por área. Os primeiros N mapas de cada área são selecionados na ordem do catálogo.

O plano é consultado no servidor a cada GET/POST de `/api/acesso` e requisição de imagem, sem gravá-lo no cookie. Pedido Premium pago tem prioridade; reembolso desse pedido mantém Básico quando existir outro pedido Básico pago. Allowlist fixa e pedidos antigos sem plano continuam Premium. Imagens fora do plano retornam 403 antes de ler os bytes, inclusive variantes e download. O ZIP `/downloads/mapa-mental-bioanalise-170-mapas.zip` exige Premium: a edge function valida o cookie e consulta `/api/acesso` no mesmo servidor, sem cache; falha na consulta bloqueia o download.

Testes sem dependência nova (Node 24): `node scripts/testar-plano.test.mjs`. A loja local é exercitada com o contexto da Netlify e o armazenamento de cookies simulados.
