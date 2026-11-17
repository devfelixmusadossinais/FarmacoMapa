import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-teal">MAPA MENTAL BIOANÁLISE</p>
      <h1 className="mt-3 font-heading text-4xl text-ink">Essa página não existe</h1>
      <p className="mt-2 max-w-sm text-sm text-ink/65">O endereço não corresponde a um mapa, uma área ou uma tela do estudo.</p>
      <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-2xl bg-teal px-5 text-sm font-medium text-white">
        Voltar ao início
      </Link>
    </div>
  );
}
