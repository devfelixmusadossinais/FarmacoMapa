import { normalizar, planoDoEmail } from "@/lib/acesso-store";
import { apagarSessao, gravarSessao, lerSessao } from "@/lib/sessao";

export async function GET() {
  const sessao = await lerSessao();
  if (!sessao) return Response.json({ autenticado: false, plano: null }, { headers: { "Cache-Control": "private, no-store" } });
  const plano = await planoDoEmail(sessao.email);
  return Response.json({ autenticado: plano !== null, email: sessao.email, plano }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(requisicao: Request) {
  const corpo = (await requisicao.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof corpo?.email === "string" ? normalizar(corpo.email) : "";
  if (!email.includes("@") || email.length > 180) {
    return Response.json({ erro: "Informe um e-mail válido." }, { status: 400 });
  }
  const plano = await planoDoEmail(email);
  if (!plano) {
    return Response.json(
      { plano: null, erro: "Não encontramos uma compra com este e-mail. Confira se é o mesmo e-mail que você usou na compra." },
      { status: 401 },
    );
  }
  await gravarSessao(email);
  return Response.json({ autenticado: true, email, plano });
}

export async function DELETE() {
  await apagarSessao();
  return Response.json({ autenticado: false });
}
