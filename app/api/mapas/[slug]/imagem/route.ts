import { readFile } from "node:fs/promises";
import path from "node:path";
import { obterItem } from "@/lib/catalog";
import { lerSessao } from "@/lib/sessao";

const TIPOS: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
};

const RAIZ = path.resolve(process.cwd(), "content", "mapas");

function caminhoSeguro(relativo: string) {
  const arquivo = path.resolve(RAIZ, relativo);
  if (arquivo !== RAIZ && arquivo.startsWith(`${RAIZ}${path.sep}`)) return arquivo;
  return null;
}

async function lerDoDisco(relativo: string) {
  const arquivo = caminhoSeguro(relativo);
  if (!arquivo) return null;
  try {
    return await readFile(arquivo);
  } catch {
    return null;
  }
}

async function lerDoBlob(chave: string) {
  if (!process.env.NETLIFY && !process.env.NETLIFY_BLOBS_CONTEXT) return null;
  try {
    const { getDeployStore } = await import("@netlify/blobs");
    const store = getDeployStore("mapas");
    const dados = await store.get(chave, { type: "arrayBuffer" });
    if (!dados) return null;
    return Buffer.from(dados);
  } catch {
    return null;
  }
}

export async function GET(_requisicao: Request, contexto: { params: Promise<{ slug: string }> }) {
  const sessao = await lerSessao();
  if (!sessao) {
    return new Response("Acesso negado", { status: 401 });
  }

  const { slug } = await contexto.params;
  const item = obterItem(slug);
  if (!item) return new Response("Mapa não encontrado", { status: 404 });
  if (!item.image) return new Response("Imagem ainda não publicada", { status: 404 });

  const bytes = (await lerDoDisco(item.image)) ?? (await lerDoBlob(item.image));
  if (!bytes) {
    return new Response("Arquivo ausente", { status: 404 });
  }

  const tipo = TIPOS[path.extname(item.image).toLowerCase()] ?? "application/octet-stream";
  return new Response(bytes, {
    headers: {
      "Content-Type": tipo,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
