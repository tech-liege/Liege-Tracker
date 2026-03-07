import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { sendPasswordResetEmail, sendRegisterEmail } from "../utils/mailer.js";

const router = Router();
const PASSWORD_RESET_WINDOW_MS = 15 * 60 * 1000;
const VERIFY_ACCOUNT_WINDOW_MS = 24 * 60 * 60 * 1000;
let googleClient = null;

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

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hashVerifyAccountToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildResetUrl(token) {
  const appBaseUrl = (process.env.APP_BASE_URL || "http://localhost:5173").replace(/\/$/, "");
  const url = new URL(`${appBaseUrl}/auth/reset-password`);
  url.searchParams.set("token", token);
  return url.toString();
}

function buildVerifyAccountUrl(token) {
  const appBaseUrl = (process.env.APP_BASE_URL || "http://localhost:5173").replace(/\/$/, "");
  const url = new URL(`${appBaseUrl}/auth/verify-account`);
  url.searchParams.set("token", token);
  return url.toString();
}

function getGoogleClientId() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Missing GOOGLE_CLIENT_ID.");
  }
  return clientId;
}

function getGoogleClient() {
  if (!googleClient) {
    googleClient = new OAuth2Client(getGoogleClientId());
  }
  return googleClient;
}

async function issueVerifyAccountEmail(user) {
  const verifyToken = crypto.randomBytes(32).toString("hex");
  user.verifyAccountTokenHash = hashVerifyAccountToken(verifyToken);
  user.verifyAccountExpiresAt = new Date(Date.now() + VERIFY_ACCOUNT_WINDOW_MS);
  await user.save();

  const verifyUrl = buildVerifyAccountUrl(verifyToken);
  await sendRegisterEmail({ to: user.email, verifyUrl });
}

router.post("/register", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirmPassword || req.body.password || "");

    if (!isValidEmail(email)) {
      return res.status(400).send("A valid email is required.");
    }
    if (password.length < 8) {
      return res.status(400).send("Password must be at least 8 characters.");
    }
    if (password !== confirmPassword) {
      return res.status(400).send("Passwords do not match.");
    }

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.isVerified) {
        return res.status(409).send("An account with that email already exists.");
      }

      await issueVerifyAccountEmail(existing);

      return res.json({
        requiresVerification: true,
        message: "Account exists but is not verified. A new verification email has been sent.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString("hex");
    await User.create({
      email,
      passwordHash,
      verifyAccountTokenHash: hashVerifyAccountToken(verifyToken),
      verifyAccountExpiresAt: new Date(Date.now() + VERIFY_ACCOUNT_WINDOW_MS),
    });

    const verifyUrl = buildVerifyAccountUrl(verifyToken);
    await sendRegisterEmail({ to: email, verifyUrl });

    return res.status(201).json({
      requiresVerification: true,
      message: "Account created. Check your email to verify your account.",
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/verify-account/request", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!isValidEmail(email)) {
      return res.status(400).send("A valid email is required.");
    }

    const user = await User.findOne({ email });
    if (user && user.isVerified !== true) {
      await issueVerifyAccountEmail(user);
    }

    return res.json({
      message: "If an account exists and is unverified, a verification email has been sent.",
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/google", async (req, res, next) => {
  try {
    const credential = String(req.body.credential || "").trim();
    if (!credential) {
      return res.status(400).send("Google credential is required.");
    }

    const ticket = await getGoogleClient().verifyIdToken({
      idToken: credential,
      audience: getGoogleClientId(),
    });
    const payload = ticket.getPayload();

    const email = normalizeEmail(payload?.email);
    const googleId = String(payload?.sub || "").trim();
    const emailVerified = Boolean(payload?.email_verified);

    if (!email || !googleId || !emailVerified) {
      return res.status(400).send("Unable to verify Google account.");
    }

    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (!user) {
      user = await User.create({
        email,
        googleId,
        authProvider: "google",
        isVerified: true,
      });
    } else {
      user.googleId = googleId;
      user.isVerified = true;
      if (!user.passwordHash) {
        user.authProvider = "google";
      }
      await user.save();
    }

    const token = signToken(user._id.toString());
    return res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        isVerified: user.isVerified !== false,
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!isValidEmail(email) || !password) {
      return res.status(400).send("Email and password are required.");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send("Invalid email or password.");
    }
    if (!user.passwordHash) {
      return res.status(400).send("This account uses Google sign-in. Continue with Google.");
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).send("Invalid email or password.");
    }

    const token = signToken(user._id.toString());
    return res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        isVerified: user.isVerified !== false,
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/verify-account", async (req, res, next) => {
  try {
    const verifyToken = String(req.query.token || "").trim();
    if (!verifyToken) {
      return res.status(400).send("A verification token is required.");
    }

    const tokenHash = hashVerifyAccountToken(verifyToken);
    const user = await User.findOne({
      verifyAccountTokenHash: tokenHash,
    });

    if (!user) {
      return res.status(400).send("Invalid or expired verification link.");
    }

    if (!user.verifyAccountExpiresAt || user.verifyAccountExpiresAt <= new Date()) {
      return res.status(400).send("Invalid or expired verification link.");
    }

    if (user.isVerified === true) {
      const token = signToken(user._id.toString());
      return res.json({
        message: "Account already verified. Signing you in.",
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          isVerified: true,
        },
      });
    }

    user.isVerified = true;
    await user.save();

    const token = signToken(user._id.toString());
    return res.json({
      message: "Account verified successfully. Signing you in.",
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        isVerified: true,
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/password-reset/request", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!isValidEmail(email)) {
      return res.status(400).send("A valid email is required.");
    }

    const user = await User.findOne({ email });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordTokenHash = hashResetToken(resetToken);
      user.resetPasswordExpiresAt = new Date(Date.now() + PASSWORD_RESET_WINDOW_MS);
      await user.save();

      const resetUrl = buildResetUrl(resetToken);
      await sendPasswordResetEmail({ to: email, resetUrl });
    }

    return res.json({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/password-reset/validate", async (req, res, next) => {
  try {
    const token = String(req.query.token || "").trim();
    if (!token) {
      return res.status(400).send("A reset token is required.");
    }

    const user = await User.findOne({
      resetPasswordTokenHash: hashResetToken(token),
      resetPasswordExpiresAt: { $gt: new Date() },
    }).select("_id");

    if (!user) {
      return res.status(400).send("Invalid or expired reset link.");
    }

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

router.post("/password-reset/confirm", async (req, res, next) => {
  try {
    const token = String(req.body.token || "").trim();
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!token) {
      return res.status(400).send("A reset token is required.");
    }
    if (password.length < 8) {
      return res.status(400).send("Password must be at least 8 characters.");
    }
    if (password !== confirmPassword) {
      return res.status(400).send("Passwords do not match.");
    }

    const user = await User.findOne({
      resetPasswordTokenHash: hashResetToken(token),
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).send("Invalid or expired reset link.");
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    return res.json({ message: "Password reset successful." });
  } catch (err) {
    return next(err);
  }
});

export default router;
