import { Router } from "express";
import { AddressController } from "../controllers/AddressController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", AddressController.getAddresses);
router.post("/", AddressController.createAddress);
router.put("/:id", AddressController.updateAddress);
router.delete("/:id", AddressController.deleteAddress);
router.put("/:id/default", AddressController.setDefaultAddress);

export default router;
