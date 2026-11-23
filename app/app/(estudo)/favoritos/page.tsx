import { catalogoDoAluno } from "@/lib/catalogo-aluno";
import type { Metadata } from "next";
import { PainelFavoritos } from "@/components/favoritos/painel";

export const metadata: Metadata = { title: "Favoritos" };

export default async function PaginaFavoritos() {
  const dados = await catalogoDoAluno();
  return <PainelFavoritos itens={dados.itens} />;
}
