export type Category = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  createdAt: string;
};

export type Product = {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number; // kopecks
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
};

export type CreateOrderItemInput = {
  productId: number;
  quantity: number;
};

export type CreateOrderInput = {
  items: CreateOrderItemInput[];
  deliveryType: 'PICKUP' | 'DELIVERY';
  address?: string;
  customerName: string;
  customerPhone: string;
  scheduledAt?: string;
  comment?: string;
};

export type CreatedOrder = {
  id: string;
  status: 'NEW' | 'ACCEPTED' | 'READY' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
};

export type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  productPrice: number;
  quantity: number;
};

export type Order = CreatedOrder & {
  deliveryType: 'PICKUP' | 'DELIVERY';
  address: string | null;
  customerName: string;
  customerPhone: string;
  scheduledAt: string | null;
  comment: string | null;
  createdAt: string;
  items: OrderItem[];
};

/** Telegram user shape returned from the @telegram-apps/init-data-node parser. */
export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  is_bot?: boolean;
  photo_url?: string;
  allows_write_to_pm?: boolean;
};
