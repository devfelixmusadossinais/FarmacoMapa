import type { Metadata } from "next";
import { Dashboard } from "@/components/home/dashboard";

export const metadata: Metadata = {
  title: "Início",
};

export default function PaginaInicio() {
  return <Dashboard />;
}
