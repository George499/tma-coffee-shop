import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Product } from './types';

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartState = {
  items: Record<number, CartItem>;
  add: (product: Product) => void;
  decrement: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  hasHydrated: boolean;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: {},
      hasHydrated: false,

      add: (product) =>
        set((state) => {
          const existing = state.items[product.id];
          const quantity = (existing?.quantity ?? 0) + 1;
          return {
            items: { ...state.items, [product.id]: { product, quantity } },
          };
        }),

      decrement: (productId) =>
        set((state) => {
          const existing = state.items[productId];
          if (!existing) return state;
          if (existing.quantity <= 1) {
            const { [productId]: _, ...rest } = state.items;
            return { items: rest };
          }
          return {
            items: {
              ...state.items,
              [productId]: { ...existing, quantity: existing.quantity - 1 },
            },
          };
        }),

      setQuantity: (productId, quantity) =>
        set((state) => {
          const existing = state.items[productId];
          if (!existing) return state;
          if (quantity <= 0) {
            const { [productId]: _, ...rest } = state.items;
            return { items: rest };
          }
          return {
            items: {
              ...state.items,
              [productId]: { ...existing, quantity },
            },
          };
        }),

      remove: (productId) =>
        set((state) => {
          if (!state.items[productId]) return state;
          const { [productId]: _, ...rest } = state.items;
          return { items: rest };
        }),

      clear: () => set({ items: {} }),
    }),
    {
      name: 'tma-coffee-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    },
  ),
);

export const selectTotalQuantity = (state: CartState): number =>
  Object.values(state.items).reduce((acc, item) => acc + item.quantity, 0);

export const selectTotalPrice = (state: CartState): number =>
  Object.values(state.items).reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0,
  );

export const selectQuantityFor =
  (productId: number) =>
  (state: CartState): number =>
    state.items[productId]?.quantity ?? 0;
