import { apiRequest } from "./client";

export interface BrandPayload {
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  country?: string;
  founded?: number;
  website?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface Brand extends BrandPayload {
  id: string;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const adminBrandsApi = {
  create: (data: BrandPayload) =>
    apiRequest<{ success: boolean; data: Brand }>("/admin/brands", {
      method: "POST",
      body: data,
      auth: true,
    }),

  update: (id: string, data: Partial<BrandPayload>) =>
    apiRequest<{ success: boolean; data: Brand }>(`/admin/brands/${id}`, {
      method: "PUT",
      body: data,
      auth: true,
    }),

  list: (params?: { featured?: boolean; active?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.featured !== undefined) q.set("featured", String(params.featured));
    if (params?.active !== undefined) q.set("active", String(params.active));
    return apiRequest<{ success: boolean; data: Brand[] }>(`/brands?${q}`);
  },

  delete: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/admin/brands/${id}`, {
      method: "DELETE",
      auth: true,
    }),
};

export interface CategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface Category extends CategoryPayload {
  id: string;
  level?: number;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const adminCategoriesApi = {
  create: (data: CategoryPayload) =>
    apiRequest<{ success: boolean; data: Category }>("/admin/categories", {
      method: "POST",
      body: data,
      auth: true,
    }),

  update: (id: string, data: Partial<CategoryPayload>) =>
    apiRequest<{ success: boolean; data: Category }>(`/admin/categories/${id}`, {
      method: "PUT",
      body: data,
      auth: true,
    }),

  list: () => apiRequest<{ success: boolean; data: Category[] }>("/categories"),
  getTree: () => apiRequest<{ success: boolean; data: any[] }>("/categories/tree"),

  delete: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/admin/categories/${id}`, {
      method: "DELETE",
      auth: true,
    }),
};
