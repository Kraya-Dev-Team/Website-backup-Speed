import { Router } from "express";
import { categoryController } from "../controllers/CategoryController.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/tree", categoryController.getTree);
router.get("/roots", categoryController.getRoots);
router.get("/by-slug/:slug", categoryController.getBySlug);
router.get("/:id/children", categoryController.getChildren);
router.get("/", categoryController.list);
router.get("/:id", categoryController.getById);

router.post("/", authenticate, requireAdmin, categoryController.create);
router.put("/:id", authenticate, requireAdmin, categoryController.update);
router.delete("/:id", authenticate, requireAdmin, categoryController.delete);

export default router;