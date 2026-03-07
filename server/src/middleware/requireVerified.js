import User from "../models/User.js";

export default async function requireVerified(req, res, next) {
  try {
    const user = await User.findById(req.userId).select("isVerified");
    if (!user) {
      return res.status(404).send("User not found.");
    }
    if (user.isVerified === false) {
      return res.status(403).send("Verify your account to access this feature.");
    }
    return next();
  } catch (err) {
    return next(err);
  }
}
