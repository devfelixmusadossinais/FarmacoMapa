"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heart, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listarAreas } from "@/lib/catalog";
import { primeiroNome } from "@/lib/text";
import { useStudy } from "@/lib/study-store";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { perfil, favoritos } = useStudy();
  const [consulta, setConsulta] = useState(params.get("q") ?? "");
  const area = params.get("area") ?? "";
  const areas = listarAreas();

  useEffect(() => {
    setConsulta(params.get("q") ?? "");
  }, [params]);

  function irParaBusca(texto: string, areaSlug = area) {
    const busca = new URLSearchParams();
    if (areaSlug) busca.set("area", areaSlug);
    if (texto.trim()) busca.set("q", texto.trim());
    const query = busca.toString();
    router.push(query ? `/app/mapas?${query}` : "/app/mapas");
  }

  const inicial = primeiroNome(perfil?.nome ?? "E").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-paper/90 backdrop-blur">
      <div className="flex items-center gap-2 px-3 py-3 lg:px-6">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 rounded-2xl bg-white lg:hidden"
          onClick={onMenu}
          aria-label="Abrir menu"
        >
          <Menu />
        </Button>

        <form
          className="relative min-w-0 flex-1"
          onSubmit={(evento) => {
            evento.preventDefault();
            irParaBusca(consulta);
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink/40" />
          <label htmlFor="busca-global" className="sr-only">
            Buscar mapas, temas ou conceitos
          </label>
          <input
            id="busca-global"
            value={consulta}
            onChange={(evento) => setConsulta(evento.target.value)}
            placeholder="Buscar mapas, temas ou conceitos"
            className="h-11 w-full rounded-2xl border border-border bg-white pr-3 pl-10 text-sm outline-none focus-visible:border-teal focus-visible:ring-3 focus-visible:ring-teal/30"
          />
        </form>

        <label className="sr-only" htmlFor="filtro-area">
          Filtrar por área
        </label>
        <select
          id="filtro-area"
          value={pathname.startsWith("/app/mapas") ? area : ""}
          onChange={(evento) => irParaBusca(consulta, evento.target.value)}
          className="hidden h-11 max-w-48 rounded-2xl border border-border bg-white px-3 text-sm lg:block"
        >
          <option value="">Todos</option>
          {areas.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.nome}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative size-11 rounded-2xl bg-white"
          aria-label="Favoritos"
          onClick={() => router.push("/app/favoritos")}
        >
          <Heart className={pathname === "/app/favoritos" ? "fill-clay text-clay" : ""} />
          {favoritos.length > 0 ? (
            <span className="absolute -top-1 -right-1 inline-flex min-w-5 items-center justify-center rounded-full bg-pine px-1 text-[10px] text-white">
              {favoritos.length}
            </span>
          ) : null}
        </Button>

        <span
          className="hidden size-11 items-center justify-center rounded-full bg-pine font-heading text-lg text-white lg:inline-flex"
          aria-hidden
        >
          {inicial}
        </span>
      </div>
    </header>
  );
}
