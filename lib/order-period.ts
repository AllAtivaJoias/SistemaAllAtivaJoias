/** Resumo legível dos itens. Ex.: "2x Anel Solitário, 1x Colar de Prata" */
export function formatOrderSummary(
  items: {
    quantity: number;
    productTitle?: string | null;
    product?: { title: string } | null;
  }[]
): string {
  return items
    .map((item) => {
      const title =
        item.productTitle?.trim() || item.product?.title || "Produto";
      return `${item.quantity}x ${title}`;
    })
    .join(", ");
}

/** ID curto para exibição na tabela. */
export function formatOrderId(id: string): string {
  return id.slice(-8).toUpperCase();
}
