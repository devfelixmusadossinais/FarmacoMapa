"use client";

import { CartaoMapa } from "@/components/mapas/cartao-mapa";
import { listarBonus } from "@/lib/catalog";

export function PainelBonus() {
  const bonus = listarBonus();

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.16em] text-teal">FORA DAS 14 ÁREAS</p>
      <h1 className="mt-2 font-heading text-4xl text-ink sm:text-5xl">Bônus</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/65">
        Os 5 bônus exclusivos do Premium. Toque em um bônus para ver os detalhes.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {bonus.map((item) => (
          <CartaoMapa key={item.slug} item={{ ...item, tipo: "bonus" }} />
        ))}
      </div>
    </div>
  );
}
