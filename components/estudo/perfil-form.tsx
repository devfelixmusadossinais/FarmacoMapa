"use client";

import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCatalogo } from "@/lib/catalogo-cliente";
import type { MetaDiaria, Perfil } from "@/lib/types";

const metas: { valor: MetaDiaria; nome: string; detalhe: string }[] = [
  { valor: 2, nome: "2", detalhe: "leve" },
  { valor: 3, nome: "3", detalhe: "constante" },
  { valor: 5, nome: "5", detalhe: "intenso" },
];

export function PerfilForm({
  inicial,
  onSubmit,
  rotuloBotao,
}: {
  inicial?: Partial<Perfil>;
  onSubmit: (perfil: Perfil) => void;
  rotuloBotao: string;
}) {
  const { listarAreas } = useCatalogo();
  const areas = listarAreas();
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [areaFoco, setAreaFoco] = useState(inicial?.areaFoco ?? "");
  const [metaDiaria, setMetaDiaria] = useState<MetaDiaria | null>(inicial?.metaDiaria ?? null);

  const pronto = nome.trim().length >= 2 && areaFoco.length > 0 && metaDiaria !== null;

  return (
    <form
      className="space-y-7"
      onSubmit={(evento) => {
        evento.preventDefault();
        if (!pronto || metaDiaria === null) return;
        onSubmit({ nome: nome.trim(), areaFoco, metaDiaria });
      }}
    >
      <section>
        <p className="font-heading text-lg text-teal">01</p>
        <Label htmlFor="nome" className="mt-1 block font-heading text-2xl text-ink">
          Como podemos te chamar?
        </Label>
        <Input
          id="nome"
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          placeholder="Seu nome"
          autoComplete="name"
          maxLength={48}
          className="mt-3 h-12 rounded-2xl bg-foam/60 px-4 text-base"
        />
      </section>

      <section>
        <p className="font-heading text-lg text-teal">02</p>
        <p className="mt-1 font-heading text-2xl text-ink">Por onde você quer começar?</p>
        <p className="mt-1 text-sm leading-relaxed text-ink/65">
          Deixamos essa área em destaque na página inicial. Dá para trocar quando quiser.
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Área de foco">
          {areas.map((area) => {
            const ativo = areaFoco === area.id;
            return (
              <button
                key={area.id}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => setAreaFoco(area.id)}
                className={cn(
                  "rounded-full border px-3 py-2 text-sm transition",
                  ativo ? "border-pine bg-pine text-white" : "border-border bg-white text-ink hover:border-teal/40",
                )}
              >
                {area.nome}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p className="font-heading text-lg text-teal">03</p>
        <p className="mt-1 font-heading text-2xl text-ink">Quantos mapas por dia?</p>
        <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Meta diária">
          {metas.map((meta) => {
            const ativo = metaDiaria === meta.valor;
            return (
              <button
                key={meta.valor}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => setMetaDiaria(meta.valor)}
                className={cn(
                  "rounded-2xl border px-2 py-3 text-center transition",
                  ativo ? "border-pine bg-pine text-white" : "border-border bg-white text-ink hover:border-teal/40",
                )}
              >
                <span className="block font-heading text-3xl leading-none">{meta.nome}</span>
                <span className={cn("mt-1 block text-xs", ativo ? "text-white/75" : "text-ink/55")}>{meta.detalhe}</span>
              </button>
            );
          })}
        </div>
      </section>

      <Button type="submit" disabled={!pronto} className="h-12 w-full rounded-2xl text-base">
        {rotuloBotao}
      </Button>
    </form>
  );
}
