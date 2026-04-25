export const OrderStatus = {
  NEW: 'NEW',
  ACCEPTED: 'ACCEPTED',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const DeliveryType = {
  PICKUP: 'PICKUP',
  DELIVERY: 'DELIVERY',
} as const;
export type DeliveryType = (typeof DeliveryType)[keyof typeof DeliveryType];
