import { itemDoAluno, planoDaSessao } from "@/lib/catalogo-aluno";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Viewer } from "@/components/mapas/viewer";
import { obterItem } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = obterItem(slug);
  return { title: item?.titulo ?? "Mapa" };
}

export default async function PaginaMapa({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = obterItem(slug);
  if (!item) notFound();
  return <Viewer item={itemDoAluno(item, await planoDaSessao())} />;
}
