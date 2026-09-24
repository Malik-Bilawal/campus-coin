import mongoose from "mongoose";
import crypto from "crypto";

const pendingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    academicYear: { type: String, default: "" },
    allowanceBaseline: { type: Number, default: 0, min: 0 },
    savingsGoal: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "BDT" },
    otpHash: { type: String, required: true, select: false },
    otpExpires: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

pendingSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 0 });

pendingSchema.statics.hashOtp = function (otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
};

pendingSchema.methods.verifyOtp = function (otp) {
  return this.otpHash === mongoose.model("PendingRegistration").hashOtp(otp);
};

export const PendingRegistration = mongoose.model("PendingRegistration", pendingSchema);
