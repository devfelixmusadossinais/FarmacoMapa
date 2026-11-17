import type { Metadata } from "next";
import { PainelBonus } from "@/components/bonus/painel";

export const metadata: Metadata = { title: "Bônus" };

export default function PaginaBonus() {
  return <PainelBonus />;
}
