import mongoose from "mongoose";

const insightSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    narrative: { type: String, required: true },
    flags: [{ type: String }],
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

insightSchema.index({ userId: 1, month: 1 }, { unique: true });

export const Insight = mongoose.model("Insight", insightSchema);
