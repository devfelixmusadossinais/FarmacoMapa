"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Pencil, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AreaIcon } from "@/components/brand/area-icon";
import { PerfilForm } from "@/components/estudo/perfil-form";
import { QuadroMapa } from "@/components/mapas/quadro";
import { areaPorId, listarMapas, obterItem, TOTAL_AREAS, TOTAL_BONUS, TOTAL_MAPAS } from "@/lib/catalog";
import { primeiroNome, pluralMapas } from "@/lib/text";
import { useStudy } from "@/lib/study-store";
import type { ItemCatalogo } from "@/lib/types";

function mapaParaContinuar(foco: string, ultimoSlug: string | null, revisados: string[]): ItemCatalogo | undefined {
  if (ultimoSlug) {
    const aberto = obterItem(ultimoSlug);
    if (aberto) return aberto;
  }
  const daArea = listarMapas().filter((mapa) => mapa.area === foco);
  const escolhido = daArea.find((mapa) => !revisados.includes(mapa.slug)) ?? daArea[0] ?? listarMapas()[0];
  return escolhido ? { ...escolhido, tipo: "mapa" } : undefined;
}

export function Dashboard() {
  const { perfil, salvarPerfil, progresso, revisadosMapas, revisadosHojeMapas } = useStudy();
  const [editando, setEditando] = useState(false);
  if (!perfil) return null;

  const area = areaPorId(perfil.areaFoco);
  const feitosHoje = revisadosHojeMapas.length;
  const faltam = Math.max(0, perfil.metaDiaria - feitosHoje);
  const percentualMeta = Math.min(100, Math.round((feitosHoje / perfil.metaDiaria) * 100));
  const percentualGeral = Math.round((revisadosMapas.length / TOTAL_MAPAS) * 100);
  const continuar = mapaParaContinuar(perfil.areaFoco, progresso.ultimoSlug, revisadosMapas);
  const nome = primeiroNome(perfil.nome);

  const textoMeta =
    faltam === 0
      ? "Meta de hoje fechada."
      : faltam === 1
        ? "Falta 1 mapa para fechar o dia."
        : `Faltam ${faltam} mapas para fechar o dia.`;

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[28px] bg-pine px-5 py-6 text-white shadow-[0_20px_50px_-28px_rgba(20,49,45,0.9)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-teal/40 blur-3xl" />
        <div className="relative flex items-start justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-teal-bright">
            <span className="size-1.5 rounded-full bg-teal-bright" />
            ACESSO LIBERADO
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full border-white/15 bg-white/10 px-3 text-white hover:bg-white/15 hover:text-white"
            onClick={() => setEditando(true)}
          >
            <Pencil />
            Editar
          </Button>
        </div>

        <h1 className="relative mt-6 font-heading text-[2.7rem] leading-[1.02] sm:text-6xl">Olá, {nome}.</h1>
        <p className="relative mt-2 text-white/75">O que você quer revisar hoje?</p>

        <dl className="relative mt-6 flex flex-wrap gap-x-6 gap-y-3">
          {[
            [TOTAL_MAPAS, "mapas"],
            [TOTAL_AREAS, "áreas"],
            [TOTAL_BONUS, "bônus"],
          ].map(([valor, rotulo]) => (
            <div key={rotulo}>
              <dt className="font-heading text-3xl text-teal-bright">{valor}</dt>
              <dd className="text-[11px] font-semibold tracking-[0.14em] text-white/60 uppercase">{rotulo}</dd>
            </div>
          ))}
        </dl>

        <div className="relative mt-6 grid gap-3 lg:grid-cols-[1.4fr_0.9fr]">
          <article className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-sm font-medium">
                <Target className="size-4 text-teal-bright" />
                Meta de hoje
              </p>
              <p className="font-heading text-2xl">
                {feitosHoje}/{perfil.metaDiaria}
              </p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-teal-bright" style={{ width: `${percentualMeta}%` }} />
            </div>
            <p className="mt-3 text-sm text-white/70">{textoMeta}</p>
          </article>

          {area ? (
            <Link
              href={`/mapas?area=${area.slug}`}
              className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 transition hover:bg-white/10"
            >
              <AreaIcon nome={area.icone} className="bg-pine-2" />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold tracking-[0.14em] text-white/55">SEU FOCO</span>
                <span className="block truncate font-heading text-2xl leading-tight">{area.nome}</span>
                <span className="block text-xs text-white/60">{pluralMapas(areaContagem(area.id))}</span>
              </span>
              <ArrowRight className="size-4 text-white/70" />
            </Link>
          ) : null}
        </div>
      </section>

      {continuar ? (
        <section className="rounded-[28px] bg-white p-4 shadow-[0_16px_40px_-28px_rgba(20,49,45,0.7)] ring-1 ring-black/5 sm:p-6">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-teal">CONTINUAR ESTUDANDO</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href={`/mapas/${continuar.slug}`} className="block overflow-hidden rounded-2xl sm:w-72 sm:shrink-0">
              <QuadroMapa item={continuar} />
            </Link>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-[2rem] leading-tight text-ink">{continuar.titulo}</h2>
              <p className="mt-1 text-sm text-ink/60">{areaPorId(continuar.area)?.nome ?? "Bônus"}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-ink/70">
                <span>
                  {revisadosMapas.length} de {TOTAL_MAPAS} mapas revisados
                </span>
                <span>{percentualGeral}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foam">
                <div className="h-full rounded-full bg-teal" style={{ width: `${percentualGeral}%` }} />
              </div>
              <Button asChild className="mt-4 h-11 rounded-2xl px-5">
                <Link href={`/mapas/${continuar.slug}`}>
                  Continuar
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <Dialog open={editando} onOpenChange={setEditando}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Ajustar seu estudo</DialogTitle>
            <DialogDescription>Nome, foco e meta ficam só neste navegador.</DialogDescription>
          </DialogHeader>
          <PerfilForm
            key={`${perfil.nome}-${perfil.areaFoco}-${perfil.metaDiaria}`}
            inicial={perfil}
            rotuloBotao="Salvar"
            onSubmit={(novo) => {
              salvarPerfil(novo);
              setEditando(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function areaContagem(id: string) {
  return listarMapas().filter((mapa) => mapa.area === id).length;
}
