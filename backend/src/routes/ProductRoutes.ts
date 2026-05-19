import { Router } from "express";
import { productController } from "../controllers/ProductController.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/search", productController.list);
router.get("/featured", productController.list);
router.get("/new-arrivals", productController.list);
router.get("/bestsellers", productController.list);
router.get("/:id", productController.getById);

// router.post("/", authenticate, requireAdmin, productController.create);
// router.put("/:id", authenticate, requireAdmin, productController.update);
// router.delete("/:id", authenticate, requireAdmin, productController.delete);

export default router;