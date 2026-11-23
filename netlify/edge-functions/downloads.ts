/**
 * Protege /downloads/* (o ZIP com todos os mapas, servido estático pela CDN).
 * Confere o mesmo cookie de sessão do app (mmb_acesso, HMAC-SHA256 com ACCESS_SECRET).
 * Com sessão válida e plano Premium, devolve undefined e a Netlify entrega o arquivo da CDN (sem limite
 * de tamanho de função). Sem sessão: 401.
 */
declare const Netlify: { env: { get(nome: string): string | undefined } };

const enc = new TextEncoder();

function b64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deB64url(texto: string) {
  const s = texto.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

function iguais(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function negar() {
  return new Response("Acesso negado. Entre no app com o e-mail da compra.", {
    status: 401,
    headers: { "Cache-Control": "private, no-store", "Content-Type": "text/plain; charset=utf-8" },
  });
}

export default async (requisicao: Request) => {
  const segredo = Netlify.env.get("ACCESS_SECRET");
  if (!segredo) return negar();
  const m = (requisicao.headers.get("cookie") ?? "").match(/(?:^|;\s*)mmb_acesso=([^;]+)/);
  if (!m) return negar();
  try {
    const [payload, assinatura] = decodeURIComponent(m[1]).split(".");
    if (!payload || !assinatura) return negar();
    const chave = await crypto.subtle.importKey("raw", enc.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, [
      "sign",
    ]);
    const mac = new Uint8Array(await crypto.subtle.sign("HMAC", chave, enc.encode(payload)));
    if (!iguais(b64url(mac), assinatura)) return negar();
    const dados = JSON.parse(deB64url(payload)) as { email?: unknown; exp?: unknown };
    if (typeof dados.email !== "string" || typeof dados.exp !== "number" || dados.exp < Date.now()) return negar();
  } catch {
    return negar();
  }
  // A API valida o mesmo cookie e consulta a loja a cada requisição.
  try {
    const resposta = await fetch(new URL("/api/acesso", requisicao.url), {
      headers: { cookie: requisicao.headers.get("cookie") ?? "" },
      cache: "no-store",
      redirect: "error",
    });
    if (!resposta.ok) return negar();
    const acesso = await resposta.json() as { autenticado?: boolean; plano?: string | null };
    if (!acesso.autenticado) return negar();
    if (acesso.plano !== "premium") {
      return new Response("Conteúdo fora do seu plano", {
        status: 403,
        headers: { "Cache-Control": "private, no-store", "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  } catch {
    return negar();
  }
  return undefined;
};

export const config = { path: "/downloads/*" };
