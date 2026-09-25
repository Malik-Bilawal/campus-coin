import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    note: { type: String, trim: true, maxlength: 200, default: "" },
    date: { type: Date, required: true, default: Date.now },
    isRecurring: { type: Boolean, default: false },
    recurringDay: { type: Number, min: 1, max: 31 },
    aiSuggested: { type: Boolean, default: false },
    userCorrectedCategory: { type: Boolean, default: false },
    flags: [{ type: String, enum: ["duplicate", "unusually_large"] }],
    lastViewedAt: { type: Date },
    lastEditedAt: { type: Date },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
