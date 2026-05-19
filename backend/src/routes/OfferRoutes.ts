import { Router } from "express";
import { OfferController } from "../controllers/OfferController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

// Public — list active offers (no auth required)
router.get("/", OfferController.listActiveOffers);

// Authenticated — validate an offer code against current cart
router.post("/validate", authenticate, OfferController.validateOffer);

export default router;
