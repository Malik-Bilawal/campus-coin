import { Router } from "express";
import {
  requestOtp,
  register,
  login,
  logout,
  refresh,
  me,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  requestOtpSchema,
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
} from "../validators/auth.validators.js";
import { authLimiter } from "../middlewares/rateLimit.js";

const router = Router();

router.post("/request-otp", authLimiter, validate(requestOtpSchema), requestOtp);
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/me", protect, me);
router.post("/forgot-password", authLimiter, validate(forgotSchema), forgotPassword);
router.post("/reset-password", authLimiter, validate(resetSchema), resetPassword);

export default router;
