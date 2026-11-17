import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Viewer } from "@/components/mapas/viewer";
import { obterItem, todosOsSlugs } from "@/lib/catalog";

export function generateStaticParams() {
  return todosOsSlugs().map((slug) => ({ slug }));
}

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
  return <Viewer item={item} />;
}
