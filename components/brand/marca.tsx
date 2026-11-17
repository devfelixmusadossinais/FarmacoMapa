import { cn } from "cn";
import { Logo } from "@/components/brand/logo";

export function Marca({ tom = "claro", className }: { tom?: "claro" | "escuro"; className?: string }) {
  const claro = tom === "claro";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Logo className={claro ? "text-teal" : "text-teal"} />
      <div className="min-w-0">
        <p className={cn("font-heading text-[1.35rem] leading-none", claro ? "text-white" : "text-ink")}>
          Mapa Mental
        </p>
        <p
          className={cn(
            "mt-1 text-[10px] font-semibold tracking-[0.18em]",
            claro ? "text-teal-bright" : "text-teal",
          )}
        >
          DE BIOANÁLISE
        </p>
      </div>
    </div>
  );
}
