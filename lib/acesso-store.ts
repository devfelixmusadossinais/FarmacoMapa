import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getStore } from "@netlify/blobs";
import allowlist from "@/data/allowlist.json";

/**
 * Quem pode entrar no app. Quatro origens:
 * 1. data/allowlist.json — lista versionada (admin e liberações manuais)
 * 2. ALLOWLIST_EMAILS — variável de ambiente, separada por vírgula
 * 3. Netlify Blobs, loja "acessos" (site inteiro, consistência forte) — gravada
 *    pelos webhooks (Cakto, Hotmart, Kiwify). Persiste entre deploys.
 * 4. Fora da Netlify (next dev / next start local): data/acessos.local.json
 *    faz o papel da loja (gitignored).
 *
 * Cada e-mail guarda os pedidos. O acesso vale enquanto houver pelo menos um
 * pedido pago; reembolso ou chargeback de um pedido não derruba os outros.
 */

export type StatusPedido = "pago" | "reembolsado" | "chargeback";

export type RegistroAcesso = {
  email: string;
  pedidos: Record<string, { status: StatusPedido; origem: string; evento: string; em: string }>;
  atualizadoEm: string;
};

const LOJA = "acessos";
const arquivoLocal = path.join(process.cwd(), "data", "acessos.local.json");

export function normalizar(email: string) {
  return email.trim().toLowerCase();
}

function chave(email: string) {
  return encodeURIComponent(normalizar(email));
}

type Loja = {
  ler(email: string): Promise<RegistroAcesso | null>;
  gravar(registro: RegistroAcesso): Promise<void>;
  nome: string;
};

function lojaLocal(): Loja {
  const lerTudo = (): Record<string, RegistroAcesso> => {
    try {
      return JSON.parse(readFileSync(arquivoLocal, "utf8")) as Record<string, RegistroAcesso>;
    } catch {
      return {};
    }
  };
  return {
    nome: "arquivo-local",
    async ler(email) {
      return lerTudo()[chave(email)] ?? null;
    },
    async gravar(registro) {
      const tudo = lerTudo();
      tudo[chave(registro.email)] = registro;
      mkdirSync(path.dirname(arquivoLocal), { recursive: true });
      writeFileSync(arquivoLocal, `${JSON.stringify(tudo, null, 2)}\n`);
    },
  };
}

function abrirLoja(): Loja {
  try {
    const store = getStore({ name: LOJA, consistency: "strong" });
    return {
      nome: "netlify-blobs",
      async ler(email) {
        return ((await store.get(chave(email), { type: "json" })) as RegistroAcesso | null) ?? null;
      },
      async gravar(registro) {
        await store.setJSON(chave(registro.email), registro);
      },
    };
  } catch {
    // Sem contexto da Netlify (rodando local): usa o arquivo.
    if (process.env.NETLIFY === "true" || process.env.NETLIFY_BLOBS_CONTEXT) {
      console.error("[acesso] Netlify Blobs indisponível; usando arquivo local (não persiste).");
    }
    return lojaLocal();
  }
}

function listaFixa() {
  const doArquivo = (allowlist.emails ?? []).map(normalizar).filter(Boolean);
  const doAmbiente = (process.env.ALLOWLIST_EMAILS ?? "").split(",").map(normalizar).filter(Boolean);
  return new Set([...doArquivo, ...doAmbiente]);
}

export function temPedidoPago(registro: RegistroAcesso | null) {
  if (!registro) return false;
  return Object.values(registro.pedidos ?? {}).some((p) => p.status === "pago");
}

export async function emailAutorizado(email: string) {
  const limpo = normalizar(email);
  if (listaFixa().has(limpo)) return true;
  try {
    return temPedidoPago(await abrirLoja().ler(limpo));
  } catch (erro) {
    console.error("[acesso] falha ao ler a loja:", erro instanceof Error ? erro.message : "erro");
    return false;
  }
}

/**
 * Registra o novo status de um pedido. Idempotente: o mesmo evento repetido não muda nada.
 * Um pedido reembolsado/chargeback não volta a "pago" por retentativa atrasada.
 */
export async function registrarPedido(params: {
  email: string;
  pedidoId: string;
  status: StatusPedido;
  origem: string;
  evento: string;
}) {
  const email = normalizar(params.email);
  if (!email.includes("@")) throw new Error("E-mail inválido.");
  const loja = abrirLoja();
  const atual = (await loja.ler(email)) ?? { email, pedidos: {}, atualizadoEm: "" };
  const anterior = atual.pedidos[params.pedidoId];
  if (anterior && anterior.status !== "pago" && params.status === "pago") {
    return { email, mudou: false, autorizado: temPedidoPago(atual), loja: loja.nome };
  }
  if (anterior?.status === params.status) {
    return { email, mudou: false, autorizado: temPedidoPago(atual), loja: loja.nome };
  }
  const agora = new Date().toISOString();
  atual.pedidos[params.pedidoId] = {
    status: params.status,
    origem: params.origem,
    evento: params.evento,
    em: agora,
  };
  atual.atualizadoEm = agora;
  await loja.gravar(atual);
  return { email, mudou: true, autorizado: temPedidoPago(atual), loja: loja.nome };
}

/** Compatível com os webhooks antigos (Hotmart/Kiwify), que não mandam id de pedido aqui. */
export async function adicionarEmail(email: string, origem = "manual") {
  return (await registrarPedido({ email, pedidoId: `${origem}:sem-id`, status: "pago", origem, evento: "liberar" })).email;
}

export async function removerEmail(email: string, origem = "manual") {
  const limpo = normalizar(email);
  const loja = abrirLoja();
  const atual = await loja.ler(limpo);
  if (!atual) return limpo;
  for (const id of Object.keys(atual.pedidos)) {
    atual.pedidos[id] = { ...atual.pedidos[id], status: "reembolsado", evento: `revogar:${origem}` };
  }
  atual.atualizadoEm = new Date().toISOString();
  await loja.gravar(atual);
  return limpo;
}

export function mascarar(email: string) {
  const [u, d] = normalizar(email).split("@");
  return `${(u ?? "").slice(0, 2)}***@${d ?? ""}`;
}