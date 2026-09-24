import mongoose from "mongoose";

const tipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 500 },
    impactScore: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "dismissed", "pinned"], default: "active" },
    category: { type: String, default: "general" },
  },
  { timestamps: true }
);

tipSchema.index({ userId: 1, status: 1, impactScore: -1 });

export const Tip = mongoose.model("Tip", tipSchema);
