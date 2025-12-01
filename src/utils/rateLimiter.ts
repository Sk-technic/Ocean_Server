import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Collections } from "../models";
export const resetPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: (req, res) => {
    const safeIp = req.ip ? ipKeyGenerator(req.ip) : 'unknown-ip';
    return safeIp + "-" + (req.body?.email || "unknown");
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many reset attempts. Please try again after 15 minutes.",
  },
  handler: async (req, res, next, options) => {
    const email = req.body?.email;
    if (email) {
      try {
        await Collections.UserModel.findOneAndUpdate(
          { email, isDeleted: false },
          { $set: { Token: null, TokenExpiry: null } }
        );
      } catch (err) {
        console.error("Error clearing reset token after rate-limit:", err);
      }
    }
    return res.status(options.statusCode || 429).json(options.message);
  },
});
