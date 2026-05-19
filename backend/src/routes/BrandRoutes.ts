import { Router } from "express";
import { brandController } from "../controllers/BrandController.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/by-slug/:slug", brandController.getBySlug);
router.get("/", brandController.list);
router.get("/:id", brandController.getById);

router.post("/", authenticate, requireAdmin, brandController.create);
router.put("/:id", authenticate, requireAdmin, brandController.update);
router.delete("/:id", authenticate, requireAdmin, brandController.delete);

export default router;