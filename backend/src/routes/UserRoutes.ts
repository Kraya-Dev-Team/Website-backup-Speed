import { Router, Response } from "express";
import { userModel } from "../models/UserModel.js";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);

router.get("/me", (req: AuthRequest, res: Response) => {
  const { _id, ...userData } = req.user;
  res.json({ success: true, data: userData });
});

router.patch("/", async (req: AuthRequest, res: Response) => {
  const { email, firstName, lastName, location } = req.body;
  const user = await userModel.update(req.user._id!.toString(), { email, firstName, lastName, location });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const { _id, ...userData } = user;
  res.json({ success: true, data: userData });
});

export default router;
