import { Router } from "express";
import authRoutes from "./AuthRoutes.js";
import userRoutes from "./UserRoutes.js";
import sessionRoutes from "./SessionRoutes.js";
import productRoutes from "./ProductRoutes.js";
import brandRoutes from "./BrandRoutes.js";
import categoryRoutes from "./CategoryRoutes.js";
import reviewRoutes from "./ReviewRoutes.js";
import adminRoutes from "./AdminRoutes.js";
import cartRoutes from "./CartRoutes.js";
import orderRoutes from "./OrderRoutes.js";
import addressRoutes from "./AddressRoutes.js";
import offerRoutes from "./OfferRoutes.js";

const router = Router();
router.use("/admin", adminRoutes);


router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/sessions", sessionRoutes);
router.use("/products", productRoutes);
router.use("/reviews", reviewRoutes);
router.use("/cart", cartRoutes);
router.use("/addresses", addressRoutes);
router.use("/orders", orderRoutes);

router.use("/brands", brandRoutes);
router.use("/categories", categoryRoutes);
router.use("/offers", offerRoutes);

export default router;
