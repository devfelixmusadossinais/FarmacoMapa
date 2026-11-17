import { readFile } from "node:fs/promises";
import path from "node:path";
import { obterItem } from "@/lib/catalog";
import { infoImagem, type Variante } from "@/lib/imagens";
import { lerSessao } from "@/lib/sessao";
import { nomeArquivo } from "@/lib/nomes";

const TIPOS: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
};

const CONTENT = path.resolve(process.cwd(), "content");

/** Caminho relativo a content/ (e chave do blob): mapas/<arquivo> ou variantes/<arquivo>.<v>.webp */
function chaveDe(arquivo: string, variante: Variante) {
  return variante === "full" ? `mapas/${arquivo}` : `variantes/${arquivo}.${variante}.webp`;
}

async function lerDoDisco(chave: string) {
  const arquivo = path.resolve(CONTENT, chave);
  if (!arquivo.startsWith(`${CONTENT}${path.sep}`)) return null;
  try {
    return await readFile(arquivo);
  } catch {
    return null;
  }
}

type LojaDeploy = { get(chave: string, opcoes: { type: "arrayBuffer" }): Promise<ArrayBuffer | null> };
let lojas: LojaDeploy[] | null = null;

async function abrirLojas() {
  if (lojas) return lojas;
  const { getDeployStore } = await import("@netlify/blobs");
  // Mesma regra de região do plugin do Next. A primeira que responder fica na frente.
  const regional = process.env.USE_REGIONAL_BLOBS?.toUpperCase() === "TRUE";
  const tentativas: Array<{ region?: "us-east-2" }> = regional ? [{}, { region: "us-east-2" }] : [{ region: "us-east-2" }, {}];
  lojas = [];
  for (const opcoes of tentativas) {
    try {
      lojas.push(getDeployStore(opcoes) as unknown as LojaDeploy);
    } catch (erro) {
      console.error("[imagem] loja indisponível:", erro instanceof Error ? erro.message : "erro");
    }
  }
  return lojas;
}

async function lerDoBlob(chave: string) {
  if (!process.env.NETLIFY && !process.env.NETLIFY_BLOBS_CONTEXT) return null;
  for (const loja of await abrirLojas()) {
    try {
      const dados = await loja.get(chave, { type: "arrayBuffer" });
      if (dados) return Buffer.from(dados);
    } catch (erro) {
      console.error("[imagem] falha ao ler blob:", erro instanceof Error ? erro.message : "erro");
    }
  }
  return null;
}

async function ler(chave: string) {
  return (await lerDoDisco(chave)) ?? (await lerDoBlob(chave));
}

export async function GET(requisicao: Request, contexto: { params: Promise<{ slug: string }> }) {
  const sessao = await lerSessao();
  if (!sessao) {
    return new Response("Acesso negado", { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }

  const { slug } = await contexto.params;
  const item = obterItem(slug);
  if (!item) return new Response("Mapa não encontrado", { status: 404 });
  if (!item.image) return new Response("Imagem ainda não publicada", { status: 404 });

  const url = new URL(requisicao.url);
  const pedida = url.searchParams.get("v");
  const variante: Variante = pedida === "thumb" || pedida === "md" ? pedida : "full";
  const info = infoImagem(item.image);
  const etag = `"${info?.hash ?? "x"}-${variante}"`;
  // URL com o hash atual nunca muda de conteúdo: cache de 1 ano só no navegador (private).
  const cache =
    info && url.searchParams.get("h") === info.hash
      ? "private, max-age=31536000, immutable"
      : "private, max-age=3600";

  if (info && requisicao.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag, "Cache-Control": cache } });
  }

  let servida = variante;
  let bytes = await ler(chaveDe(item.image, variante));
  if (!bytes && variante !== "full") {
    servida = "full";
    bytes = await ler(chaveDe(item.image, "full"));
  }
  if (!bytes) {
    console.error(`[imagem] arquivo ausente: ${chaveDe(item.image, variante)}`);
    return new Response("Arquivo ausente", { status: 404 });
  }

  const baixar = url.searchParams.get("download") === "1";
  const extensao = servida === "full" ? path.extname(item.image).toLowerCase() : ".webp";
  const nome = `${nomeArquivo(item.titulo) || item.slug}${extensao}`;
  const ascii = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7e]/g, "_");
  const disposicao: Record<string, string> = baixar
    ? { "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nome)}` }
    : {};
  const tipo =
    servida === "full" ? (TIPOS[path.extname(item.image).toLowerCase()] ?? "application/octet-stream") : "image/webp";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": tipo,
      "Content-Length": String(bytes.length),
      "Cache-Control": servida === variante ? cache : "private, max-age=3600",
      ETag: servida === variante ? etag : `"${info?.hash ?? "x"}-full"`,
      "X-Content-Type-Options": "nosniff",
      ...disposicao,
    },
  });
}