import { adicionarEmail, removerEmail } from "@/lib/acesso-store";
import { segredoConfere } from "@/lib/sessao";

type Acao = "liberar" | "revogar" | "ignorar";

function emailDe(valor: unknown) {
  if (!valor || typeof valor !== "object") return null;
  const email = (valor as { email?: unknown }).email;
  return typeof email === "string" && email.includes("@") ? email : null;
}

function lerHotmart(corpo: Record<string, unknown>): { acao: Acao; email: string; evento: string } | null {
  const evento = typeof corpo.event === "string" ? corpo.event : "";
  const data =
    corpo.data && typeof corpo.data === "object" ? (corpo.data as Record<string, unknown>) : {};
  const compra =
    data.purchase && typeof data.purchase === "object" ? (data.purchase as Record<string, unknown>) : {};
  const email = emailDe(data.buyer) ?? emailDe(compra.buyer) ?? emailDe(data);
  if (!email) return null;
  if (evento === "PURCHASE_APPROVED" || evento === "PURCHASE_COMPLETE") {
    return { acao: "liberar", email, evento };
  }
  if (
    evento === "PURCHASE_REFUNDED" ||
    evento === "PURCHASE_CANCELED" ||
    evento === "PURCHASE_CHARGEBACK" ||
    evento === "PURCHASE_PROTEST"
  ) {
    return { acao: "revogar", email, evento };
  }
  return { acao: "ignorar", email, evento: evento || "desconhecido" };
}

function lerKiwify(corpo: Record<string, unknown>): { acao: Acao; email: string; evento: string } | null {
  const evento = String(corpo.order_status ?? corpo.orderStatus ?? "").toLowerCase();
  const email = emailDe(corpo.Customer) ?? emailDe(corpo.customer) ?? emailDe(corpo);
  if (!email) return null;
  if (evento === "paid" || evento === "approved") return { acao: "liberar", email, evento };
  if (evento === "refunded" || evento === "chargedback" || evento === "canceled" || evento === "cancelled") {
    return { acao: "revogar", email, evento };
  }
  return { acao: "ignorar", email, evento: evento || "desconhecido" };
}

export async function processarWebhook(requisicao: Request, origem: "hotmart" | "kiwify") {
  const checagem = segredoConfere(requisicao.headers.get("x-webhook-token"));
  if (checagem === "sem-config") {
    return Response.json(
      { erro: "WEBHOOK_SECRET não configurado. O webhook fica desligado até o segredo existir." },
      { status: 501 },
    );
  }
  if (checagem === "invalido") {
    return Response.json({ erro: "Token inválido." }, { status: 401 });
  }

  const corpo = (await requisicao.json().catch(() => null)) as Record<string, unknown> | null;
  if (!corpo) return Response.json({ erro: "JSON inválido." }, { status: 400 });

  const extraido = origem === "hotmart" ? lerHotmart(corpo) : lerKiwify(corpo);
  if (!extraido) {
    return Response.json({ erro: "Não achei o e-mail do comprador nesse payload." }, { status: 422 });
  }
  if (extraido.acao === "ignorar") {
    return Response.json({ recebido: true, ignorado: true, evento: extraido.evento });
  }

  try {
    const email =
      extraido.acao === "revogar"
        ? await removerEmail(extraido.email, origem)
        : await adicionarEmail(extraido.email, origem);
    return Response.json({
      recebido: true,
      email,
      acao: extraido.acao,
      persistido: true,
      loja: "acessos",
      aviso:
        "Gravado na loja de acessos (Netlify Blobs). A revogação não mexe na allowlist versionada nem na variável de ambiente.",
    });
  } catch {
    return Response.json(
      {
        recebido: true,
        email: extraido.email,
        persistido: false,
        erro: "Não foi possível gravar a lista neste ambiente. Conecte uma loja durável.",
      },
      { status: 501 },
    );
  }
}
