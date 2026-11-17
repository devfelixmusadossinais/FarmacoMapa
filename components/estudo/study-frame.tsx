"use client";

import { Gate } from "@/components/acesso/gate";
import { Onboarding } from "@/components/home/onboarding";
import { AppShell } from "@/components/shell/app-shell";
import { Logo } from "@/components/brand/logo";
import { useStudy } from "@/lib/study-store";

function Abrindo() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper text-ink">
      <Logo className="size-14 text-teal" />
      <p className="text-sm text-ink/60">Abrindo seus mapas…</p>
    </div>
  );
}

export function StudyFrame({ children }: { children: React.ReactNode }) {
  const { acesso, hidratado, perfil } = useStudy();

  if (!hidratado || acesso.status === "carregando") return <Abrindo />;
  if (acesso.status === "anonimo") return <Gate />;
  if (!perfil) return <Onboarding />;
  return <AppShell>{children}</AppShell>;
}
