"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartaoMapa } from "@/components/mapas/cartao-mapa";
import { obterItem } from "@/lib/catalog";
import { useStudy } from "@/lib/study-store";

export function PainelFavoritos() {
  const { favoritos } = useStudy();
  const itens = favoritos.map((slug) => obterItem(slug)).filter((item) => item !== undefined);

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.16em] text-teal">PARA REVER DEPOIS</p>
      <h1 className="mt-2 font-heading text-4xl text-ink sm:text-5xl">Favoritos</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/65">
        O coração no mapa guarda o item neste navegador. Não sincroniza com a compra.
      </p>

      {itens.length === 0 ? (
        <div className="mt-6 rounded-[24px] bg-white px-5 py-12 text-center ring-1 ring-black/5">
          <span className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl bg-foam text-teal">
            <Heart />
          </span>
          <h2 className="mt-4 font-heading text-3xl">Nenhum mapa guardado</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/65">
            Abra um mapa e toque em Favoritar. A lista fica vazia até você escolher o primeiro.
          </p>
          <Button asChild className="mt-5 h-11 rounded-2xl">
            <Link href="/mapas">Ver os mapas</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {itens.map((item) => (
            <CartaoMapa key={item.slug} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
