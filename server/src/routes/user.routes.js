import { Router } from "express";
import { getProfile, updateProfile, updatePassword } from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { z } from "zod";
import { validate } from "../middlewares/validate.js";

const router = Router();
router.use(protect);

const profileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  academicYear: z.string().max(40).optional(),
  allowanceBaseline: z.coerce.number().min(0).optional(),
  savingsGoal: z.coerce.number().min(0).optional(),
  currency: z.string().max(3).optional(),
  theme: z.enum(["light", "dark"]).optional(),
  fontSize: z.enum(["sm", "md", "lg"]).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(72),
});

router.get("/", getProfile);
router.patch("/", validate(profileSchema), updateProfile);
router.patch("/password", validate(passwordSchema), updatePassword);

export default router;
