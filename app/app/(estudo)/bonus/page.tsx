import { catalogoDoAluno } from "@/lib/catalogo-aluno";
import type { Metadata } from "next";
import { PainelBonus } from "@/components/bonus/painel";

export const metadata: Metadata = { title: "Bônus" };

export default async function PaginaBonus() {
  const dados = await catalogoDoAluno();
  return <PainelBonus itens={dados.itens.filter(item => item.tipo === "bonus")} />;
}
