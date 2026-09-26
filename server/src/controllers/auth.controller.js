import crypto from "crypto";
import { User } from "../models/User.js";
import { PendingRegistration } from "../models/PendingRegistration.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/token.js";
import { env } from "../config/env.js";
import { sendOtpEmail, sendResetEmail } from "../services/mail.service.js";

const REFRESH_COOKIE = "refreshToken";
const OTP_TTL_MS = 10 * 60 * 1000;

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

export const requestOtp = asyncHandler(async (req, res) => {
  const { name, email, password, academicYear, allowanceBaseline, savingsGoal, currency } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw ApiError.conflict("Email already registered");

  const otp = String(crypto.randomInt(100000, 1000000));
  const passwordHash = await User.hashPassword(password);
  const otpHash = PendingRegistration.hashOtp(otp);
  const otpExpires = new Date(Date.now() + OTP_TTL_MS);

  await PendingRegistration.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      academicYear: academicYear || "",
      allowanceBaseline: Number(allowanceBaseline) || 0,
      savingsGoal: Number(savingsGoal) || 0,
      currency: currency || "BDT",
      otpHash,
      otpExpires,
      attempts: 0,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Real email when SMTP is configured; otherwise keep the dev fallback
  const mail = await sendOtpEmail(email, otp, 10);
  // Dev console keeps the code for demos/E2E even when email delivery works
  if (env.NODE_ENV === "development") {
    console.log(`[OTP] ${email} → ${otp} (expires ${otpExpires.toISOString()})`);
  }

  return sendSuccess(
    res,
    {
      devOtp: !mail.sent && env.NODE_ENV === "development" ? otp : undefined,
      expiresInMin: 10,
    },
    "Verification code sent to your email"
  );
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const pending = await PendingRegistration.findOne({
    email: email.toLowerCase(),
  }).select("+otpHash");

  if (!pending) {
    throw ApiError.badRequest("No pending registration. Request a new verification code.");
  }
  if (!pending.otpExpires || pending.otpExpires < new Date()) {
    await PendingRegistration.deleteOne({ _id: pending._id });
    throw ApiError.badRequest("Verification code expired. Request a new one.");
  }
  if (pending.attempts >= 5) {
    await PendingRegistration.deleteOne({ _id: pending._id });
    throw ApiError.badRequest("Too many attempts. Start registration again.");
  }
  if (!pending.verifyOtp(otp)) {
    pending.attempts += 1;
    await pending.save({ validateBeforeSave: false });
    const left = 5 - pending.attempts;
    throw ApiError.badRequest(
      left > 0 ? `Invalid verification code. ${left} attempt(s) left.` : "Too many attempts."
    );
  }

  // Dry check only — the pending record and OTP stay valid for the final register call.
  return sendSuccess(res, null, "Email verified");
});

export const register = asyncHandler(async (req, res) => {
  const { email, otp, academicYear, allowanceBaseline, savingsGoal, currency } = req.body;

  const pending = await PendingRegistration.findOne({
    email: email.toLowerCase(),
  }).select("+otpHash");

  if (!pending) {
    throw ApiError.badRequest("No pending registration. Request a new verification code.");
  }
  if (!pending.otpExpires || pending.otpExpires < new Date()) {
    await PendingRegistration.deleteOne({ _id: pending._id });
    throw ApiError.badRequest("Verification code expired. Request a new one.");
  }
  if (pending.attempts >= 5) {
    await PendingRegistration.deleteOne({ _id: pending._id });
    throw ApiError.badRequest("Too many attempts. Start registration again.");
  }
  if (!pending.verifyOtp(otp)) {
    pending.attempts += 1;
    await pending.save({ validateBeforeSave: false });
    const left = 5 - pending.attempts;
    throw ApiError.badRequest(
      left > 0 ? `Invalid verification code. ${left} attempt(s) left.` : "Too many attempts."
    );
  }

  const user = await User.create({
    name: pending.name,
    email: pending.email,
    password: pending.password,
    // Money-profile fields are collected on the client's last step (after
    // request-otp), so accept them here and fall back to what request-otp stored.
    academicYear: academicYear ?? pending.academicYear,
    allowanceBaseline: allowanceBaseline ?? pending.allowanceBaseline,
    savingsGoal: savingsGoal ?? pending.savingsGoal,
    currency: currency ?? pending.currency,
  });

  await PendingRegistration.deleteOne({ _id: pending._id });

  const tokens = setAuthCookies(res, user._id, user.role, user.email);
  return sendSuccess(res, { user: user.toSafeJSON(), ...tokens }, "Account created", 201);
});

async function bumpLoginStreak(user) {
  const now = new Date();
  const last = user.lastLoginAt;
  const dayDiff = last ? Math.floor((now - last) / (1000 * 60 * 60 * 24)) : null;
  if (dayDiff === 1) user.loginStreak = (user.loginStreak || 0) + 1;
  else if (dayDiff === null || dayDiff > 1) user.loginStreak = 1;
  user.lastLoginAt = now;
  await user.save();
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) throw ApiError.unauthorized("Invalid email or password");
  if (!user.isActive) throw ApiError.forbidden("Account disabled. Contact admin.");

  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized("Invalid email or password");

  await bumpLoginStreak(user);

  const tokens = setAuthCookies(res, user._id, user.role, user.email);
  return sendSuccess(res, { user: user.toSafeJSON(), ...tokens }, "Logged in");
});

/** Admin-only login: same flow as login but requires role=admin (never reveals which check failed). */
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || user.role !== "admin") throw ApiError.unauthorized("Invalid email or password");
  if (!user.isActive) throw ApiError.forbidden("Account disabled. Contact admin.");

  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized("Invalid email or password");

  await bumpLoginStreak(user);

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
  const dev = env.NODE_ENV === "development";
  if (!user) return sendSuccess(res, dev ? { devAccountExists: false } : null, message);

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  user.resetExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;

  const mail = await sendResetEmail(user.email, resetUrl);

  if (!dev) return sendSuccess(res, null, message);

  // Dev-only helpers, and the raw link only when email delivery didn't happen
  const data = { devAccountExists: true };
  if (!mail.sent) {
    console.log(`[RESET LINK] ${resetUrl}`);
    data.devResetUrl = resetUrl;
  }
  return sendSuccess(res, data, message);
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
