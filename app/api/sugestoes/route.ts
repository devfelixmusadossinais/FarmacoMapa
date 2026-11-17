export async function POST(requisicao: Request) {
  const corpo = (await requisicao.json().catch(() => null)) as { mensagem?: unknown } | null;
  if (!corpo || typeof corpo.mensagem !== "string" || corpo.mensagem.trim().length < 10) {
    return Response.json({ erro: "Mensagem curta demais." }, { status: 400 });
  }
  return Response.json({
    recebida: true,
    persistida: false,
    aviso: "A sugestão fica no navegador (mmb:sugestoes). Ligue um destino externo quando quiser receber de verdade.",
  });
}
