import { Router } from "express";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";
import requireVerified from "../middleware/requireVerified.js";
import { sendEmail } from "../utils/mailer.js";

const router = Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).send("User not found.");
    return res.json({
      id: user._id.toString(),
      email: user.email,
      isVerified: user.isVerified !== false,
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/sendEmailAlert", requireAuth, requireVerified, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).send("User not found.");

    const { subject, text, html } = req;
    if (!subject || !text || !html) {
      res.status(500).json({ message: "All fields are needed(subject, text & html)", bool: false });
    }
    const mes = await sendEmail({ to: user.email, subject, text, html });
    return res.json({ message: mes, bool: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
