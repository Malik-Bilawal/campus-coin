import mongoose from "mongoose";
import { Budget } from "../models/Budget.js";
import { Category } from "../models/Category.js";
import { Transaction } from "../models/Transaction.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

function monthString(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const listBudgets = asyncHandler(async (req, res) => {
  const month = req.query.month || monthString();

  const budgets = await Budget.find({ userId: req.user.id, month })
    .populate("categoryId", "name type icon color")
    .sort({ limit: -1 });

  const start = new Date(`${month}-01T00:00:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const spends = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(req.user.id),
        type: "expense",
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: "$categoryId", spent: { $sum: "$amount" } } },
  ]);

  const spendMap = Object.fromEntries(spends.map((s) => [String(s._id), s.spent]));

  const data = budgets.map((b) => {
    const spent = spendMap[String(b.categoryId?._id || b.categoryId)] || 0;
    const pct = b.limit > 0 ? Math.min(100, Math.round((spent / b.limit) * 100)) : 0;
    return { ...b.toObject(), spent, percentage: pct };
  });

  return sendSuccess(res, { budgets: data, month });
});

export const upsertBudget = asyncHandler(async (req, res) => {
  const { categoryId, month, limit } = req.body;
  const m = month || monthString();

  const category = await Category.findOne({
    _id: categoryId,
    $or: [{ userId: req.user.id }, { userId: null }],
  });
  if (!category) throw ApiError.notFound("Category not found");

  const budget = await Budget.findOneAndUpdate(
    { userId: req.user.id, categoryId, month: m },
    { limit, userId: req.user.id, categoryId, month: m },
    { new: true, upsert: true, runValidators: true }
  ).populate("categoryId", "name type icon color");

  return sendSuccess(res, { budget }, "Budget saved", 201);
});

export const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!budget) throw ApiError.notFound("Budget not found");
  return sendSuccess(res, null, "Budget deleted");
});
