import type { Metadata } from "next";
import { PainelPremium } from "@/components/premium/painel";

export const metadata: Metadata = { title: "Versão completa" };

export default function PaginaPremium() {
  return <PainelPremium />;
}
