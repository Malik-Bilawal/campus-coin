import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound("User not found");
  return sendSuccess(res, { user: user.toSafeJSON() });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "academicYear", "allowanceBaseline", "savingsGoal", "currency", "theme", "fontSize"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound("User not found");
  return sendSuccess(res, { user: user.toSafeJSON() }, "Profile updated");
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select("+password");
  if (!user) throw ApiError.notFound("User not found");

  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw ApiError.badRequest("Current password is incorrect");

  user.password = await User.hashPassword(newPassword);
  await user.save();
  return sendSuccess(res, null, "Password updated");
});
