import { cn } from "cn";

export function Logo({ className, titulo = false }: { className?: string; titulo?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden={titulo ? undefined : true}
      role={titulo ? "img" : undefined}
      className={cn("size-11 shrink-0", className)}
    >
      {titulo ? <title>Mapa Mental Bioanálise</title> : null}
      <rect width="48" height="48" rx="14" fill="currentColor" />
      <circle cx="24" cy="17.5" r="4.2" fill="white" />
      <circle cx="12.5" cy="33" r="3.1" fill="white" />
      <circle cx="35.5" cy="33" r="3.1" fill="white" />
      <path
        d="M24 21.6 13.4 30.2M24 21.6 34.6 30.2"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
