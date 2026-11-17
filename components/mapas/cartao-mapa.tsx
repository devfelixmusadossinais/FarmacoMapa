import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { areaPorId } from "@/lib/catalog";
import type { ItemCatalogo } from "@/lib/types";
import { QuadroMapa } from "@/components/mapas/quadro";

export function CartaoMapa({ item }: { item: ItemCatalogo }) {
  const area = areaPorId(item.area);
  return (
    <Link
      href={`/app/mapas/${item.slug}`}
      className="group flex flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_-18px_rgba(20,49,45,0.45)] ring-1 ring-black/5 transition hover:-translate-y-0.5"
    >
      <QuadroMapa item={item} />
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-teal uppercase">
          {area?.nome ?? "Bônus"}
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h2 className="font-heading text-[1.65rem] leading-tight text-ink">{item.titulo}</h2>
          <ArrowRight className="mt-2 size-4 shrink-0 text-ink/35 transition group-hover:translate-x-0.5" />
        </div>
        {item.resumo ? (
          <p className="mt-2 text-sm leading-relaxed text-ink/65">{item.resumo}</p>
        ) : item.image ? null : (
          <p className="mt-2 text-sm leading-relaxed text-ink/65">
            Resumo em preparação. A vaga deste mapa já está reservada no catálogo.
          </p>
        )}
      </div>
    </Link>
  );
}
