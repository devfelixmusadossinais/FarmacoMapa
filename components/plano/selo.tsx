"use client";
import { useStudy } from "@/lib/study-store";
import { ROTULOS_PLANO } from "@/lib/plano-cliente";
export function SeloPlano() {
  const { plano } = useStudy();
  return plano ? <span className="inline-flex rounded-full bg-teal/15 px-3 py-1 text-xs font-semibold text-teal">{ROTULOS_PLANO[plano]}</span> : null;
}
