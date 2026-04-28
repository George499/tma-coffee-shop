import {
  ProductForPricing,
  UnknownProductError,
  calculateTotal,
} from './orders.util';

const pricing = new Map<number, ProductForPricing>([
  [1, { id: 1, price: 25000 }], // 250.00 RUB
  [2, { id: 2, price: 17500 }], // 175.00 RUB
  [3, { id: 3, price: 1 }], // edge: 1 kopeck
]);

describe('calculateTotal', () => {
  it('sums price * quantity across multiple items', () => {
    const total = calculateTotal(
      [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 3 },
      ],
      pricing,
    );
    expect(total).toBe(25000 * 2 + 17500 * 3);
  });

  it('returns the price of a single item with quantity 1', () => {
    expect(
      calculateTotal([{ productId: 1, quantity: 1 }], pricing),
    ).toBe(25000);
  });

  it('handles 1-kopeck price without rounding', () => {
    expect(
      calculateTotal([{ productId: 3, quantity: 7 }], pricing),
    ).toBe(7);
  });

  it('returns 0 for an empty cart', () => {
    expect(calculateTotal([], pricing)).toBe(0);
  });

  it('throws UnknownProductError for an unknown productId', () => {
    expect(() =>
      calculateTotal([{ productId: 999, quantity: 1 }], pricing),
    ).toThrow(UnknownProductError);
  });

  it('does not trust client price even if a quantity is large', () => {
    // The function only takes quantity from input; price comes solely
    // from the pricing map. This is what guarantees the server-side
    // total cannot be forged from the client.
    const total = calculateTotal(
      [{ productId: 1, quantity: 1000 }],
      pricing,
    );
    expect(total).toBe(25000 * 1000);
  });
});
