import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    academicYear: { type: String, default: "" },
    allowanceBaseline: { type: Number, default: 0, min: 0 },
    savingsGoal: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "BDT" },
    theme: { type: String, enum: ["light", "dark"], default: "dark" },
    fontSize: { type: String, enum: ["sm", "md", "lg"], default: "md" },
    resetToken: { type: String, select: false },
    resetExpires: { type: Date, select: false },
    isActive: { type: Boolean, default: true },
    loginStreak: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.statics.hashPassword = async function (password) {
  return bcrypt.hash(password, 12);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    academicYear: this.academicYear,
    allowanceBaseline: this.allowanceBaseline,
    savingsGoal: this.savingsGoal,
    currency: this.currency,
    theme: this.theme,
    fontSize: this.fontSize,
    isActive: this.isActive,
    loginStreak: this.loginStreak,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model("User", userSchema);
