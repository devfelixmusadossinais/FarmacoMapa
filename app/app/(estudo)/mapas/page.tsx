import { catalogoDoAluno } from "@/lib/catalogo-aluno";
import type { Metadata } from "next";
import { Explorer } from "@/components/mapas/explorer";

export const metadata: Metadata = {
  title: "Mapas",
};

export default async function PaginaMapas({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; q?: string }>;
}) {
  const params = await searchParams;
  const dados = await catalogoDoAluno();
  return <Explorer itens={dados.itens.filter(item => item.tipo === "mapa")} areaInicial={params.area ?? ""} consultaInicial={params.q ?? ""} />;
}
