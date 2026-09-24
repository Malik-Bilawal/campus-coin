import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    refModel: { type: String, enum: ["Tip", "Insight", "Transaction"], required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, default: "" },
    snippet: { type: String, default: "" },
  },
  { timestamps: true }
);

bookmarkSchema.index({ userId: 1, refModel: 1, refId: 1 }, { unique: true });

export const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
