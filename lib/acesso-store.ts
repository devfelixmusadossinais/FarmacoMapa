import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import allowlist from "@/data/allowlist.json";

/**
 * Loja de e-mails autorizados.
 *
 * v1 junta três origens:
 * 1. data/allowlist.json — lista versionada (exemplo local + quem você adicionar à mão)
 * 2. data/allowlist.runtime.json — gravada pelo webhook em `next dev` (gitignored)
 * 3. ALLOWLIST_EMAILS — variável de ambiente, separada por vírgula
 *
 * Na Netlify o disco some a cada invocação. Troque `adicionarEmail` / `removerEmail`
 * por Netlify Blobs, Supabase ou outro banco antes de ligar o webhook de verdade.
 * O README descreve o encaixe.
 */

const runtimePath = path.join(process.cwd(), "data", "allowlist.runtime.json");

function normalizar(email: string) {
  return email.trim().toLowerCase();
}

function lerRuntime(): string[] {
  try {
    const bruto = readFileSync(runtimePath, "utf8");
    const dados = JSON.parse(bruto) as { emails?: unknown };
    if (!Array.isArray(dados.emails)) return [];
    return dados.emails.filter((item): item is string => typeof item === "string").map(normalizar);
  } catch {
    return [];
  }
}

function gravarRuntime(emails: string[]) {
  mkdirSync(path.dirname(runtimePath), { recursive: true });
  writeFileSync(runtimePath, `${JSON.stringify({ emails }, null, 2)}\n`);
}

export function emailsAutorizados() {
  const doArquivo = (allowlist.emails ?? []).map(normalizar).filter(Boolean);
  const doAmbiente = (process.env.ALLOWLIST_EMAILS ?? "")
    .split(",")
    .map(normalizar)
    .filter(Boolean);
  return new Set([...doArquivo, ...lerRuntime(), ...doAmbiente]);
}

export function emailAutorizado(email: string) {
  return emailsAutorizados().has(normalizar(email));
}

export function adicionarEmail(email: string) {
  const limpo = normalizar(email);
  if (!limpo.includes("@")) {
    throw new Error("E-mail inválido.");
  }
  const atual = new Set(lerRuntime());
  atual.add(limpo);
  gravarRuntime([...atual]);
  return limpo;
}

export function removerEmail(email: string) {
  const limpo = normalizar(email);
  const atual = lerRuntime().filter((item) => item !== limpo);
  gravarRuntime(atual);
  return limpo;
}
