"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CHAVES } from "@/lib/chaves";
import { listarAreas } from "@/lib/catalog";
import type { Sugestao } from "@/lib/types";

function lerSugestoes(): Sugestao[] {
  try {
    const bruto = localStorage.getItem(CHAVES.sugestoes);
    if (!bruto) return [];
    const dados = JSON.parse(bruto) as unknown;
    return Array.isArray(dados) ? (dados as Sugestao[]) : [];
  } catch {
    return [];
  }
}

export function FormularioSugestao() {
  const areas = listarAreas();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviada, setEnviada] = useState(false);
  const [anteriores, setAnteriores] = useState<Sugestao[]>([]);

  useEffect(() => {
    setAnteriores(lerSugestoes());
  }, []);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    if (nome.trim().length < 2) return setErro("Diz como podemos te chamar.");
    if (!email.includes("@")) return setErro("O e-mail parece incompleto.");
    if (!area) return setErro("Escolha a área do tema.");
    if (mensagem.trim().length < 10) return setErro("Conta o tema em pelo menos uma frase.");

    const sugestao: Sugestao = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      email: email.trim(),
      area,
      mensagem: mensagem.trim(),
      criadaEm: new Date().toISOString(),
    };

    await fetch("/api/sugestoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sugestao),
    }).catch(() => undefined);

    const proximas = [sugestao, ...lerSugestoes()].slice(0, 12);
    localStorage.setItem(CHAVES.sugestoes, JSON.stringify(proximas));
    setAnteriores(proximas);
    setEnviada(true);
  }

  if (enviada) {
    return (
      <div className="rounded-[24px] bg-white p-6 ring-1 ring-black/5">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-teal">RECEBEMOS</p>
        <h2 className="mt-2 font-heading text-3xl text-ink">Sugestão guardada neste aparelho</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/65">
          Ainda não há uma caixa de entrada no servidor. O pedido fica em {CHAVES.sugestoes} até o envio externo ser ligado.
        </p>
        <Button type="button" className="mt-5 h-11 rounded-2xl" onClick={() => setEnviada(false)}>
          Enviar outra
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={enviar} className="space-y-4 rounded-[24px] bg-white p-5 ring-1 ring-black/5">
        <div>
          <Label htmlFor="sugestao-nome">Nome</Label>
          <Input id="sugestao-nome" value={nome} onChange={(evento) => setNome(evento.target.value)} className="mt-1.5 h-11 rounded-xl px-3" />
        </div>
        <div>
          <Label htmlFor="sugestao-email">E-mail</Label>
          <Input id="sugestao-email" type="email" value={email} onChange={(evento) => setEmail(evento.target.value)} className="mt-1.5 h-11 rounded-xl px-3" />
        </div>
        <div>
          <Label>Área</Label>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger className="mt-1.5 h-11 w-full rounded-xl">
              <SelectValue placeholder="Escolha uma área" />
            </SelectTrigger>
            <SelectContent>
              {areas.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="sugestao-mensagem">Qual mapa faria diferença na revisão?</Label>
          <Textarea
            id="sugestao-mensagem"
            value={mensagem}
            onChange={(evento) => setMensagem(evento.target.value)}
            className="mt-1.5 min-h-28 rounded-xl px-3 py-2"
            placeholder="Ex.: um mapa só com a ordem dos tubos e o que cada aditivo preserva."
          />
        </div>
        {erro ? (
          <p role="alert" className="text-sm text-clay">
            {erro}
          </p>
        ) : null}
        <Button type="submit" className="h-11 rounded-2xl">
          Enviar sugestão
        </Button>
      </form>

      {anteriores.length > 0 ? (
        <section>
          <h2 className="font-heading text-2xl text-ink">Neste aparelho</h2>
          <ul className="mt-3 space-y-2">
            {anteriores.slice(0, 3).map((item) => (
              <li key={item.id} className="rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-black/5">
                <p className="font-medium text-ink">{areas.find((areaItem) => areaItem.id === item.area)?.nome}</p>
                <p className="mt-1 text-ink/70">{item.mensagem}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
