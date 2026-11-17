"use client";

import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { PerfilForm } from "@/components/estudo/perfil-form";
import { listarAreas, TOTAL_AREAS, TOTAL_BONUS, TOTAL_MAPAS } from "@/lib/catalog";
import { useStudy } from "@/lib/study-store";
import type { Perfil } from "@/lib/types";

const numeros = [
  { valor: TOTAL_MAPAS, rotulo: "Mapas" },
  { valor: TOTAL_AREAS, rotulo: "Áreas" },
  { valor: TOTAL_BONUS, rotulo: "Bônus" },
];

export function Onboarding() {
  const { salvarPerfil } = useStudy();
  const router = useRouter();

  function concluir(perfil: Perfil) {
    window.scrollTo(0, 0);
    salvarPerfil(perfil);
    router.push("/app");
  }

  // Pular: grava um perfil padrão (dá pra editar depois) e nunca mais mostra esta tela.
  function pular() {
    window.scrollTo(0, 0);
    salvarPerfil({ nome: "Estudante", areaFoco: listarAreas()[0]?.id ?? "geral", metaDiaria: 3 });
    router.push("/app/mapas");
  }

  return (
    <div className="min-h-dvh bg-pine text-white">
      <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-8">
        <div className="flex flex-col items-center px-2 text-center">
          <Logo className="size-16 text-teal" />
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-teal-bright">
            <span className="size-1.5 rounded-full bg-teal-bright" />
            ACESSO LIBERADO
          </p>
          <h1 className="mt-5 font-heading text-[2.7rem] leading-[1.02]">Vamos montar seu plano</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">
            {TOTAL_MAPAS} mapas de bioanálise, em {TOTAL_AREAS} áreas. Escolha o nome, o foco e a meta do dia.
          </p>
          <div className="mt-6 grid w-full grid-cols-3 overflow-hidden rounded-[22px] border border-white/10 bg-white/5">
            {numeros.map((item, indice) => (
              <div key={item.rotulo} className={indice > 0 ? "border-l border-white/10 px-2 py-4" : "px-2 py-4"}>
                <p className="font-heading text-4xl text-teal-bright">{item.valor}</p>
                <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-white/70 uppercase">{item.rotulo}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[28px] bg-white p-5 text-ink shadow-2xl">
          <PerfilForm onSubmit={concluir} rotuloBotao="Começar a estudar" />
        </div>

        <button
          type="button"
          onClick={pular}
          className="mx-auto mt-5 rounded-2xl border border-white/25 px-5 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10"
        >
          Pular por agora e ver os mapas →
        </button>
      </div>
    </div>
  );
}
