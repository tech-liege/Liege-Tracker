import jwt from "jsonwebtoken";

export default function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).send("Missing auth token.");
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).send("Auth is not configured.");
    }
    const payload = jwt.verify(token, secret);
    req.userId = payload.sub;
    return next();
  } catch (_err) {
    return res.status(401).send("Invalid or expired token.");
  }
}
