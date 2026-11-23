import "server-only";
import { cache } from "react";
import { listarAreas, listarMapas, listarBonus } from "@/lib/catalog";
import { lerSessao } from "@/lib/sessao";
import { planoDoEmail } from "@/lib/acesso-store";
import { podeVerItem, type Plano } from "@/lib/plano";
import type { ItemCatalogo } from "@/lib/types";
import type { ItemAluno, ItemPublico } from "@/lib/catalogo-cliente";

export const planoDaSessao = cache(async () => {
  const sessao = await lerSessao();
  return sessao ? planoDoEmail(sessao.email) : null;
});
export function itemPublico(item: ItemCatalogo): ItemPublico {
  return { slug: item.slug, titulo: item.titulo, area: item.area, image: item.image, ...(item.capa ? { capa: item.capa } : {}), tipo: item.tipo };
}
export function itemDoAluno(item: ItemCatalogo, plano: Plano | null): ItemAluno {
  return podeVerItem(plano, item) ? { ...item } : itemPublico(item);
}
export async function catalogoDoAluno() {
  const plano = await planoDaSessao();
  const itens = [...listarMapas().map(item => ({ ...item, tipo: "mapa" as const })), ...listarBonus().map(item => ({ ...item, tipo: "bonus" as const }))];
  return { plano, areas: listarAreas(), publicos: itens.map(itemPublico), itens: itens.map(item => itemDoAluno(item, plano)), slugsLiberados: itens.filter(item => podeVerItem(plano, item)).map(item => item.slug) };
}
