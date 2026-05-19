import { apiRequest } from "./client";

export interface OrderItem {
  productId: string;
  variantId: string;
  productName: string;
  variantSize: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderTimeline {
  status: string;
  description: string;
  timestamp: string;
}

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

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  phone: string;
  email: string;
  items: OrderItem[];
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  shippingAddress?: ShippingAddress;
  billingAddress?: ShippingAddress;
  payment?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    provider?: string;
    status?: string;
    method?: string;
    paidAt?: string;
  };
  itemCount: number;
  timeline?: OrderTimeline[];
  createdAt: string;
  updatedAt: string;
  shipment?: {
    provider: string;
    shipmentId: string | null;
    awb?: string;
    shiprocketOrderId?: string;
    pickupScheduledDate?: string;
    status: string;
    trackingUrl?: string;
  };
  notes?: string;
}

export interface OrderListResponse {
  success: boolean;
  data: {
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const adminOrdersApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.status) q.set("status", params.status);
    return apiRequest<OrderListResponse>(`/admin/orders?${q}`, { auth: true });
  },

  getById: (id: string) =>
    apiRequest<{ success: boolean; data: Order }>(`/admin/orders/${id}`, { auth: true }),

  updateStatus: (id: string, status: string, description?: string) =>
    apiRequest<{ success: boolean; data: Order }>(`/admin/orders/${id}/status`, {
      method: "PATCH",
      body: { status, description },
      auth: true,
    }),

  getTimeline: (id: string) =>
    apiRequest<{ success: boolean; data: OrderTimeline[] }>(`/admin/orders/${id}/timeline`, { auth: true }),

  createShipment: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/admin/orders/${id}/shipment`, {
      method: "POST",
      auth: true,
    }),
};

export const adminDeliveryApi = {
  generateAwb: (orderId: string, shipmentId: string, courierId?: string | number) =>
    apiRequest<any>("/admin/delivery/awb", {
      method: "POST",
      body: { 
        orderId,
        shipment_id: shipmentId,
        ...(courierId && { courier_id: courierId })
      },
      auth: true,
    }),

  trackShipment: (awb: string) =>
    apiRequest<any>(`/admin/delivery/track/${awb}`, { auth: true }),

  checkServiceability: (params: {
    pickup_postcode: string;
    delivery_postcode: string;
    weight: number;
    cod?: number;
  }) => {
    const q = new URLSearchParams(params as any);
    return apiRequest<any>(`/admin/delivery/serviceability?${q}`, { auth: true });
  },

  requestPickup: (orderId: string, shipmentIds: string[]) =>
    apiRequest<any>("/admin/delivery/pickup", {
      method: "POST",
      body: { 
        orderId,
        shipment_id: shipmentIds 
      },
      auth: true,
    }),

  generateLabel: (orderId: string, shipmentIds: string[]) =>
    apiRequest<any>("/admin/delivery/label", {
      method: "POST",
      body: { 
        orderId,
        shipment_id: shipmentIds 
      },
      auth: true,
    }),

  cancelOrder: (orderId: string, ids: string[], awb?: string, shiprocketOrderId?: string) =>
    apiRequest<any>("/admin/delivery/cancel", {
      method: "POST",
      body: { 
        orderId,
        ids,
        awb,
        shiprocketOrderId
      },
      auth: true,
    }),
};
