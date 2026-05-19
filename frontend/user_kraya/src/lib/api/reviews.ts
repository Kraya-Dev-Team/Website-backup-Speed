import { apiRequest } from "./client";

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  pros: string[];
  cons: string[];
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewListResponse {
  success: boolean;
  data: {
    reviews: Review[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const reviewsApi = {
  /** POST /reviews — create a review */
  create: (data: {
    productId: string;
    rating: number;
    title: string;
    comment: string;
    pros?: string[];
    cons?: string[];
    images?: string[];
  }): Promise<{ success: boolean; data: Review }> =>
    apiRequest("/reviews", {
      method: "POST",
      body: data,
      auth: true,
    }),

  /** GET /reviews/product/:productId */
  getByProduct: (
    productId: string,
    params?: {
      page?: number;
      limit?: number;
      rating?: number;
      sortBy?: string;
    }
  ): Promise<ReviewListResponse> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, value.toString());
      });
    }
    const qs = query.toString();
    return apiRequest<ReviewListResponse>(
      `/reviews/product/${productId}${qs ? `?${qs}` : ""}`
    );
  },

  /** GET /reviews/user/:userId */
  getByUser: (
    userId: string,
    params?: { limit?: number }
  ): Promise<{ success: boolean; data: Review[] }> => {
    const query = new URLSearchParams();
    if (params?.limit) query.append("limit", params.limit.toString());
    const qs = query.toString();
    return apiRequest<{ success: boolean; data: Review[] }>(
      `/reviews/user/${userId}${qs ? `?${qs}` : ""}`
    );
  },

  /** GET /reviews/:id — get single review details */
  getById: (id: string): Promise<{ success: boolean; data: Review }> =>
    apiRequest<{ success: boolean; data: Review }>(`/reviews/${id}`),

  /** GET /reviews/:productId/distribution */
  getDistribution: (
    productId: string
  ): Promise<{ success: boolean; data: Record<string, number> }> =>
    apiRequest<{ success: boolean; data: Record<string, number> }>(
      `/reviews/${productId}/distribution`
    ),

  /** PUT /reviews/:id — update review */
  update: (
    id: string,
    data: { rating?: number; title?: string; comment?: string }
  ): Promise<{ success: boolean; data: Partial<Review> }> =>
    apiRequest(`/reviews/${id}`, {
      method: "PUT",
      body: data,
      auth: true,
    }),

  /** DELETE /reviews/:id — delete own review */
  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/reviews/${id}`, {
      method: "DELETE",
      auth: true,
    }),

  /** DELETE /reviews/admin/:id — admin only delete */
  deleteByAdmin: (id: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/reviews/admin/${id}`, {
      method: "DELETE",
      auth: true,
    }),

  /** POST /reviews/:id/helpful */
  markHelpful: (id: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/reviews/${id}/helpful`, { method: "POST" }),

  /** POST /reviews/:id/not-helpful */
  markNotHelpful: (id: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/reviews/${id}/not-helpful`, { method: "POST" }),
};
