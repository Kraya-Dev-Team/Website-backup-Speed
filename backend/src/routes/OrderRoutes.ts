import { Router } from "express";
import { OrderController } from "../controllers/OrderController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);

router.post("/", OrderController.createOrder);
router.post("/verify", OrderController.verifyPayment);
router.get("/my-orders", OrderController.getMyOrders);

export default router;
