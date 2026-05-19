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
  isPrimary?: boolean;
}

export interface PerfumeNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface ProductShipping {
  weight: number;
  dimensions: { length: number; width: number; height: number };
  freeShipping: boolean;
  shippingTime: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  brand: { id: string; name: string };
  category: { id: string; name: string };
  type: string;
  gender: string;
  perfumeNotes: PerfumeNotes;
  concentration: string;
  season: string;
  mood: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  basePrice: number;
  discountPrice?: number;
  discountPercentage?: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  tags: string[];
  shipping: ProductShipping;
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

export const productsApi = {
  /** GET /products/search — with optional query params */
  search: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    brand?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<ProductListResponse> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, value.toString());
      });
    }
    return apiRequest<ProductListResponse>(`/products/search?${query.toString()}`);
  },

  /** GET /products/featured */
  getFeatured: (): Promise<ProductListResponse> =>
    apiRequest<ProductListResponse>("/products/featured"),

  /** GET /products/new-arrivals */
  getNewArrivals: (): Promise<ProductListResponse> =>
    apiRequest<ProductListResponse>("/products/new-arrivals"),

  /** GET /products/bestsellers */
  getBestsellers: (): Promise<ProductListResponse> =>
    apiRequest<ProductListResponse>("/products/bestsellers"),

  /** GET /products/:id */
  getById: (id: string): Promise<{ success: boolean; data: Product }> =>
    apiRequest<{ success: boolean; data: Product }>(`/products/${id}`),
};
