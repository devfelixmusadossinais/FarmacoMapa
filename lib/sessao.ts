import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { COOKIE_ACESSO } from "@/lib/chaves";

const DURACAO_MS = 1000 * 60 * 60 * 24 * 180;
const DURACAO_S = 60 * 60 * 24 * 180;

function segredo() {
  return process.env.ACCESS_SECRET || "dev-apenas-local-troque-em-producao";
}

export function assinarSessao(email: string) {
  const exp = Date.now() + DURACAO_MS;
  const payload = Buffer.from(JSON.stringify({ email, exp }), "utf8").toString("base64url");
  const assinatura = createHmac("sha256", segredo()).update(payload).digest("base64url");
  return `${payload}.${assinatura}`;
}

export function lerToken(token: string | undefined | null): { email: string } | null {
  if (!token) return null;
  const [payload, assinatura] = token.split(".");
  if (!payload || !assinatura) return null;
  const esperada = createHmac("sha256", segredo()).update(payload).digest("base64url");
  const a = Buffer.from(assinatura);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const dados = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email?: unknown;
      exp?: unknown;
    };
    if (typeof dados.email !== "string" || typeof dados.exp !== "number") return null;
    if (dados.exp < Date.now()) return null;
    return { email: dados.email };
  } catch {
    return null;
  }
}

export async function lerSessao() {
  const jar = await cookies();
  return lerToken(jar.get(COOKIE_ACESSO)?.value);
}

export async function gravarSessao(email: string) {
  const jar = await cookies();
  jar.set(COOKIE_ACESSO, assinarSessao(email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_S,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function apagarSessao() {
  const jar = await cookies();
  jar.set(COOKIE_ACESSO, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function segredoConfere(recebido: string | null) {
  const esperado = process.env.WEBHOOK_SECRET;
  if (!esperado) return "sem-config" as const;
  if (!recebido) return "invalido" as const;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "invalido" as const;
  return "ok" as const;
}
