import catalogo from "@/data/catalogo.json";
import { fold } from "@/lib/text";
import type { Area, EntradaCatalogo, ItemCatalogo } from "@/lib/types";

const areas = catalogo.areas as Area[];
const mapas = catalogo.mapas as EntradaCatalogo[];
const bonus = catalogo.bonus as EntradaCatalogo[];

const porSlug = new Map<string, ItemCatalogo>();
for (const mapa of mapas) porSlug.set(mapa.slug, { ...mapa, tipo: "mapa" });
for (const item of bonus) porSlug.set(item.slug, { ...item, tipo: "bonus" });

export const TOTAL_MAPAS = mapas.length;
export const TOTAL_AREAS = areas.length;
export const TOTAL_BONUS = bonus.length;

export function listarAreas() {
  return areas;
}

export function listarMapas() {
  return mapas;
}

export function listarBonus() {
  return bonus;
}

export function areaPorId(id: string | null | undefined) {
  if (!id) return undefined;
  return areas.find((area) => area.id === id);
}

export function contagemDaArea(id: string) {
  return mapas.filter((mapa) => mapa.area === id).length;
}

export function obterItem(slug: string) {
  return porSlug.get(slug);
}

export function slugsValidos() {
  return new Set(porSlug.keys());
}

export function ehMapa(slug: string) {
  return porSlug.get(slug)?.tipo === "mapa";
}

export function filtrarMapas(areaSlug?: string, consulta?: string) {
  const termo = consulta ? fold(consulta) : "";
  return mapas.filter((mapa) => {
    if (areaSlug && mapa.area !== areaSlug) return false;
    if (!termo) return true;
    const area = areaPorId(mapa.area);
    const texto = [
      mapa.titulo,
      mapa.resumo,
      area?.nome ?? "",
      ...mapa.keywords,
      ...mapa.pontosChave,
    ].join(" ");
    return fold(texto).includes(termo);
  });
}

export function todosOsSlugs() {
  return [...porSlug.keys()];
}
