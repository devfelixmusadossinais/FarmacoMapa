"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Gift, Home, LayoutGrid, LogOut, MessageSquarePlus, Sparkles } from "lucide-react";
import { cn } from "cn";
import { AreaIcon } from "@/components/brand/area-icon";
import { Marca } from "@/components/brand/marca";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { contagemDaArea, listarAreas, TOTAL_MAPAS } from "@/lib/catalog";
import { useStudy } from "@/lib/study-store";

function classeItem(ativo: boolean) {
  return cn(
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
    ativo ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/8 hover:text-white",
  );
}

export function Sidebar({ onFechar }: { onFechar?: () => void }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const areaAtual = params.get("area");
  const { revisadosMapas, sair } = useStudy();
  const areas = listarAreas();
  const percentual = Math.round((revisadosMapas.length / TOTAL_MAPAS) * 100);

  function ir() {
    onFechar?.();
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-pine text-white">
      <div className="flex items-start justify-between gap-3 px-4 pt-5 pb-3">
        <Marca />
        {onFechar ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={onFechar}
            aria-label="Fechar menu"
          >
            <span className="text-lg leading-none">×</span>
          </Button>
        ) : null}
      </div>

      <ScrollArea className="h-0 min-h-0 flex-1 px-3">
        <nav className="flex flex-col gap-1 pb-4">
          <Link href="/app" onClick={ir} className={classeItem(pathname === "/app")}>
            <Home className="size-4" />
            Início
          </Link>
          <Link
            href="/app/mapas"
            onClick={ir}
            className={classeItem(pathname === "/app/mapas" && !areaAtual)}
          >
            <LayoutGrid className="size-4" />
            <span className="flex-1">Todos os mapas</span>
            <span className="text-xs text-white/50">{TOTAL_MAPAS}</span>
          </Link>
          <Link href="/app/bonus" onClick={ir} className={classeItem(pathname === "/app/bonus")}>
            <Gift className="size-4" />
            Bônus
          </Link>
          <Link href="/app/sugestoes" onClick={ir} className={classeItem(pathname === "/app/sugestoes")}>
            <MessageSquarePlus className="size-4" />
            Sugestões
          </Link>

          <p className="mt-4 px-3 text-[10px] font-semibold tracking-[0.16em] text-white/45">ÁREAS</p>
          {areas.map((area) => {
            const ativo = pathname === "/app/mapas" && areaAtual === area.slug;
            return (
              <Link
                key={area.id}
                href={`/app/mapas?area=${area.slug}`}
                onClick={ir}
                className={classeItem(ativo)}
              >
                <AreaIcon nome={area.icone} className="size-7 rounded-lg bg-transparent text-teal-bright" iconeClassName="size-4" />
                <span className="flex-1 truncate">{area.nome}</span>
                <span className="text-xs text-white/50">{contagemDaArea(area.id)}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="shrink-0 space-y-2 px-3 pt-2 pb-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-semibold tracking-[0.14em] text-white/60">
            <span>SEU PROGRESSO</span>
            <span className="font-heading text-lg tracking-normal text-teal-bright">{percentual}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-teal-bright" style={{ width: `${percentual}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/65">
            {revisadosMapas.length} de {TOTAL_MAPAS} mapas revisados
          </p>
        </div>

        <Link
          href="/app/premium"
          onClick={ir}
          className="flex items-center gap-3 rounded-2xl bg-white/8 px-3 py-3 ring-1 ring-white/10 transition hover:bg-white/12"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-teal text-white">
            <Sparkles className="size-4" />
          </span>
          <span>
            <span className="block text-sm font-medium">Versão completa</span>
            <span className="block text-xs text-white/60">170 mapas e 5 bônus</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => {
            void sair();
            ir();
          }}
          className="flex w-full items-center gap-2 px-3 py-1 text-xs text-white/55 hover:text-white"
        >
          <LogOut className="size-3.5" />
          Sair deste aparelho
        </button>
      </div>
    </div>
  );
}
