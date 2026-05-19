import { apiRequest } from "./client";
import { Product } from "./products";

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  product?: Product;
  price: number;
  totalPrice: number;
  name?: string;
  image?: string;
  variantSize?: string;
  variantUnit?: string;
}

export interface Cart {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
}

export interface CartResponse {
  success: boolean;
  data: Cart;
}

export interface CartSyncPayload {
  items: {
    productId: string;
    variantId: string;
    quantity: number;
    price?: number;
  }[];
}

export const cartApi = {
  /** GET /cart */
  get: (): Promise<CartResponse> => 
    apiRequest<CartResponse>("/cart", { auth: true }),

  /** PUT /cart — update cart */
  update: (data: CartSyncPayload): Promise<CartResponse> =>
    apiRequest<CartResponse>("/cart", {
      method: "PUT",
      body: data,
      auth: true,
    }),

  /** POST /cart/sync — sync cart */
  sync: (data: CartSyncPayload): Promise<CartResponse> =>
    apiRequest<CartResponse>("/cart/sync", {
      method: "POST",
      body: data,
      auth: true,
    }),

  /** DELETE /cart — clear all */
  clear: (): Promise<{ success: boolean; message: string }> =>
    apiRequest("/cart", {
      method: "DELETE",
      auth: true,
    }),
};
