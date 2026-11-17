import { emailAutorizado } from "@/lib/acesso-store";
import { apagarSessao, gravarSessao, lerSessao } from "@/lib/sessao";

export async function GET() {
  const sessao = await lerSessao();
  if (!sessao) return Response.json({ autenticado: false });
  return Response.json({ autenticado: true, email: sessao.email });
}

export async function POST(requisicao: Request) {
  const corpo = (await requisicao.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof corpo?.email === "string" ? corpo.email.trim().toLowerCase() : "";
  if (!email.includes("@") || email.length > 180) {
    return Response.json({ erro: "Informe um e-mail válido." }, { status: 400 });
  }
  if (!(await emailAutorizado(email))) {
    return Response.json(
      { erro: "Não encontramos uma compra com este e-mail. Confira se é o mesmo e-mail que você usou na compra." },
      { status: 401 },
    );
  }
  await gravarSessao(email);
  return Response.json({ autenticado: true, email });
}

export async function DELETE() {
  await apagarSessao();
  return Response.json({ autenticado: false });
}
