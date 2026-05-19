import { Router } from "express";
import { reviewController } from "../controllers/ReviewController.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

router.post("/", authenticate, upload.array("images", 5), reviewController.create);
router.get("/product/:productId", reviewController.getByProduct);
router.get("/user/:userId", reviewController.getByUser);
router.get("/:productId/distribution", reviewController.getRatingDistribution);
router.get("/:id", reviewController.getById);

router.put("/:id", authenticate, reviewController.update);
router.delete("/:id", authenticate, reviewController.delete);
router.post("/:id/helpful", reviewController.markHelpful);
router.post("/:id/not-helpful", reviewController.markNotHelpful);

router.delete("/admin/:id", authenticate, requireAdmin, reviewController.delete);

export default router;