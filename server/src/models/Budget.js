import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    limit: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, categoryId: 1, month: 1 }, { unique: true });

export const Budget = mongoose.model("Budget", budgetSchema);
