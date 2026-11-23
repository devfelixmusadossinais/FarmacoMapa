import type { Plano } from "./plano";

export const URL_UPGRADE = "https://pay.cakto.com.br/3bs3zqy";
export const ROTULOS_PLANO = { basico: "Básico", premium: "Premium" };
export const TEXTOS_PLANO = { foraDoPlano: "Conteúdo fora do seu plano" };

export function podeVerItem(
  plano: Plano | null,
  slugsLiberados: readonly string[],
  item: { tipo: "mapa" | "bonus"; slug: string },
): boolean {
  if (!plano) return false;
  if (item.tipo === "bonus") return plano === "premium";
  return plano === "premium" || slugsLiberados.includes(item.slug);
}
