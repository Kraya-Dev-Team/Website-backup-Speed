import { Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../models/Db.js";
import { orderModel, ShipmentInfo } from "../models/OrderModel.js";
import { DeliveryService } from "../services/DeliveryService.js";
import { PaymentService } from "../services/PaymentService.js";
import { AuthRequest } from "../middlewares/auth.js";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";
import { EmailNotificationService } from "../services/EmailNotificationService.js";

function mapShiprocketStatus(srStatus: string): ShipmentInfo["status"] {
  const s = srStatus?.toLowerCase() ?? "";
  if (s.includes("deliver")) return "delivered";
  if (s.includes("rto")) return "rto";
  if (s.includes("return")) return "returned";
  if (s.includes("cancel")) return "cancelled";
  return "shipped";
}

export const AdminOrderController = {

  // ─── Order Management ────────────────────────────────────────────────────

  async getOrders(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await orderModel.list({ page, limit });
      return res.json({ success: true, data: result });
    } catch (error) {
      logger.error("Error fetching all orders", { error });
      return res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
  },

  async getOrderById(req: AuthRequest, res: Response) {
    try {
      const order = await orderModel.findById(req.params.id as string);
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });
      return res.json({ success: true, data: order });
    } catch (error) {
      logger.error("Error fetching order by ID", { error });
      return res.status(500).json({ success: false, message: "Failed to fetch order" });
    }
  },

  async getOrderTimeline(req: AuthRequest, res: Response) {
    try {
      const order = await orderModel.findById(req.params.id as string);
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });
      return res.json({ success: true, data: order.timeline || [] });
    } catch (error) {
      logger.error("Error fetching order timeline", { error });
      return res.status(500).json({ success: false, message: "Failed to fetch timeline" });
    }
  },

  async updateOrderStatus(req: AuthRequest, res: Response) {
    try {
      const { status, description } = req.body;
      const order = await orderModel.updateStatus(req.params.id as string, status, description);
      if (order) {
        EmailNotificationService.orderStatusChanged(order, order.email, "Customer", status, description);
      }
      return res.json({ success: true, data: order });
    } catch (error) {
      logger.error("Error updating order status", { error });
      return res.status(500).json({ success: false, message: "Failed to update order status" });
    }
  },

  // ─── Shipment Creation ───────────────────────────────────────────────────

  async createShipment(req: AuthRequest, res: Response) {
    try {
      const order = await orderModel.findById(req.params.id as string);
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });

      if (order.shipment?.shipmentId && order.shipment?.status !== "cancelled") {
        return res.status(400).json({ success: false, message: "Active shipment already exists" });
      }

      const isRetry = order.shipment?.status === "cancelled";
      const payload = {
        order_id: isRetry ? `${order.orderNumber}-R${Date.now().toString().slice(-4)}` : order.orderNumber,
        order_date: order.createdAt.toISOString(),
        pickup_location: config.shiprocket.pickupLocation,
        billing_customer_name: order.shippingAddress.firstName,
        billing_last_name: order.shippingAddress.lastName,
        billing_address: order.shippingAddress.addressLine1,
        billing_address_2: order.shippingAddress.addressLine2 || "",
        billing_city: order.shippingAddress.city,
        billing_pincode: order.shippingAddress.pincode,
        billing_state: order.shippingAddress.state,
        billing_country: order.shippingAddress.country,
        billing_email: order.email || "",
        billing_phone: order.phone,
        shipping_is_billing: order.billingAddress ? false : true,
        order_items: order.items.map(i => ({
          name: i.productName,
          sku: i.sku,
          units: i.quantity,
          selling_price: i.price,
          discount: i.discountPrice || 0,
        })),
        payment_method: "Prepaid",
        sub_total: order.total,
        length: config.logistics.defaultDimensions.length,
        breadth: config.logistics.defaultDimensions.breadth,
        height: config.logistics.defaultDimensions.height,
        weight: config.logistics.defaultWeight
      };

      const shipmentResponse = await DeliveryService.createShipment(payload);

      const shipmentInfo: ShipmentInfo = {
        provider: "shiprocket",
        shipmentId: shipmentResponse.shipment_id?.toString(),
        shiprocketOrderId: shipmentResponse.order_id?.toString(),
        status: "created"
      };

      const updatedOrder = await orderModel.updateShipment(order._id!.toString(), shipmentInfo);
      await orderModel.updateStatus(order._id!.toString(), "processing", "Shipment created via Shiprocket");

      if (updatedOrder) {
        EmailNotificationService.shipmentCreated(updatedOrder, updatedOrder.email, "Customer");
      }

      return res.json({ success: true, data: updatedOrder });
    } catch (error) {
      logger.error("Error creating shipment", { error });
      return res.status(500).json({ success: false, message: "Failed to create shipment" });
    }
  },

  // ─── Delivery Operations (Shiprocket) ────────────────────────────────────

  async generateAWB(req: AuthRequest, res: Response) {
    try {
      const { shipment_id, orderId } = req.body;
      if (!shipment_id) return res.status(400).json({ success: false, message: "shipment_id is required" });
      if (!orderId) return res.status(400).json({ success: false, message: "orderId is required" });

      const data = await DeliveryService.generateAWB(shipment_id.toString());

      // Get existing shipment data to preserve IDs
      const order = await orderModel.findById(orderId);
      const existingShipment = order?.shipment || {};

      const awb = data.response?.data?.awb_code as string | undefined;
      const courierName = data.response?.data?.courier_name as string | undefined;
      logger.info("AWB generated", { awb, courierName, data });
      await orderModel.updateShipment(orderId, {
        ...existingShipment,
        shipmentId: shipment_id.toString(),
        awb,
        courierName,
        awbAssignDate: new Date(),
        pickupScheduledDate: data.response?.data?.pickup_scheduled_date,
        invoice_no: data.response?.data?.invoice_no
      });
      await orderModel.updateStatus(orderId, "processing", "AWB assigned, shipment handed to courier");

      if (awb) {
        const freshOrder = await orderModel.findById(orderId);
        if (freshOrder) {
          EmailNotificationService.awbAssigned(freshOrder, freshOrder.email, "Customer", awb, courierName);
        }
      }

      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error("Error generating AWB", { error });
      return res.status(500).json({ success: false, message: error.message || "Failed to generate AWB" });
    }
  },

  async trackShipment(req: AuthRequest, res: Response) {
    try {
      const { awb } = req.params;
      const { orderId } = req.query as { orderId?: string };
      if (!awb) return res.status(400).json({ success: false, message: "awb is required" });

      const data = await DeliveryService.trackShipment(awb as string);

      if (orderId) {
        const srStatus: string | undefined = data.tracking_data?.shipment_track?.[0]?.current_status;
        if (srStatus) {
          const shipmentStatus = mapShiprocketStatus(srStatus);
          const shipmentUpdate: Partial<ShipmentInfo> = { status: shipmentStatus };
          if (shipmentStatus === "delivered") shipmentUpdate.deliveredAt = new Date();
          await orderModel.updateShipment(orderId, shipmentUpdate);
          if (shipmentStatus === "delivered") {
            await orderModel.updateStatus(orderId, "delivered", `Delivered: ${srStatus}`);
          }
        }
      }

      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error("Error tracking shipment", { error });
      return res.status(500).json({ success: false, message: error.message || "Failed to track shipment" });
    }
  },

  async cancelOrder(req: AuthRequest, res: Response) {
    try {
      const { ids, orderId, awb, shiprocketOrderId } = req.body;
      if (!ids || !Array.isArray(ids)) return res.status(400).json({ success: false, message: "ids array is required" });
      if (!orderId) return res.status(400).json({ success: false, message: "orderId is required" });

      let result;

      // Use frontend-provided IDs to save a DB lookup
      if (awb) {
        logger.info(`Direct cancel by AWB: ${awb}`);
        result = await DeliveryService.cancelShipmentsByAWB([awb]);
      } else if (shiprocketOrderId) {
        logger.info(`Direct cancel by Order ID: ${shiprocketOrderId}`);
        result = await DeliveryService.cancelOrder([shiprocketOrderId]);
      } else {
        logger.info(`Fallback cancel by provided IDs: ${ids}`);
        result = await DeliveryService.cancelOrder(ids);
      }

      // Single atomic DB update
      const now = new Date();
      const timelineEntry = {
        status: "cancelled",
        description: "Order/Shipment cancelled via Shiprocket",
        timestamp: now
      };

      const db = getDB();
      await db.collection("orders").updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            status: "cancelled",
            "shipment.status": "cancelled",
            updatedAt: now
          },
          $push: { timeline: timelineEntry } as any
        }
      );

      return res.json({ success: true, message: "Cancelled successfully", data: result });
    } catch (error: any) {
      logger.error("Error canceling order", { error });
      return res.status(500).json({ success: false, message: error.message || "Failed to cancel order" });
    }
  },

  async checkServiceability(req: AuthRequest, res: Response) {
    try {
      const { pickup_postcode, delivery_postcode, weight, cod } = req.query as any;
      if (!pickup_postcode || !delivery_postcode || weight === undefined || cod === undefined) {
        return res.status(400).json({ success: false, message: "pickup_postcode, delivery_postcode, weight, and cod are required query params" });
      }
      const data = await DeliveryService.checkServiceability({ pickup_postcode, delivery_postcode, weight, cod });
      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error("Error checking serviceability", { error });
      return res.status(500).json({ success: false, message: error.message || "Failed to check serviceability" });
    }
  },

  async requestPickup(req: AuthRequest, res: Response) {
    try {
      const { shipment_id, orderId } = req.body;
      if (!shipment_id || !Array.isArray(shipment_id)) return res.status(400).json({ success: false, message: "shipment_id array is required" });
      if (!orderId) return res.status(400).json({ success: false, message: "orderId is required" });

      // Get existing shipment data to preserve IDs
      const order = await orderModel.findById(orderId);
      const existingShipment = order?.shipment || {};

      try {
        const data = await DeliveryService.requestPickup(shipment_id);
        await orderModel.updateStatus(orderId, "processing", "Pickup scheduled with courier");
        await orderModel.updateShipment(orderId, {
          ...existingShipment,
          pickupScheduledDate: data.response?.data?.pickup_scheduled_date || new Date()
        });
        return res.json({ success: true, data });
      } catch (error: any) {
        const errorStr = (error.message || "").toLowerCase();

        // Very robust check for already scheduled message
        if (errorStr.includes("already in pickup queue") || errorStr.includes("already scheduled")) {
          await orderModel.updateStatus(orderId, "processing", "Pickup already scheduled (Synced)");
          await orderModel.updateShipment(orderId, {
            ...existingShipment,
            pickupScheduledDate: new Date()
          });
          return res.json({ success: true, message: "Pickup already scheduled", synced: true });
        }
        throw error;
      }
    } catch (error: any) {
      logger.error("Error requesting pickup", { error });
      return res.status(500).json({ success: false, message: error.message || "Failed to request pickup" });
    }
  },

  async generateLabel(req: AuthRequest, res: Response) {
    try {
      const { shipment_id, orderId } = req.body;
      if (!shipment_id || !Array.isArray(shipment_id)) return res.status(400).json({ success: false, message: "shipment_id array is required" });
      if (!orderId) return res.status(400).json({ success: false, message: "orderId is required" });

      const data = await DeliveryService.generateLabel(shipment_id);

      // Get existing shipment data to preserve IDs
      const order = await orderModel.findById(orderId);
      const existingShipment = order?.shipment || {};

      await orderModel.updateStatus(orderId, "processing", "Label generated for shipment");
      if (data.label_url) {
        await orderModel.updateShipment(orderId, {
          ...existingShipment,
          labelUrl: data.label_url
        });
      }

      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error("Error generating label", { error });
      return res.status(500).json({ success: false, message: error.message || "Failed to generate label" });
    }
  },

  async generateManifest(req: AuthRequest, res: Response) {
    try {
      const { shipment_id, orderId } = req.body;
      if (!shipment_id || !Array.isArray(shipment_id)) return res.status(400).json({ success: false, message: "shipment_id array is required" });
      if (!orderId) return res.status(400).json({ success: false, message: "orderId is required" });

      const data = await DeliveryService.generateManifest(shipment_id);
      await orderModel.updateStatus(orderId, "processing", "Manifest generated for shipment");

      if (data.manifest_url) {
        await orderModel.updateShipment(orderId, { manifest_url: data.manifest_url });
      }

      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error("Error generating manifest", { error });
      return res.status(500).json({ success: false, message: error.message || "Failed to generate manifest" });
    }
  },

  async generateInvoice(req: AuthRequest, res: Response) {
    try {
      const { ids, orderId } = req.body;
      if (!ids || !Array.isArray(ids)) return res.status(400).json({ success: false, message: "ids array is required" });
      if (!orderId) return res.status(400).json({ success: false, message: "orderId is required" });

      const data = await DeliveryService.generateInvoice(ids);

      await orderModel.updateStatus(orderId, "processing", "Invoice generated for order");
      if (data.invoice_url) {
        await orderModel.updateShipment(orderId, { invoice_url: data.invoice_url });
      }
      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error("Error generating invoice", { error });
      return res.status(500).json({ success: false, message: error.message || "Failed to generate invoice" });
    }
  },

  async forwardShipment(req: AuthRequest, res: Response) {
    try {
      const data = await DeliveryService.forwardShipment(req.body);
      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error("Error on forward shipment", { error });
      return res.status(500).json({ success: false, message: error.message || "Failed on forward shipment" });
    }
  },

  async returnShipment(req: AuthRequest, res: Response) {
    try {
      const { orderId, ...returnData } = req.body;
      if (!orderId) return res.status(400).json({ success: false, message: "orderId is required" });

      const data = await DeliveryService.returnShipment(returnData);

      await orderModel.updateShipment(orderId, {
        shipmentId: data.shipment_id?.toString(),
        awb: data.awb_code,
        courierName: data.courier_name,
        status: "returned",
      });
      await orderModel.updateStatus(orderId, "cancelled", "Return shipment initiated");

      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error("Error on return shipment", { error });
      return res.status(500).json({ success: false, message: error.message || "Failed on return shipment" });
    }
  },

  async refundPayment(req: AuthRequest, res: Response) {
    try {
      const order = await orderModel.findById(req.params.id as string);
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });

      if (order.payment.status !== "completed") {
        return res.status(400).json({ success: false, message: "Only completed payments can be refunded" });
      }

      if (!order.payment.razorpayPaymentId) {
        return res.status(400).json({ success: false, message: "No Razorpay payment ID found for this order" });
      }

      const { amount } = req.body; // optional partial refund amount in INR
      const refund = await PaymentService.processRefund(order.payment.razorpayPaymentId, amount);

      await orderModel.updatePayment(order._id!.toString(), {
        ...order.payment,
        status: "refunded",
        refundId: refund.id as string,
        refundAmount: amount || order.payment.amount,
        refundedAt: new Date(),
      });

      await orderModel.updateStatus(order._id!.toString(), "refunded", "Refund processed by admin");

      const refundAmount = amount || order.payment.amount;
      EmailNotificationService.refundInitiated(order, order.email, "Customer", refundAmount);

      return res.json({ success: true, message: "Refund processed successfully", data: { refundId: refund.id } });
    } catch (error) {
      logger.error("Error processing refund", { error });
      return res.status(500).json({ success: false, message: "Failed to process refund" });
    }
  }

};
