"use client";

import { createContext, useContext } from "react";
import type { Area, ItemCatalogo } from "@/lib/types";

export type ItemPublico = Pick<ItemCatalogo, "slug" | "titulo" | "area" | "image" | "capa" | "tipo">;
export type ItemAluno = ItemPublico & Partial<Pick<ItemCatalogo, "resumo" | "pontosChave" | "keywords">>;
export type CatalogoPublico = { areas: Area[]; itens: ItemPublico[] };
const Contexto = createContext<CatalogoPublico>({ areas: [], itens: [] });
export function CatalogoProvider({ value, children }: { value: CatalogoPublico; children: React.ReactNode }) {
  return <Contexto.Provider value={value}>{children}</Contexto.Provider>;
}
export function useCatalogo() {
  const { areas, itens } = useContext(Contexto);
  return {
    listarAreas: () => areas,
    listarMapas: () => itens.filter(item => item.tipo === "mapa"),
    areaPorId: (id: string | null | undefined) => areas.find(area => area.id === id),
    contagemDaArea: (id: string) => itens.filter(item => item.tipo === "mapa" && item.area === id).length,
    obterItem: (slug: string) => itens.find(item => item.slug === slug),
    ehMapa: (slug: string) => itens.some(item => item.slug === slug && item.tipo === "mapa"),
    TOTAL_MAPAS: itens.filter(item => item.tipo === "mapa").length,
    TOTAL_BONUS: itens.filter(item => item.tipo === "bonus").length,
    TOTAL_AREAS: areas.length,
  };
}
