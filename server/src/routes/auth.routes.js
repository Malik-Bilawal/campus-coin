import { Router } from "express";
import {
  requestOtp,
  verifyOtp,
  register,
  login,
  adminLogin,
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
  otpVerifySchema,
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
} from "../validators/auth.validators.js";
import { authLimiter } from "../middlewares/rateLimit.js";

const router = Router();

router.post("/request-otp", authLimiter, validate(requestOtpSchema), requestOtp);
router.post("/verify-otp", authLimiter, validate(otpVerifySchema), verifyOtp);
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/admin-login", authLimiter, validate(loginSchema), adminLogin);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/me", protect, me);
router.post("/forgot-password", authLimiter, validate(forgotSchema), forgotPassword);
router.post("/reset-password", authLimiter, validate(resetSchema), resetPassword);

export default router;
