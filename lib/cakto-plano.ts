import type { Plano } from "./plano";

export const PRODUTO_PREMIUM = "93beac58-83e0-4d39-92a0-8ed4dc95438e";
export const PRODUTO_BASICO = "7c2de375-ee33-4ae2-8cc5-b272bbfd854e";

export function extrairProdutoId(pedido: Record<string, unknown>): string | null {
  const produto = pedido.product;
  if (typeof produto === "string") return produto;
  if (produto && typeof produto === "object" && "id" in produto && typeof produto.id === "string") {
    return produto.id;
  }
  return null;
}

export function decidirPlanoProduto(
  pedido: Record<string, unknown>,
  ids: { premium?: string; basico?: string } = {},
): { produtoId: string | null; plano: Plano | null } {
  const produtoId = extrairProdutoId(pedido);
  const plano = produtoId === (ids.premium || PRODUTO_PREMIUM) ? "premium"
    : produtoId === (ids.basico || PRODUTO_BASICO) ? "basico" : null;
  return { produtoId, plano };
}
