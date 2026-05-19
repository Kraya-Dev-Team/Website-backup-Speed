import { Router, Response } from "express";
import { sessionModel } from "../models/SessionModel.js";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", async (req: AuthRequest, res: Response) => {
  const sessions = await sessionModel.findByUserId(req.user._id!.toString());
  const safeSessions = sessions.map((s) => ({
    id: s._id?.toString(),
    userAgent: s.userAgent,
    ip: s.ip,
    expiresAt: s.expiresAt,
    createdAt: s.createdAt,
  }));
  res.json({ success: true, data: safeSessions });
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const session = await sessionModel.findById(sessionId);

  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  if (session.userId !== req.user._id!.toString()) {
    return res.status(403).json({ success: false, message: "Cannot delete other user's session" });
  }

  await sessionModel.delete(session._id!.toString());
  res.json({ success: true, message: "Session deleted" });
});

export default router;
