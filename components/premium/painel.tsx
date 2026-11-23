"use client";

import { BotaoUpgrade } from "@/components/plano/convite-upgrade";
import { SeloPlano } from "@/components/plano/selo";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCatalogo } from "@/lib/catalogo-cliente";
import { useStudy } from "@/lib/study-store";



export function PainelPremium() {
  const { TOTAL_AREAS, TOTAL_BONUS, TOTAL_MAPAS } = useCatalogo();
  const inclusos = [
  `${TOTAL_MAPAS} vagas de mapas nas ${TOTAL_AREAS} áreas`,
  `${TOTAL_BONUS} bônus fora da grade principal`,
  "Meta diária de 2, 3 ou 5 mapas",
  "Favoritos e revisados neste navegador",
  "Zoom de 100% a 300% e leitura em tela cheia",
];
  const { plano, acesso, sair, limparEstudo, revisadosMapas, favoritos } = useStudy();
  const [confirmar, setConfirmar] = useState(false);
  const email = acesso.status === "ok" ? acesso.email : "";

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-[28px] bg-pine px-5 py-6 text-white sm:px-8">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-teal-bright">VERSÃO COMPLETA</p>
        <h1 className="mt-3 font-heading text-4xl leading-tight sm:text-5xl">O estudo inteiro, no e-mail da compra</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
          A compra acontece fora daqui, na Cakto. Este app só libera quem já está na lista e guarda o progresso no próprio aparelho.
        </p>
        <div className="mt-4"><SeloPlano /></div>
        {plano === "premium" ? <p className="mt-3 text-sm text-white/75">Premium ativo: 170 mapas + 5 bônus.</p> : <div className="mt-3 text-sm text-white/75"><p>Básico: 80 mapas, sem bônus.</p><p>Premium: 170 mapas + 5 bônus.</p><BotaoUpgrade /></div>}
        <ul className="mt-6 space-y-3">
          {inclusos.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-white/10 text-teal-bright">
                <Check className="size-3" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <aside className="space-y-4">
        <section className="rounded-[24px] bg-white p-5 ring-1 ring-black/5">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-teal">NESTE APARELHO</p>
          <p className="mt-2 font-heading text-2xl text-ink">{email}</p>
          <p className="mt-2 text-sm text-ink/65">
            {revisadosMapas.length} mapas revisados · {favoritos.length} favoritos
          </p>
          <Button type="button" variant="outline" className="mt-4 h-11 w-full rounded-2xl" onClick={() => void sair()}>
            Sair e usar outro e-mail
          </Button>
        </section>

        <section className="rounded-[24px] bg-white p-5 ring-1 ring-black/5">
          <h2 className="font-heading text-2xl text-ink">Imagens protegidas</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/65">
            Os arquivos ficam fora da pasta pública. A rota de imagem só responde com o cookie de acesso. Sem compra reconhecida, a URL devolve 401.
          </p>
          <Button type="button" variant="outline" className="mt-4 h-11 rounded-2xl" onClick={() => setConfirmar(true)}>
            Apagar progresso deste aparelho
          </Button>
        </section>
      </aside>

      <Dialog open={confirmar} onOpenChange={setConfirmar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Apagar o estudo daqui?</DialogTitle>
            <DialogDescription>
              Some favoritos, revisados e a meta do dia neste navegador. O e-mail de acesso continua liberado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="bg-transparent">
            <Button type="button" variant="outline" onClick={() => setConfirmar(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-clay text-white hover:bg-clay/90"
              onClick={() => {
                limparEstudo();
                setConfirmar(false);
              }}
            >
              Apagar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
