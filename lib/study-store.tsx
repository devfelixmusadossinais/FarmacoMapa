"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CHAVES } from "@/lib/chaves";
import { ehMapa, slugsValidos } from "@/lib/catalog";
import { hojeLocal } from "@/lib/text";
import type { Perfil, Progresso } from "@/lib/types";

type Acesso =
  | { status: "carregando" }
  | { status: "anonimo" }
  | { status: "ok"; email: string };

function progressoVazio(): Progresso {
  return {
    revisados: [],
    dia: hojeLocal(),
    revisadosHoje: [],
    ultimoSlug: null,
  };
}

function lerJson(chave: string): unknown {
  try {
    const bruto = localStorage.getItem(chave);
    if (!bruto) return null;
    return JSON.parse(bruto);
  } catch {
    return null;
  }
}

function perfilValido(valor: unknown): valor is Perfil {
  if (!valor || typeof valor !== "object") return false;
  const perfil = valor as Perfil;
  return (
    typeof perfil.nome === "string" &&
    perfil.nome.trim().length >= 2 &&
    typeof perfil.areaFoco === "string" &&
    perfil.areaFoco.length > 0 &&
    (perfil.metaDiaria === 2 || perfil.metaDiaria === 3 || perfil.metaDiaria === 5)
  );
}

function apenasSlugs(valor: unknown) {
  const validos = slugsValidos();
  if (!Array.isArray(valor)) return [];
  return valor.filter((item): item is string => typeof item === "string" && validos.has(item));
}

function normalizarProgresso(valor: unknown): Progresso {
  const base = progressoVazio();
  if (!valor || typeof valor !== "object") return base;
  const progresso = valor as Partial<Progresso>;
  const validos = slugsValidos();
  const revisados = apenasSlugs(progresso.revisados);
  const mesmoDia = progresso.dia === base.dia;
  return {
    revisados,
    dia: base.dia,
    revisadosHoje: mesmoDia ? apenasSlugs(progresso.revisadosHoje).filter((slug) => revisados.includes(slug)) : [],
    ultimoSlug:
      typeof progresso.ultimoSlug === "string" && validos.has(progresso.ultimoSlug) ? progresso.ultimoSlug : null,
  };
}

type ContextoEstudo = {
  acesso: Acesso;
  hidratado: boolean;
  perfil: Perfil | null;
  progresso: Progresso;
  favoritos: string[];
  revisadosMapas: string[];
  revisadosHojeMapas: string[];
  entrar: (email: string) => Promise<string | null>;
  sair: () => Promise<void>;
  salvarPerfil: (perfil: Perfil) => void;
  alternarFavorito: (slug: string) => void;
  favorito: (slug: string) => boolean;
  alternarRevisado: (slug: string) => void;
  revisado: (slug: string) => boolean;
  registrarAbertura: (slug: string) => void;
  limparEstudo: () => void;
};

const Contexto = createContext<ContextoEstudo | null>(null);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [acesso, setAcesso] = useState<Acesso>({ status: "carregando" });
  const [hidratado, setHidratado] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [progresso, setProgresso] = useState<Progresso>(progressoVazio);
  const [favoritos, setFavoritos] = useState<string[]>([]);

  useEffect(() => {
    const salvo = lerJson(CHAVES.perfil);
    setPerfil(perfilValido(salvo) ? { ...salvo, nome: salvo.nome.trim() } : null);
    setProgresso(normalizarProgresso(lerJson(CHAVES.progresso)));
    setFavoritos(apenasSlugs(lerJson(CHAVES.favoritos)));
    setHidratado(true);

    fetch("/api/acesso")
      .then((resposta) => resposta.json())
      .then((dados: { autenticado?: boolean; email?: string }) => {
        if (dados.autenticado && dados.email) setAcesso({ status: "ok", email: dados.email });
        else setAcesso({ status: "anonimo" });
      })
      .catch(() => setAcesso({ status: "anonimo" }));
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    if (perfil) localStorage.setItem(CHAVES.perfil, JSON.stringify(perfil));
    else localStorage.removeItem(CHAVES.perfil);
  }, [perfil, hidratado]);

  useEffect(() => {
    if (!hidratado) return;
    localStorage.setItem(CHAVES.progresso, JSON.stringify(progresso));
  }, [progresso, hidratado]);

  useEffect(() => {
    if (!hidratado) return;
    localStorage.setItem(CHAVES.favoritos, JSON.stringify(favoritos));
  }, [favoritos, hidratado]);

  const revisadosMapas = useMemo(
    () => progresso.revisados.filter((slug) => ehMapa(slug)),
    [progresso.revisados],
  );
  const revisadosHojeMapas = useMemo(
    () => progresso.revisadosHoje.filter((slug) => ehMapa(slug)),
    [progresso.revisadosHoje],
  );

  const valor = useMemo<ContextoEstudo>(() => {
    return {
      acesso,
      hidratado,
      perfil,
      progresso,
      favoritos,
      revisadosMapas,
      revisadosHojeMapas,
      async entrar(email: string) {
        try {
          const resposta = await fetch("/api/acesso", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const dados = (await resposta.json().catch(() => ({}))) as { erro?: string; email?: string };
          if (!resposta.ok) return dados.erro || "Não foi possível liberar o acesso.";
          setAcesso({ status: "ok", email: dados.email || email.trim().toLowerCase() });
          return null;
        } catch {
          return "Sem conexão para validar o e-mail. Tente de novo.";
        }
      },
      async sair() {
        await fetch("/api/acesso", { method: "DELETE" }).catch(() => undefined);
        setAcesso({ status: "anonimo" });
      },
      salvarPerfil(novo: Perfil) {
        setPerfil({
          nome: novo.nome.trim(),
          areaFoco: novo.areaFoco,
          metaDiaria: novo.metaDiaria,
        });
      },
      alternarFavorito(slug: string) {
        setFavoritos((atual) =>
          atual.includes(slug) ? atual.filter((item) => item !== slug) : [...atual, slug],
        );
      },
      favorito(slug: string) {
        return favoritos.includes(slug);
      },
      alternarRevisado(slug: string) {
        setProgresso((atual) => {
          const dia = hojeLocal();
          const base = atual.dia === dia ? atual : { ...atual, dia, revisadosHoje: [] };
          if (base.revisados.includes(slug)) {
            return {
              ...base,
              revisados: base.revisados.filter((item) => item !== slug),
              revisadosHoje: base.revisadosHoje.filter((item) => item !== slug),
            };
          }
          return {
            ...base,
            revisados: [...base.revisados, slug],
            revisadosHoje: base.revisadosHoje.includes(slug) ? base.revisadosHoje : [...base.revisadosHoje, slug],
          };
        });
      },
      revisado(slug: string) {
        return progresso.revisados.includes(slug);
      },
      registrarAbertura(slug: string) {
        setProgresso((atual) => {
          const dia = hojeLocal();
          const base = atual.dia === dia ? atual : { ...atual, dia, revisadosHoje: [] };
          if (base.ultimoSlug === slug) return base;
          return { ...base, ultimoSlug: slug };
        });
      },
      limparEstudo() {
        setProgresso(progressoVazio());
        setFavoritos([]);
      },
    };
  }, [acesso, hidratado, perfil, progresso, favoritos, revisadosMapas, revisadosHojeMapas]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useStudy() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useStudy precisa estar dentro de StudyProvider.");
  return contexto;
}
