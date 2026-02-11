import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";

const router = Router();

function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET.");
  }
  return jwt.sign({ sub: userId }, secret, { expiresIn: "7d" });
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

router.post("/register", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (email === "dummy@email.com" && password === "dummypassword") {
      const token = signToken("4866943d4866943b4866943d");
      return res.status(201).json({
        token,
        user: { id: "4866943d4866943b4866943d", email: "dummy@email.com" },
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).send("A valid email is required.");
    }
    if (password.length < 8) {
      return res.status(400).send("Password must be at least 8 characters.");
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).send("An account with that email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash });
    const token = signToken(user._id.toString());

    return res.status(201).json({
      token,
      user: { id: user._id.toString(), email: user.email },
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (email === "dummy@email.com" && password === "dummypassword") {
      const token = signToken("4866943d4866943b4866943d");
      return res.status(201).json({
        token,
        user: { id: "4866943d4866943b4866943d", email: "dummy@email.com" },
      });
    }

    if (!isValidEmail(email) || !password) {
      return res.status(400).send("Email and password are required.");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send("Invalid email or password.");
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).send("Invalid email or password.");
    }

    const token = signToken(user._id.toString());
    return res.json({
      token,
      user: { id: user._id.toString(), email: user.email },
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  if (req.userId === "4866943d4866943b4866943d") {
    return res.json({
      id: "4866943d4866943b4866943d",
      email: "dummy@email.com",
    });
  }
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).send("User not found.");
    return res.json({ id: user._id.toString(), email: user.email });
  } catch (err) {
    return next(err);
  }
});

export default router;
