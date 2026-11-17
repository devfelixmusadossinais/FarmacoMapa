import { cn } from "cn";
import { AreaIcon } from "@/components/brand/area-icon";
import { areaPorId } from "@/lib/catalog";
import type { ItemCatalogo } from "@/lib/types";

export function QuadroMapa({
  item,
  className,
  zoomavel = false,
}: {
  item: ItemCatalogo;
  className?: string;
  zoomavel?: boolean;
}) {
  const area = areaPorId(item.area);

  if (item.image) {
    return (
      <div className={cn("relative overflow-hidden bg-white", zoomavel ? "min-h-48" : "aspect-[16/10]", className)}>
        {/* A imagem só existe depois do cookie de acesso. Sem ele a rota responde 401. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/mapas/${item.slug}/imagem`}
          alt={zoomavel ? item.titulo : ""}
          className="block h-auto w-full object-contain"
        />
      </div>
    );
  }

  if (item.capa) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-[#14312d]",
          zoomavel ? "min-h-[320px] py-6" : "aspect-[16/10] py-3",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.capa}
          alt={zoomavel ? `Capa: ${item.titulo}` : ""}
          className={cn("block w-auto object-contain drop-shadow-xl", zoomavel ? "max-h-[70vh]" : "h-full")}
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[#e7f3ef]",
        zoomavel ? "flex min-h-[280px] items-center" : "aspect-[16/10]",
        className,
      )}
    >
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id={`grade-${item.slug}`} width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1.2" cy="1.2" r="1.1" fill="#1f6f68" opacity="0.28" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grade-${item.slug})`} />
      </svg>
      <div className="relative flex h-full w-full flex-col justify-between p-4">
        <AreaIcon
          nome={area?.icone}
          className="bg-white text-teal shadow-sm"
          iconeClassName="text-teal"
        />
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-teal">EM PREPARAÇÃO</p>
          <p className="mt-1 font-heading text-2xl leading-none text-pine">{area?.nome ?? "Bônus"}</p>
          {zoomavel ? (
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink/70">
              A imagem entra aqui quando o arquivo for publicado. Até lá, o zoom e a tela cheia mostram esta vaga.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
