import type { Metadata } from "next";
import { PainelFavoritos } from "@/components/favoritos/painel";

export const metadata: Metadata = { title: "Favoritos" };

export default function PaginaFavoritos() {
  return <PainelFavoritos />;
}
