import { ObjectId } from "mongodb";
import { getDB } from "./Db.js";

export interface OrderItem {
  productId: string;
  productName: string;
  variantId: string;
  variantSize: string;
  sku: string;
  quantity: number;
  price: number;
  discountPrice?: number;
  total: number;
  image?: string;
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
  isDefault?: boolean;
}

export interface PaymentInfo {
  provider: "razorpay";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed" | "refunded" | "cancelled";
  method?: string;
  gatewayResponse?: Record<string, any>;
  paidAt?: Date;
  refundId?: string;
  refundAmount?: number;
  refundedAt?: Date;
}

export interface ShipmentInfo {
  provider: "shiprocket";
  shipmentId?: string;
  shiprocketOrderId?: string;
  awb?: string;
  courierName?: string;
  trackingUrl?: string;
  labelUrl?: string;
  status: "pending" | "created" | "shipped" | "delivered" | "cancelled" | "returned" | "rto";
  awbAssignDate?: Date;
  pickupScheduledDate?: Date;
  estimatedDelivery?: Date;
  invoice_no?: string;
  invoice_url?: string;
  manifest_url?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface OrderTimeline {
  status: string;
  description: string;
  timestamp: Date;
}

export interface Order {
  _id?: ObjectId;
  orderNumber: string;
  userId: string;
  phone: string;
  email?: string;

  items: OrderItem[];
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  offerCode?: string;
  offerTitle?: string;

  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;

  payment: PaymentInfo;
  shipment?: ShipmentInfo;

  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

  timeline: OrderTimeline[];

  notes?: string;
  internalNotes?: string;

  source: "web" | "app" | "api";

  createdAt: Date;
  updatedAt: Date;
}

export const orderModel = {
  async create(data: Omit<Order, "_id" | "orderNumber" | "createdAt" | "updatedAt" | "timeline" | "itemCount">): Promise<Order> {
    const db = getDB();
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const now = new Date();

    const order: Order = {
      ...data,
      orderNumber,
      itemCount: data.items.reduce((sum, item) => sum + item.quantity, 0),
      timeline: [{
        status: "pending",
        description: "Order placed successfully",
        timestamp: now,
      }],
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("orders").insertOne(order as any);
    return order;
  },

  async findById(id: string): Promise<Order | null> {
    const db = getDB();
    return db.collection("orders").findOne({ _id: new ObjectId(id) }) as Promise<Order | null>;
  },

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const db = getDB();
    return db.collection("orders").findOne({ orderNumber }) as Promise<Order | null>;
  },

  async findByUserId(userId: string, filter?: { page?: number; limit?: number; status?: string }): Promise<{ orders: Order[]; total: number }> {
    const db = getDB();
    const page = filter?.page || 1;
    const limit = filter?.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { userId };
    if (filter?.status) query.status = filter.status;

    const [orders, total] = await Promise.all([
      db.collection("orders").find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("orders").countDocuments(query),
    ]);

    return { orders: orders as Order[], total };
  },

  async update(id: string, data: Partial<Omit<Order, "_id" | "orderNumber" | "createdAt">>): Promise<Order | null> {
    const db = getDB();
    const result = await db.collection("orders").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    return result as Order | null;
  },

  async addTimelineEntry(id: string, status: string, description: string): Promise<Order | null> {
    const db = getDB();
    const result = await db.collection("orders").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { "timeline.$.status": status, "timeline.$.description": description, "timeline.$.timestamp": new Date() }
      },
      { returnDocument: "after" }
    );
    return result as unknown as Order | null;
  },

  async updateStatus(id: string, status: Order["status"], description?: string): Promise<Order | null> {
    const db = getDB();
    const timelineEntry: OrderTimeline = {
      status,
      description: description || `Order status updated to ${status}`,
      timestamp: new Date(),
    };

    const result = await db.collection("orders").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { status, updatedAt: new Date() }
      },
      { returnDocument: "after" }
    );
    await db.collection("orders").updateOne({ _id: new ObjectId(id) }, { $push: { timeline: timelineEntry } as any });
    return result as unknown as Order | null;
  },

  async updatePayment(id: string, payment: Partial<PaymentInfo>): Promise<Order | null> {
    return this.update(id, { payment: { ...payment, provider: "razorpay" } as PaymentInfo });
  },

  async updateShipment(id: string, shipment: Partial<ShipmentInfo>): Promise<Order | null> {
    return this.update(id, { shipment: { ...shipment, provider: "shiprocket" } as ShipmentInfo });
  },

  async list(filter: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
  }): Promise<{ orders: Order[]; total: number; page: number; limit: number; totalPages: number }> {
    const db = getDB();
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (filter.status) query.status = filter.status;
    if (filter.paymentStatus) query["payment.status"] = filter.paymentStatus;
    if (filter.fromDate || filter.toDate) {
      query.createdAt = {};
      if (filter.fromDate) query.createdAt.$gte = filter.fromDate;
      if (filter.toDate) query.createdAt.$lte = filter.toDate;
    }
    if (filter.search) {
      query.$or = [
        { orderNumber: { $regex: filter.search, $options: "i" } },
        { phone: { $regex: filter.search, $options: "i" } },
        { email: { $regex: filter.search, $options: "i" } },
      ];
    }

    const [orders, total] = await Promise.all([
      db.collection("orders").find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("orders").countDocuments(query),
    ]);

    return {
      orders: orders as Order[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getStats(filter?: { fromDate?: Date; toDate?: Date }): Promise<{
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  }> {
    const db = getDB();
    const query: Record<string, any> = {};

    if (filter?.fromDate || filter?.toDate) {
      query.createdAt = {};
      if (filter.fromDate) query.createdAt.$gte = filter.fromDate;
      if (filter.toDate) query.createdAt.$lte = filter.toDate;
    }

    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          shippedOrders: { $sum: { $cond: [{ $eq: ["$status", "shipped"] }, 1, 0] } },
          deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        },
      },
    ];

    const result = await db.collection("orders").aggregate(pipeline).toArray();

    if (result.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
      };
    }

    return result[0] as unknown as {
      totalOrders: number;
      totalRevenue: number;
      pendingOrders: number;
      shippedOrders: number;
      deliveredOrders: number;
      cancelledOrders: number;
    };
  },
};
