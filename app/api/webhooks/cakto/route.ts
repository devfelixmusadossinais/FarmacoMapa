import { createHmac, timingSafeEqual } from "node:crypto";
import { mascarar, registrarPedido, type StatusPedido } from "@/lib/acesso-store";

/**
 * Webhook da Cakto (docs.cakto.com.br/conceitos/webhooks).
 * Corpo: { secret, event, data }. `data` é objeto (webhook v1) ou lista (v2).
 * Origem: assinatura X-Cakto-Signature (HMAC-SHA256 de "{timestamp}.{corpo}")
 * ou, se não vier header, o campo `secret` do corpo. Os dois usam CAKTO_WEBHOOK_SECRET.
 */

const TOLERANCIA_S = 5 * 60;

function iguais(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function assinaturaConfere(segredo: string, bruto: string, ts: string | null, assinatura: string | null) {
  if (!ts || !assinatura) return null;
  if (!/^\d+$/.test(ts) || Math.abs(Date.now() / 1000 - Number(ts)) > TOLERANCIA_S) return false;
  const esperado = `v1=${createHmac("sha256", segredo).update(`${ts}.`).update(bruto).digest("hex")}`;
  return assinatura.split(",").map((s) => s.trim()).some((s) => iguais(s, esperado));
}

const STATUS_POR_EVENTO: Record<string, StatusPedido> = {
  purchase_approved: "pago",
  refund: "reembolsado",
  chargeback: "chargeback",
};

export async function POST(requisicao: Request) {
  const segredo = process.env.CAKTO_WEBHOOK_SECRET;
  if (!segredo) {
    console.error("[cakto] CAKTO_WEBHOOK_SECRET não configurado.");
    return Response.json({ erro: "Webhook desligado: falta CAKTO_WEBHOOK_SECRET." }, { status: 501 });
  }

  const bruto = await requisicao.text();
  let corpo: { secret?: unknown; event?: unknown; data?: unknown } | null = null;
  try {
    corpo = JSON.parse(bruto);
  } catch {
    return Response.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const porHeader = assinaturaConfere(
    segredo,
    bruto,
    requisicao.headers.get("x-cakto-timestamp"),
    requisicao.headers.get("x-cakto-signature"),
  );
  const porCorpo = typeof corpo?.secret === "string" && iguais(corpo.secret, segredo);
  if (!(porHeader === true || porCorpo)) {
    console.warn("[cakto] entrega rejeitada: segredo/assinatura não confere.");
    return Response.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const evento = typeof corpo?.event === "string" ? corpo.event : "";
  const status = STATUS_POR_EVENTO[evento];
  if (!status) {
    console.log(`[cakto] evento ignorado: ${evento || "desconhecido"}`);
    return Response.json({ recebido: true, ignorado: true, evento });
  }

  const pedidos = (Array.isArray(corpo?.data) ? corpo.data : [corpo?.data]).filter(
    (p): p is Record<string, unknown> => !!p && typeof p === "object",
  );
  const resultados = [];
  for (const pedido of pedidos) {
    const cliente = pedido.customer as { email?: unknown } | undefined;
    const email = typeof cliente?.email === "string" ? cliente.email : "";
    const pedidoId = typeof pedido.id === "string" && pedido.id ? pedido.id : String(pedido.refId ?? "sem-id");
    if (!email.includes("@")) {
      console.warn(`[cakto] ${evento} pedido ${pedidoId} sem e-mail do comprador.`);
      continue;
    }
    try {
      const r = await registrarPedido({ email, pedidoId: `cakto:${pedidoId}`, status, origem: "cakto", evento });
      console.log(`[cakto] ${evento} pedido ${pedidoId} ${mascarar(email)} -> acesso=${r.autorizado} (${r.loja})`);
      resultados.push({ pedido: pedidoId, acesso: r.autorizado, mudou: r.mudou });
    } catch (erro) {
      console.error(`[cakto] falha ao gravar pedido ${pedidoId}:`, erro instanceof Error ? erro.message : "erro");
      return Response.json({ erro: "Falha ao gravar. Reenvie o evento pela Cakto." }, { status: 500 });
    }
  }
  return Response.json({ recebido: true, evento, resultados });
}