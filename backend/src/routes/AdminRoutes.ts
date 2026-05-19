import { Router } from "express";
import { productController } from "../controllers/ProductController.js";
import { brandController } from "../controllers/BrandController.js";
import { categoryController } from "../controllers/CategoryController.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { AdminOrderController } from "../controllers/AdminOrderController.js";
import { analyticsController } from "../controllers/AnalyticsController.js";
import { mediaController } from "../controllers/MediaController.js";
import { upload } from "../middlewares/upload.js";
import { OfferController } from "../controllers/OfferController.js";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.post("/upload", upload.single("image"), mediaController.upload);
router.post("/upload/bulk", upload.array("images", 10), mediaController.uploadMultiple);

// Analytics
router.get("/analytics", analyticsController.getAnalytics);
router.delete("/analytics/cache", analyticsController.clearCache);

router.post("/products", productController.create);
router.put("/products/:id", productController.update);

router.post("/brands", brandController.create);
router.put("/brands/:id", brandController.update);

router.post("/categories", categoryController.create);
router.put("/categories/:id", categoryController.update);

router.get("/orders/", AdminOrderController.getOrders);
router.get("/orders/:id", AdminOrderController.getOrderById);
router.get("/orders/:id/timeline", AdminOrderController.getOrderTimeline);
router.patch("/orders/:id/status", AdminOrderController.updateOrderStatus);
router.post("/orders/:id/refund", AdminOrderController.refundPayment);

// Delivery APIs

router.post("/orders/:id/shipment", AdminOrderController.createShipment);

router.get("/delivery/serviceability", AdminOrderController.checkServiceability);

router.post("/delivery/awb", AdminOrderController.generateAWB);

router.post("/delivery/label", AdminOrderController.generateLabel);

// well we will require incase this gets too much attecntion and per day atleast 20 + orders are being pickuped
// router.post("/delivery/manifest", AdminOrderController.generateManifest);

router.post("/delivery/pickup", AdminOrderController.requestPickup);

router.get("/delivery/track/:awb", AdminOrderController.trackShipment);
router.post("/delivery/cancel", AdminOrderController.cancelOrder);

//invoicse for sending to customer via email
router.post("/delivery/invoice", AdminOrderController.generateInvoice);
router.post("/delivery/forward", AdminOrderController.forwardShipment);
router.post("/delivery/return", AdminOrderController.returnShipment);

// Offer / Coupon management
router.post("/offers", OfferController.createOffer);
router.get("/offers", OfferController.listOffers);
router.get("/offers/:id", OfferController.getOffer);
router.put("/offers/:id", OfferController.updateOffer);
router.delete("/offers/:id", OfferController.deleteOffer);

export default router;
