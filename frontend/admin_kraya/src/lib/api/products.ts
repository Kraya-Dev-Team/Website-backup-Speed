import { apiRequest } from "./client";

export interface ProductVariant {
  id: string;
  size: string;
  unit: string;
  price: number;
  discountPrice?: number;
  discountPercentage?: number;
  stock: number;
  sku: string;
  isAvailable: boolean;
  isDefault?: boolean;
}

export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface ProductPayload {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  brand?: { id: string; name: string };
  category?: { id: string; name: string };
  type?: string;
  gender?: string;
  perfumeNotes?: { top: string[]; heart: string[]; base: string[] };
  concentration?: string;
  season?: string;
  mood?: string[];
  images?: ProductImage[];
  variants?: ProductVariant[];
  basePrice: number;
  discountPrice?: number | null;
  discountPercentage?: number | null;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  isActive?: boolean;
  isArchived?: boolean;
  tags?: string[];
  shipping?: { weight?: number; freeShipping?: boolean; shippingTime?: string };
}

export interface Product extends ProductPayload {
  id: string;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  success: boolean;
  data: {
    items: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const adminProductsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.search) q.set("search", params.search);
    return apiRequest<ProductListResponse>(`/products/search?${q}`, { auth: true });
  },

  getById: (id: string) =>
    apiRequest<{ success: boolean; data: Product }>(`/products/${id}`, { auth: true }),

  create: (data: ProductPayload) =>
    apiRequest<{ success: boolean; data: Product }>("/admin/products", {
      method: "POST",
      body: data,
      auth: true,
    }),

  update: (id: string, data: Partial<ProductPayload>) =>
    apiRequest<{ success: boolean; data: Product }>(`/admin/products/${id}`, {
      method: "PUT",
      body: data,
      auth: true,
    }),

  delete: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/admin/products/${id}`, {
      method: "DELETE",
      auth: true,
    }),
};
