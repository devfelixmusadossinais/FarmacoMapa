import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHmac } from "node:crypto";
import { test } from "node:test";

// O loader usa apenas o Node 24; os módulos de produção são testados sem cópias.
const raiz = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const temporario = mkdtempSync(path.join(raiz, ".teste-plano-"));
const ambiente = { ...process.env };
const cwd = process.cwd();
const fetchOriginal = globalThis.fetch;
const logOriginal = console.log;
let cookie;
globalThis.__cookiesPlano = () => ({
  get: () => cookie ? { value: cookie } : undefined,
  set: (_nome, valor) => { cookie = valor; },
});
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@netlify/blobs") {
      // Isola o contexto da Netlify: os testes exercitam a loja local de produção.
      return { url: "data:text/javascript,export function getStore() { throw new Error('Sem contexto Netlify no teste'); }", shortCircuit: true };
    }
    if (specifier === "next/headers") {
      return { url: "data:text/javascript,export const cookies = async () => globalThis.__cookiesPlano();", shortCircuit: true };
    }
    if (specifier.startsWith("@/")) specifier = pathToFileURL(path.join(raiz, specifier.slice(2))).href;
    if ((specifier.startsWith("file:") || specifier.startsWith(".")) && !path.extname(specifier)) {
      const url = new URL(specifier, context.parentURL);
      if (existsSync(fileURLToPath(url) + ".ts")) specifier = url.href + ".ts";
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".json")) {
      return { format: "module", source: `export default ${readFileSync(new URL(url), "utf8")};`, shortCircuit: true };
    }
    if (url.endsWith(".ts")) {
      return { format: "module", source: stripTypeScriptTypes(readFileSync(new URL(url), "utf8")), shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

try {
  process.chdir(temporario);
  delete process.env.NETLIFY;
  delete process.env.NETLIFY_BLOBS_CONTEXT;
  process.env.ALLOWLIST_EMAILS = "";
  process.env.ALLOWLIST_BASICO = "";
  process.env.ACCESS_SECRET = "segredo-sintetico-do-teste";
  process.env.CAKTO_WEBHOOK_SECRET = "webhook-sintetico-do-teste";
  delete process.env.CAKTO_PRODUCT_ID_BASICO;
  delete process.env.CAKTO_PRODUCT_ID_PREMIUM;
  const store = await import(new URL("../lib/acesso-store.ts", import.meta.url));
  const plano = await import(new URL("../lib/plano.ts", import.meta.url));
  const cliente = await import(new URL("../lib/plano-cliente.ts", import.meta.url));
  const cakto = await import(new URL("../lib/cakto-plano.ts", import.meta.url));
  const webhook = await import(new URL("../app/api/webhooks/cakto/route.ts", import.meta.url));
  const acesso = await import(new URL("../app/api/acesso/route.ts", import.meta.url));
  const sessao = await import(new URL("../lib/sessao.ts", import.meta.url));
  const imagem = await import(new URL("../app/api/mapas/[slug]/imagem/route.ts", import.meta.url));
  const edge = (await import(new URL("../netlify/edge-functions/downloads.ts", import.meta.url))).default;
  const catalogo = JSON.parse(readFileSync(path.join(raiz, "data/catalogo.json"), "utf8"));
  const basico = JSON.parse(readFileSync(path.join(raiz, "data/plano-basico.json"), "utf8"));
  const fora = catalogo.mapas.find(m => !basico.slugs.includes(m.slug));
  const bonus = { ...catalogo.bonus[0], tipo: "bonus" };
  const email = "teste@exemplo.invalid";
  const registrar = (id, status, tipo) => store.registrarPedido({ email, pedidoId: id, status, plano: tipo, origem: "teste", evento: status });

  await test("Básico pago bloqueia mapa fora dos 80 e todos os bônus", async () => {
    await registrar("basico", "pago", "basico");
    assert.equal(await store.planoDoEmail(email), "basico");
    assert.equal(plano.podeVerItem("basico", { ...fora, tipo: "mapa" }), false);
    assert.equal(plano.podeVerItem("basico", bonus), false);
    assert.equal(cliente.podeVerItem("basico", basico.slugs, bonus), false);
    assert.deepEqual(plano.contagemLiberada("basico"), { mapas: 80, bonus: 0, mapasTotal: 170, bonusTotal: 5 });
  });
  await test("Premium pago e upgrade liberam bônus imediatamente", async () => {
    await registrar("premium", "pago", "premium");
    assert.equal(await store.planoDoEmail(email), "premium");
    assert.equal(plano.podeVerItem("premium", bonus), true);
    assert.equal(store.planoDoRegistro({ pedidos: { p: { status: "pago", plano: "premium" } } }), "premium");
  });
  await test("Reembolso Premium mantém Básico; repetição não altera plano nem ressuscita pedido", async () => {
    await registrar("premium", "reembolsado", "basico");
    assert.equal(await store.planoDoEmail(email), "basico");
    assert.equal((await registrar("premium", "pago", "premium")).mudou, false);
    assert.equal((await registrar("basico", "pago", "premium")).mudou, false);
    const registro = JSON.parse(readFileSync("data/acessos.local.json", "utf8"))[encodeURIComponent(email)];
    assert.equal(registro.pedidos.premium.plano, "premium");
    assert.equal(registro.pedidos.basico.plano, "basico");
  });
  await test("Reembolso e chargeback do único pedido retiram acesso", async () => {
    for (const status of ["reembolsado", "chargeback"]) {
      assert.equal(store.planoDoRegistro({ pedidos: { p: { status, plano: "basico" } } }), null);
    }
    await registrar("basico", "chargeback", "basico");
    assert.equal(await store.planoDoEmail(email), null);
    assert.equal(await store.emailAutorizado(email), false);
    assert.equal(plano.podeVerItem(null, bonus), false);
    const resposta = await acesso.POST(new Request("https://teste.invalid/api/acesso", {
      method: "POST", body: JSON.stringify({ email }),
    }));
    assert.equal(resposta.status, 401);
    assert.equal((await resposta.json()).plano, null);
  });
  await test("Allowlist de arquivo/ambiente e pedidos legados permanecem Premium", async () => {
    const allowlist = JSON.parse(readFileSync(path.join(raiz, "data/allowlist.json"), "utf8"));
    assert.ok(allowlist.emails.length);
    assert.equal(await store.planoDoEmail(allowlist.emails[0]), "premium");
    process.env.ALLOWLIST_EMAILS = " AMBIENTE@EXEMPLO.INVALID ";
    assert.equal(await store.planoDoEmail("ambiente@exemplo.invalid"), "premium");
    for (const id of ["hotmart:antigo", "manual:sem-id"]) {
      assert.equal(store.planoDoRegistro({ pedidos: { [id]: { status: "pago" } } }), "premium");
    }
    assert.equal(store.planoDoRegistro(null), null);
  });
  await test("Allowlist Básico de arquivo/ambiente e e-mail sem pedido", async () => {
    const allowlist = JSON.parse(readFileSync(path.join(raiz, "data/allowlist.json"), "utf8"));
    assert.equal(await store.planoDoEmail(allowlist.basico[0]), "basico");
    try {
      process.env.ALLOWLIST_BASICO = " BASICO-AMBIENTE@EXEMPLO.INVALID ";
      assert.equal(await store.planoDoEmail("basico-ambiente@exemplo.invalid"), "basico");
      assert.equal(await store.planoDoEmail("sem-pedido@exemplo.invalid"), null);
    } finally {
      process.env.ALLOWLIST_BASICO = "";
    }
  });
  await test("Premium vence quando o e-mail está nas duas listas", async () => {
    try {
      process.env.ALLOWLIST_BASICO = "premium.teste.atlas@example.com";
      assert.equal(await store.planoDoEmail("premium.teste.atlas@example.com"), "premium");
    } finally {
      process.env.ALLOWLIST_BASICO = "";
    }
  });
  const enviar = (event, data) => webhook.POST(new Request("https://teste.invalid/api/webhooks/cakto", {
    method: "POST", body: JSON.stringify({ secret: process.env.CAKTO_WEBHOOK_SECRET, event, data }),
  }));
  await test("Produto desconhecido nunca grava, inclusive refund/chargeback e lista v2", async () => {
    const antes = readFileSync("data/acessos.local.json", "utf8");
    console.log = () => {};
    for (const evento of ["purchase_approved", "refund", "chargeback"]) {
      for (const product of ["desconhecido", { id: "desconhecido" }, null]) {
        const pedido = { id: "nao-gravar", customer: { email }, product };
        assert.equal(cakto.decidirPlanoProduto(pedido).plano, null);
        const resposta = await enviar(evento, [pedido]);
        assert.equal(resposta.status, 200);
        assert.deepEqual(await resposta.json(), { recebido: true, ignorado: true, motivo: "produto desconhecido" });
      }
    }
    console.log = logOriginal;
    assert.equal(readFileSync("data/acessos.local.json", "utf8"), antes);
  });
  await test("Cakto reconhece objeto v1, string v2 e IDs sobrescritos", async () => {
    assert.equal(cakto.decidirPlanoProduto({ product: { id: cakto.PRODUTO_BASICO } }).plano, "basico");
    assert.equal(cakto.decidirPlanoProduto({ product: "publico" }, { premium: "publico" }).plano, "premium");
    console.log = () => {};
    await enviar("purchase_approved", { id: "v1", customer: { email }, product: { id: cakto.PRODUTO_BASICO } });
    assert.equal(await store.planoDoEmail(email), "basico");
    await enviar("purchase_approved", [{ id: "v2", customer: { email }, product: cakto.PRODUTO_PREMIUM }]);
    assert.equal(await store.planoDoEmail(email), "premium");
    await enviar("refund", { id: "v2", customer: { email }, product: cakto.PRODUTO_PREMIUM });
    assert.equal(await store.planoDoEmail(email), "basico");
    console.log = logOriginal;
  });
  await test("Catálogo Básico tem 80 slugs únicos, todos mapas, cotas válidas e primeiros N por área", () => {
    assert.equal(basico.slugs.length, 80);
    assert.equal(new Set(basico.slugs).size, 80);
    assert.equal(Object.keys(basico.cotas).length, 14);
    assert.equal(Object.values(basico.cotas).reduce((a, b) => a + b, 0), 80);
    for (const slug of basico.slugs) {
      assert.ok(catalogo.mapas.some(m => m.slug === slug));
      assert.ok(!catalogo.bonus.some(m => m.slug === slug));
    }
    for (const area of catalogo.areas) {
      const mapas = catalogo.mapas.filter(m => m.area === area.id);
      assert.ok(basico.cotas[area.id] >= 1 && basico.cotas[area.id] <= mapas.length);
      assert.deepEqual(mapas.filter(m => basico.slugs.includes(m.slug)), mapas.slice(0, basico.cotas[area.id]));
    }
  });
  await test("API lê plano do servidor: login normalizado, upgrade e reembolso sem novo cookie", async () => {
    assert.deepEqual(await (await acesso.GET()).json(), { autenticado: false, plano: null });
    const resposta = await acesso.POST(new Request("https://teste.invalid/api/acesso", { method: "POST", body: JSON.stringify({ email: ` ${email.toUpperCase()} ` }) }));
    assert.equal((await resposta.json()).plano, "basico");
    const original = cookie;
    await registrar("upgrade", "pago", "premium");
    assert.equal((await (await acesso.GET()).json()).plano, "premium");
    await registrar("upgrade", "reembolsado", "premium");
    assert.equal((await (await acesso.GET()).json()).plano, "basico");
    assert.equal(cookie, original);
    const payload = JSON.parse(Buffer.from(cookie.split(".")[0], "base64url").toString());
    assert.equal("plano" in payload, false);
  });
  await test("Imagem aplica 401, 404 e 403 antes dos bytes, variantes e download", async () => {
    const pedir = (slug, consulta = "") => imagem.GET(new Request(`https://teste.invalid/api/mapas/${slug}/imagem${consulta}`), { params: Promise.resolve({ slug }) });
    cookie = undefined;
    assert.equal((await pedir(fora.slug)).status, 401);
    cookie = sessao.assinarSessao(email);
    assert.equal((await pedir("inexistente")).status, 404);
    for (const consulta of ["", "?v=full", "?v=thumb", "?v=md", "?download=1", "?v=thumb&download=1"]) {
      const resposta = await pedir(fora.slug, consulta);
      assert.equal(resposta.status, 403);
      assert.equal(await resposta.text(), "Conteúdo fora do seu plano");
      assert.equal(resposta.headers.get("Cache-Control"), "private, no-store");
    }
    assert.equal((await pedir(bonus.slug)).status, 403);
  });
  await test("ZIP exige Premium consultado no servidor; erro e cookie inválido bloqueiam", async () => {
    globalThis.Netlify = { env: { get: nome => process.env[nome] } };
    const token = sessao.assinarSessao(email);
    // Confere também a assinatura gerada pela sessão de produção.
    assert.equal(token.split(".")[1], createHmac("sha256", process.env.ACCESS_SECRET).update(token.split(".")[0]).digest("base64url"));
    const req = new Request("https://teste.invalid/downloads/mapa-mental-bioanalise-170-mapas.zip", { headers: { cookie: `mmb_acesso=${token}` } });
    globalThis.fetch = async (url, opcoes) => {
      assert.equal(url.pathname, "/api/acesso");
      assert.equal(opcoes.headers.cookie, req.headers.get("cookie"));
      assert.equal(opcoes.cache, "no-store");
      return acesso.GET();
    };
    assert.equal((await edge(req)).status, 403);
    await registrar("zip-premium", "pago", "premium");
    assert.equal(await edge(req), undefined);
    await registrar("zip-premium", "chargeback", "premium");
    assert.equal((await edge(req)).status, 403);
    globalThis.fetch = async () => { throw new Error("indisponível"); };
    assert.equal((await edge(req)).status, 401);
    assert.equal((await edge(new Request(req.url))).status, 401);
    assert.equal((await edge(new Request(req.url, { headers: { cookie: "mmb_acesso=%" } }))).status, 401);
  });
} finally {
  console.log = logOriginal;
  globalThis.fetch = fetchOriginal;
  delete globalThis.Netlify;
  delete globalThis.__cookiesPlano;
  hooks.deregister();
  process.chdir(cwd);
  for (const nome of Object.keys(process.env)) if (!(nome in ambiente)) delete process.env[nome];
  Object.assign(process.env, ambiente);
  rmSync(temporario, { recursive: true, force: true });
}
