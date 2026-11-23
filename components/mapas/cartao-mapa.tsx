"use client";

import { useState } from "react";
import { useStudy } from "@/lib/study-store";
import { ConviteUpgrade } from "@/components/plano/convite-upgrade";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useCatalogo } from "@/lib/catalogo-cliente";
import type { ItemAluno } from "@/lib/catalogo-cliente";
import { QuadroMapa } from "@/components/mapas/quadro";

export function CartaoMapa({ item }: { item: ItemAluno }) {
  const { areaPorId } = useCatalogo();
  const { liberado } = useStudy();
  const bloqueado = !liberado(item.slug);
  const [upgrade, setUpgrade] = useState(false);
  const area = areaPorId(item.area);
  return (
    <>
    <Link
      prefetch={bloqueado ? false : undefined}
      onClick={evento => { if (bloqueado) { evento.preventDefault(); setUpgrade(true); } }}
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
          {bloqueado ? <LockKeyhole aria-label="Bloqueado" className="mt-2 size-5 shrink-0 text-teal" /> : <ArrowRight className="mt-2 size-4 shrink-0 text-ink/35 transition group-hover:translate-x-0.5" />}
        </div>
        {!bloqueado && item.resumo ? (
          <p className="mt-2 text-sm leading-relaxed text-ink/65">{item.resumo}</p>
        ) : bloqueado || item.image || item.capa ? null : (
          <p className="mt-2 text-sm leading-relaxed text-ink/65">
            Resumo em preparação. A vaga deste mapa já está reservada no catálogo.
          </p>
        )}
      </div>
    </Link>
    <ConviteUpgrade open={upgrade} onOpenChange={setUpgrade} />
    </>
  );
}
