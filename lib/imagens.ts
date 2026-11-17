import imagens from "@/data/imagens.json";

/** full = JPG original; md = WebP do visualizador; thumb = WebP 640 px dos cartões. */
export type Variante = "thumb" | "md" | "full";

export type InfoImagem = { w: number; h: number; hash: string; blur: string };

const indice = imagens as Record<string, InfoImagem>;

export function infoImagem(arquivo: string | null | undefined): InfoImagem | undefined {
  return arquivo ? indice[arquivo] : undefined;
}

export function urlImagem(slug: string, arquivo: string, variante: Variante) {
  const info = infoImagem(arquivo);
  const h = info ? `&h=${info.hash}` : "";
  return `/api/mapas/${slug}/imagem?v=${variante}${h}`;
}