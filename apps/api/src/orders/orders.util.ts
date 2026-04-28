export type OrderItemInput = {
  productId: number;
  quantity: number;
};

export type ProductForPricing = {
  id: number;
  price: number;
};

export class UnknownProductError extends Error {
  constructor(public readonly productId: number) {
    super(`Product ${productId} not in pricing map`);
  }
}

/**
 * Sum of price (kopecks) * quantity over all items, looked up by id in a
 * pricing map. The map must come from the database within the same
 * transaction as the write that uses this total — never trust prices
 * received from the client.
 */
export function calculateTotal(
  items: readonly OrderItemInput[],
  pricing: ReadonlyMap<number, ProductForPricing>,
): number {
  let total = 0;
  for (const item of items) {
    const product = pricing.get(item.productId);
    if (!product) {
      throw new UnknownProductError(item.productId);
    }
    total += product.price * item.quantity;
  }
  return total;
}
