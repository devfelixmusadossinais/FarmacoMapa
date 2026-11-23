import catalogo from "@/data/catalogo.json";
import basico from "@/data/plano-basico.json";

export type Plano = "basico" | "premium";

export const LIMITE = {
  basico: { mapas: basico.total, bonus: 0 },
  premium: { mapas: catalogo.mapas.length, bonus: catalogo.bonus.length },
};

const slugsBasicos = new Set(basico.slugs);

export function podeVerItem(plano: Plano | null, item: { tipo: "mapa" | "bonus"; slug: string }): boolean {
  if (!plano) return false;
  if (item.tipo === "bonus") return plano === "premium";
  return plano === "premium" || slugsBasicos.has(item.slug);
}

export function contagemLiberada(plano: Plano | null) {
  return {
    mapas: plano ? LIMITE[plano].mapas : 0,
    bonus: plano ? LIMITE[plano].bonus : 0,
    mapasTotal: LIMITE.premium.mapas,
    bonusTotal: LIMITE.premium.bonus,
  };
}
