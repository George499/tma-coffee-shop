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
