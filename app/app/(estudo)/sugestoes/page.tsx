import type { Metadata } from "next";
import { FormularioSugestao } from "@/components/sugestoes/formulario";

export const metadata: Metadata = { title: "Sugestões" };

export default function PaginaSugestoes() {
  return (
    <div className="mx-auto max-w-xl">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-teal">O QUE AINDA FALTA</p>
      <h1 className="mt-2 font-heading text-4xl text-ink sm:text-5xl">Sugestões</h1>
      <p className="mt-2 mb-6 text-sm leading-relaxed text-ink/65">
        Se um tema do laboratório não tem vaga útil para você, descreva o mapa. Guardamos o pedido neste navegador.
      </p>
      <FormularioSugestao />
    </div>
  );
}
