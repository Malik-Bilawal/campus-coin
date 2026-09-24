import crypto from "crypto";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/token.js";
import { createUserDefaultCategories } from "../seeds/categories.js";
import { env } from "../config/env.js";

const REFRESH_COOKIE = "refreshToken";

function setAuthCookies(res, userId, role, email) {
  const access = signAccessToken({ sub: userId, role, email });
  const refresh = signRefreshToken({ sub: userId, role, email });

  res.cookie("accessToken", access, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
    path: "/",
  });
  res.cookie(REFRESH_COOKIE, refresh, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth",
  });

  return { accessToken: access, refreshToken: refresh };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, academicYear, allowanceBaseline, savingsGoal, currency } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw ApiError.conflict("Email already registered");

  const user = await User.create({
    name,
    email,
    password: await User.hashPassword(password),
    academicYear,
    allowanceBaseline,
    savingsGoal,
    currency,
  });

  await createUserDefaultCategories(user._id);

  const tokens = setAuthCookies(res, user._id, user.role, user.email);
  return sendSuccess(res, { user: user.toSafeJSON(), ...tokens }, "Account created", 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) throw ApiError.unauthorized("Invalid email or password");
  if (!user.isActive) throw ApiError.forbidden("Account disabled. Contact admin.");

  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized("Invalid email or password");

  const now = new Date();
  const last = user.lastLoginAt;
  const dayDiff = last ? Math.floor((now - last) / (1000 * 60 * 60 * 24)) : null;
  if (dayDiff === 1) user.loginStreak = (user.loginStreak || 0) + 1;
  else if (dayDiff === null || dayDiff > 1) user.loginStreak = 1;
  user.lastLoginAt = now;
  await user.save();

  const tokens = setAuthCookies(res, user._id, user.role, user.email);
  return sendSuccess(res, { user: user.toSafeJSON(), ...tokens }, "Logged in");
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
  return sendSuccess(res, null, "Logged out");
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized("No refresh token");

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized("User not found or disabled");

  const tokens = setAuthCookies(res, user._id, user.role, user.email);
  return sendSuccess(res, { user: user.toSafeJSON(), ...tokens }, "Token refreshed");
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound("User not found");
  return sendSuccess(res, { user: user.toSafeJSON() });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  const message = "If that email exists, a reset link has been generated";
  if (!user) return sendSuccess(res, null, message);

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  user.resetExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;

  if (env.NODE_ENV === "development") {
    console.log(`[RESET LINK] ${resetUrl}`);
  }

  return sendSuccess(res, { devResetUrl: env.NODE_ENV === "development" ? resetUrl : undefined }, message);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetToken: hashed,
    resetExpires: { $gt: new Date() },
  }).select("+password +resetToken +resetExpires");

  if (!user) throw ApiError.badRequest("Reset token invalid or expired");

  user.password = await User.hashPassword(password);
  user.resetToken = undefined;
  user.resetExpires = undefined;
  await user.save();

  return sendSuccess(res, null, "Password reset successful. You can login now.");
});
