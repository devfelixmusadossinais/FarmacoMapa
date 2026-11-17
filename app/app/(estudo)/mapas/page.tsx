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
  return <Explorer areaInicial={params.area ?? ""} consultaInicial={params.q ?? ""} />;
}
