import { Transaction } from "../models/Transaction.js";
import { Category } from "../models/Category.js";
import { Budget } from "../models/Budget.js";
import { Notification } from "../models/Notification.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { checkBudgetAlerts } from "../services/budgetAlerts.js";
import { aiCategorize } from "../services/ai/categorize.js";
import { emitToUser } from "../config/socket.js";

export const listTransactions = asyncHandler(async (req, res) => {
  const { type, categoryId, from, to, q, page = 1, limit = 20 } = req.query;
  const filter = { userId: req.user.id };

  if (type) filter.type = type;
  if (categoryId) filter.categoryId = categoryId;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }
  if (q) filter.note = { $regex: q, $options: "i" };

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("categoryId", "name type icon color"),
    Transaction.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    transactions,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const createTransaction = asyncHandler(async (req, res) => {
  let { type, amount, categoryId, note, date, isRecurring, recurringDay, aiSuggested } = req.body;

  let usedAi = !!aiSuggested;

  // If no category provided, auto-suggest via AI
  if (!categoryId && note) {
    const cats = await Category.find({
      type,
      $or: [{ userId: req.user.id }, { userId: null }],
    }).select("name");
    const suggestion = await aiCategorize(
      note,
      type,
      cats.map((c) => c.name)
    );
    const match = cats.find((c) => c.name.toLowerCase() === suggestion.name.toLowerCase());
    if (match) {
      categoryId = match._id;
      usedAi = true;
    }
  }

  if (!categoryId) throw ApiError.badRequest("categoryId required");

  const category = await Category.findOne({
    _id: categoryId,
    $or: [{ userId: req.user.id }, { userId: null }],
  });
  if (!category) throw ApiError.notFound("Category not found");
  if (category.type !== type) throw ApiError.badRequest("Category type must match transaction type");

  const tx = await Transaction.create({
    userId: req.user.id,
    type,
    amount,
    categoryId,
    note: note || "",
    date: date || new Date(),
    isRecurring: !!isRecurring,
    recurringDay: recurringDay || undefined,
    aiSuggested: usedAi,
  });

  let alerts = [];
  if (type === "expense") {
    alerts = await checkBudgetAlerts(req.user.id, categoryId, date);
  }

  emitToUser(req.user.id, "tx:created", { id: tx._id });

  const populated = await tx.populate("categoryId", "name type icon color");
  return sendSuccess(res, { transaction: populated, alerts }, "Transaction added", 201);
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user.id });
  if (!tx) throw ApiError.notFound("Transaction not found");

  const { type, amount, categoryId, note, date, isRecurring, recurringDay } = req.body;

  if (categoryId) {
    const category = await Category.findOne({
      _id: categoryId,
      $or: [{ userId: req.user.id }, { userId: null }],
    });
    if (!category) throw ApiError.notFound("Category not found");
    if (categoryId.toString() !== tx.categoryId.toString()) {
      tx.userCorrectedCategory = true;
      tx.aiSuggested = false;
    }
    tx.categoryId = categoryId;
  }
  if (type) tx.type = type;
  if (amount !== undefined) tx.amount = amount;
  if (note !== undefined) tx.note = note;
  if (date) tx.date = date;
  if (isRecurring !== undefined) tx.isRecurring = isRecurring;
  if (recurringDay !== undefined) tx.recurringDay = recurringDay;

  await tx.save();

  let alerts = [];
  if (tx.type === "expense") {
    alerts = await checkBudgetAlerts(req.user.id, tx.categoryId, tx.date);
  }

  const populated = await tx.populate("categoryId", "name type icon color");
  return sendSuccess(res, { transaction: populated, alerts }, "Transaction updated");
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!tx) throw ApiError.notFound("Transaction not found");
  return sendSuccess(res, null, "Transaction deleted");
});

export const getTransaction = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user.id })
    .populate("categoryId", "name type icon color");
  if (!tx) throw ApiError.notFound("Transaction not found");
  return sendSuccess(res, { transaction: tx });
});

/** Bulk import (CSV) */
export const importTransactions = asyncHandler(async (req, res) => {
  const { rows } = req.body; // [{type, amount, categoryId, note, date}]
  if (!Array.isArray(rows) || rows.length === 0) {
    throw ApiError.badRequest("rows required");
  }

  const docs = rows
    .filter((r) => r.amount > 0 && r.categoryId)
    .map((r) => ({
      userId: req.user.id,
      type: r.type || "expense",
      amount: Number(r.amount),
      categoryId: r.categoryId,
      note: r.note || "",
      date: r.date ? new Date(r.date) : new Date(),
      aiSuggested: !!r.aiSuggested,
    }));

  const created = await Transaction.insertMany(docs, { ordered: false });

  // budget alerts for expense imports
  for (const tx of created) {
    if (tx.type === "expense") {
      await checkBudgetAlerts(req.user.id, tx.categoryId, tx.date);
    }
  }

  return sendSuccess(
    res,
    { imported: created.length, failed: rows.length - created.length },
    `Imported ${created.length} transactions`,
    201
  );
});
