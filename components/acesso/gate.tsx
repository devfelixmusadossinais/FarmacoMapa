"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/logo";
import { useStudy } from "@/lib/study-store";

export function Gate() {
  const { entrar } = useStudy();
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function liberar(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);
    const mensagem = await entrar(email);
    setEnviando(false);
    if (mensagem) setErro(mensagem);
  }

  return (
    <div className="min-h-dvh bg-pine text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 py-10">
        <div className="flex flex-col items-center text-center">
          <Logo className="size-16 text-teal" titulo />
          <p className="mt-5 text-[11px] font-semibold tracking-[0.18em] text-teal-bright">MAPA MENTAL BIOANÁLISE</p>
          <h1 className="mt-4 font-heading text-[2.6rem] leading-[1.05]">Seus mapas estão aqui</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">
            Digite o e-mail da compra para liberar o estudo neste aparelho. As imagens dos mapas só saem depois disso.
          </p>
        </div>

        <form onSubmit={liberar} className="mt-8 rounded-[28px] bg-white p-5 text-ink shadow-2xl">
          <Label htmlFor="email-compra" className="font-heading text-2xl">
            E-mail da compra
          </Label>
          <p className="mt-1 text-sm text-ink/60">O mesmo e-mail da Hotmart ou da Kiwify.</p>
          <Input
            id="email-compra"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            placeholder="voce@email.com"
            className="mt-4 h-12 rounded-2xl bg-foam/70 px-4 text-base"
            aria-invalid={erro ? true : undefined}
          />
          {erro ? (
            <p role="alert" className="mt-3 text-sm text-clay">
              {erro}
            </p>
          ) : null}
          <Button type="submit" disabled={enviando} className="mt-4 h-12 w-full rounded-2xl text-base">
            {enviando ? "Conferindo…" : "Liberar acesso"}
          </Button>
          {process.env.NODE_ENV !== "production" ? (
            <button
              type="button"
              className="mt-3 w-full text-center text-sm text-teal underline-offset-2 hover:underline"
              onClick={() => setEmail("estudante@exemplo.com")}
            >
              Preencher e-mail de demonstração
            </button>
          ) : null}
        </form>
        <p className="mt-4 text-center text-xs leading-relaxed text-white/55">
          O acesso e o progresso ficam neste navegador. Trocar de aparelho pede o e-mail de novo.
        </p>
      </div>
    </div>
  );
}
