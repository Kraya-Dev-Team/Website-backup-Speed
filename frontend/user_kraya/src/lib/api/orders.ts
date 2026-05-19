import { apiRequest } from "./client";

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  variantId: string;
  variantSize: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
}

export interface OrderTimeline {
  status: string;
  description: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  payment: {
    status: string;
    method?: string;
    amount: number;
    currency: string;
  };
  shipment?: {
    awb?: string;
    courierName?: string;
    trackingUrl?: string;
    status: string;
    estimatedDelivery?: string;
  };
  shippingAddress: ShippingAddress;
  timeline: OrderTimeline[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  success: boolean;
  data: Order[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface OrderPayload {
  shippingAddressId: string;
  phone: string;
  email: string;
}

export interface OrderVerifyPayload {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface OrderCreationResponse {
  success: boolean;
  data: {
    order: Order;
    razorpayOrder: {
      id: string;
      amount: number;
      currency: string;
      receipt: string;
    };
  };
}

export const ordersApi = {
  create: (data: OrderPayload): Promise<OrderCreationResponse> =>
    apiRequest<OrderCreationResponse>("/orders", {
      method: "POST",
      body: data,
      auth: true,
    }),

  verifyPayment: (data: OrderVerifyPayload): Promise<{ success: boolean; message: string }> =>
    apiRequest("/orders/verify", {
      method: "POST",
      body: data,
      auth: true,
    }),

  getMyOrders: (page = 1, limit = 20): Promise<OrderListResponse> =>
    apiRequest<OrderListResponse>(`/orders/my-orders?page=${page}&limit=${limit}`, { auth: true }),
};
