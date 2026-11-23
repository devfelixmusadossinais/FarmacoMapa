import { catalogoDoAluno } from "@/lib/catalogo-aluno";
import type { Metadata } from "next";
import { Dashboard } from "@/components/home/dashboard";

export const metadata: Metadata = {
  title: "Início",
};

export default async function PaginaInicio() {
  const dados = await catalogoDoAluno();
  return <Dashboard itens={dados.itens} />;
}
