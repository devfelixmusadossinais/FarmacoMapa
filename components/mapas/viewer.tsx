"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Heart, Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuadroMapa } from "@/components/mapas/quadro";
import { areaPorId } from "@/lib/catalog";
import { useStudy } from "@/lib/study-store";
import type { ItemCatalogo } from "@/lib/types";

const MIN = 100;
const MAX = 300;
const PASSO = 25;

function limitar(valor: number) {
  return Math.min(MAX, Math.max(MIN, valor));
}

export function Viewer({ item }: { item: ItemCatalogo }) {
  const area = areaPorId(item.area);
  const { favorito, alternarFavorito, revisado, alternarRevisado, registrarAbertura } = useStudy();
  const registrar = useRef(registrarAbertura);
  registrar.current = registrarAbertura;
  const [zoom, setZoom] = useState(100);
  const [aberto, setAberto] = useState(false);
  const marcado = revisado(item.slug);
  const salvo = favorito(item.slug);

  useEffect(() => {
    registrar.current(item.slug);
  }, [item.slug]);

  function ajustar(delta: number) {
    setZoom((atual) => limitar(atual + delta));
  }

  return (
    <article>
      <p className="text-sm text-ink/55">
        <Link href="/" className="hover:text-teal">
          Início
        </Link>
        <span className="px-1.5">/</span>
        {item.tipo === "bonus" || !area ? (
          <Link href="/bonus" className="hover:text-teal">
            Bônus
          </Link>
        ) : (
          <Link href={`/mapas?area=${area.slug}`} className="hover:text-teal">
            {area.nome}
          </Link>
        )}
        <span className="px-1.5">/</span>
        <span className="text-ink/80">{item.titulo}</span>
      </p>

      <p className="mt-4 text-[11px] font-semibold tracking-[0.16em] text-teal uppercase">
        {area?.nome ?? "Bônus"}
      </p>
      <h1 className="mt-2 font-heading text-[2.4rem] leading-[1.05] text-ink sm:text-5xl">{item.titulo}</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/70">
        {item.resumo || "O resumo deste mapa ainda está em branco."}
      </p>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-12 rounded-2xl text-base",
            salvo && "border-transparent bg-[#fdeceb] text-clay hover:bg-[#f8e0dc] hover:text-clay",
          )}
          onClick={() => alternarFavorito(item.slug)}
        >
          <Heart className={salvo ? "fill-current" : ""} />
          {salvo ? "Remover dos favoritos" : "Favoritar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-12 rounded-2xl text-base",
            marcado && "border-transparent bg-[#e5f6ec] text-sage hover:bg-[#d7f0e2] hover:text-sage",
          )}
          onClick={() => alternarRevisado(item.slug)}
        >
          <Check />
          {marcado ? "Revisado" : "Marcar como revisado"}
        </Button>
      </div>

      <div className="mt-5 overflow-hidden rounded-[24px] bg-white ring-1 ring-black/5">
        <div className="max-h-[68vh] overflow-auto">
          <div style={{ width: `${zoom}%` }} className="min-w-full">
            <QuadroMapa item={item} zoomavel />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white p-2 ring-1 ring-black/5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 rounded-xl"
          aria-label="Diminuir zoom"
          disabled={zoom <= MIN}
          onClick={() => ajustar(-PASSO)}
        >
          <Minus />
        </Button>
        <p className="flex-1 text-center font-heading text-2xl" aria-live="polite">
          {zoom}%
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 rounded-xl"
          aria-label="Aumentar zoom"
          disabled={zoom >= MAX}
          onClick={() => ajustar(PASSO)}
        >
          <Plus />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 rounded-xl"
          aria-label="Voltar para 100%"
          onClick={() => setZoom(100)}
        >
          <RotateCcw />
        </Button>
      </div>
      <p className="mt-2 text-center text-xs text-ink/50">Zoom de {MIN}% a {MAX}%, de {PASSO} em {PASSO}.</p>

      <Button
        type="button"
        className="mt-3 h-12 w-full rounded-2xl text-base"
        onClick={() => setAberto(true)}
      >
        <Maximize2 />
        Ver em tamanho completo
      </Button>

      <section className="mt-6 rounded-[24px] bg-white p-5 ring-1 ring-black/5">
        <h2 className="font-heading text-2xl text-ink">Pontos-chave</h2>
        {item.pontosChave.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/80">
            {item.pontosChave.map((ponto) => (
              <li key={ponto} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal" />
                <span>{ponto}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-ink/65">
            Ainda vazio. Quando o mapa for escrito, os pontos-chave aparecem nesta lista.
          </p>
        )}
        {item.keywords.length > 0 ? (
          <p className="mt-4 text-xs text-ink/50">Termos: {item.keywords.join(", ")}</p>
        ) : (
          <p className="mt-4 text-xs text-ink/45">Sem palavras-chave por enquanto. A busca usa o título e o nome da área.</p>
        )}
      </section>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="fixed inset-0 top-0 left-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-3 overflow-hidden rounded-none bg-[#14312d] p-4 text-white sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[92dvh] sm:w-[min(96vw,64rem)] sm:max-w-none sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <DialogTitle className="pr-8 font-heading text-2xl">{item.titulo}</DialogTitle>
          <DialogDescription className="text-white/70">
            {area?.nome ?? "Bônus"} · {zoom}%
          </DialogDescription>
          <div className="min-h-0 flex-1 overflow-auto rounded-2xl bg-[#0e2421]">
            <div style={{ width: `${zoom}%` }} className="min-w-full">
              <QuadroMapa item={item} zoomavel />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button type="button" variant="outline" size="icon" className="size-11 border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white" aria-label="Diminuir zoom" disabled={zoom <= MIN} onClick={() => ajustar(-PASSO)}>
              <Minus />
            </Button>
            <span className="w-16 text-center font-heading text-xl">{zoom}%</span>
            <Button type="button" variant="outline" size="icon" className="size-11 border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white" aria-label="Aumentar zoom" disabled={zoom >= MAX} onClick={() => ajustar(PASSO)}>
              <Plus />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
