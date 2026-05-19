import { apiRequest } from "./client";

export const adminReviewsApi = {
  deleteReview: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/reviews/admin/${id}`, {
      method: "DELETE",
      auth: true,
    }),

  getProductReviews: (productId: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return apiRequest<any>(`/reviews/product/${productId}?${q}`, { auth: true });
  },
};
