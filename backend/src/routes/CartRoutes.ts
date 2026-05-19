import { Router } from "express";
import { CartController } from "../controllers/CartController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

// All cart routes require authentication
router.use(authenticate);

router.get("/", CartController.getCart);
router.put("/", CartController.updateCart);
router.post("/sync", CartController.syncCart);
router.delete("/", CartController.clearCart);

export default router;
