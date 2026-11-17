"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Search, X } from "lucide-react";
import { ZIP_TODOS } from "@/lib/nomes";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { CartaoMapa } from "@/components/mapas/cartao-mapa";
import { areaPorId, filtrarMapas, listarAreas, TOTAL_MAPAS } from "@/lib/catalog";
import { pluralMapas } from "@/lib/text";

export function Explorer({ areaInicial, consultaInicial }: { areaInicial: string; consultaInicial: string }) {
  const router = useRouter();
  const areas = listarAreas();
  const [consulta, setConsulta] = useState(consultaInicial);
  const area = areaPorId(areaInicial);
  const areaInvalida = Boolean(areaInicial) && !area;
  const areaRef = useRef(areaInicial);
  const ignorarBusca = useRef(true);
  areaRef.current = areaInicial;

  useEffect(() => {
    ignorarBusca.current = true;
    setConsulta(consultaInicial);
  }, [consultaInicial]);

  useEffect(() => {
    if (ignorarBusca.current) {
      ignorarBusca.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      const texto = consulta.trim();
      if (areaRef.current) params.set("area", areaRef.current);
      if (texto) params.set("q", texto);
      const query = params.toString();
      router.replace(query ? `/app/mapas?${query}` : "/app/mapas", { scroll: false });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [consulta, router]);

  function publicar(proximaArea: string, proximaConsulta: string) {
    const texto = proximaConsulta.trim();
    const params = new URLSearchParams();
    if (proximaArea) params.set("area", proximaArea);
    if (texto) params.set("q", texto);
    const query = params.toString();
    router.replace(query ? `/app/mapas?${query}` : "/app/mapas", { scroll: false });
  }

  const mapas = useMemo(
    () => (areaInvalida ? [] : filtrarMapas(area?.id, consultaInicial)),
    [area?.id, areaInvalida, consultaInicial],
  );

  const titulo = area ? area.nome : "Todos os mapas";
  const subtitulo = area
    ? area.linha
    : "Escolha uma área ou busque por tema. A busca ignora acentos.";

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.16em] text-teal">
        BIBLIOTECA COMPLETA · {TOTAL_MAPAS} MAPAS
      </p>
      <h1 className="mt-2 font-heading text-4xl leading-tight text-ink sm:text-5xl">{titulo}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/65">{subtitulo}</p>

      <a
        href={ZIP_TODOS}
        download
        className="mt-4 inline-flex h-12 items-center gap-2 rounded-2xl bg-pine px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-pine/90"
      >
        <Download className="size-4" />
        Baixar todos os {TOTAL_MAPAS} mapas (ZIP, ~125 MB)
      </a>
      <p className="mt-1.5 text-xs text-ink/50">Um arquivo só, com uma pasta por área. Bom para guardar no tablet ou no computador.</p>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink/40" />
        <label htmlFor="busca-mapas" className="sr-only">
          Buscar mapas, temas ou conceitos
        </label>
        <input
          id="busca-mapas"
          value={consulta}
          onChange={(evento) => setConsulta(evento.target.value)}
          placeholder="Buscar mapas, temas ou conceitos..."
          className="h-12 w-full rounded-2xl border border-border bg-white pr-10 pl-10 text-base outline-none focus-visible:border-teal focus-visible:ring-3 focus-visible:ring-teal/30"
        />
        {consulta ? (
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-ink/40"
            aria-label="Limpar busca"
            onClick={() => {
              setConsulta("");
              publicar(areaInicial, "");
            }}
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          type="button"
          onClick={() => publicar("", consulta)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm",
            !areaInicial ? "bg-pine text-white" : "bg-white text-ink ring-1 ring-black/5",
          )}
        >
          Todos
        </button>
        {areas.map((item) => {
          const ativo = areaInicial === item.slug;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => publicar(ativo ? "" : item.slug, consulta)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm",
                ativo ? "bg-pine text-white" : "bg-white text-ink ring-1 ring-black/5",
              )}
            >
              <span className={cn("size-1.5 rounded-full", ativo ? "bg-teal-bright" : "bg-teal")} />
              {item.nome}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-ink/60">{pluralMapas(mapas.length)}</p>

      {areaInvalida ? (
        <EstadoVazio
          titulo="Essa área não está no catálogo"
          texto="O filtro da URL não corresponde a nenhuma das 14 áreas."
          onLimpar={() => publicar("", consulta)}
        />
      ) : mapas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum mapa com esse termo"
          texto="Tente o nome da área sem acento, por exemplo bioquimica ou hematologia. Os títulos ainda são placeholders."
          onLimpar={() => {
            setConsulta("");
            publicar(areaInicial, "");
          }}
        />
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mapas.map((mapa) => (
            <CartaoMapa key={mapa.slug} item={{ ...mapa, tipo: "mapa" }} />
          ))}
        </div>
      )}
    </div>
  );
}

function EstadoVazio({ titulo, texto, onLimpar }: { titulo: string; texto: string; onLimpar: () => void }) {
  return (
    <div className="mt-6 rounded-[24px] bg-white px-5 py-10 text-center ring-1 ring-black/5">
      <h2 className="font-heading text-3xl text-ink">{titulo}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/65">{texto}</p>
      <Button type="button" variant="outline" className="mt-5 h-11 rounded-2xl" onClick={onLimpar}>
        Limpar filtro
      </Button>
    </div>
  );
}
