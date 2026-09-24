import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.js";
import { Budget } from "../models/Budget.js";
import { Tip } from "../models/Tip.js";
import { Notification } from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

function monthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

export const getDashboard = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const { start, end } = monthBounds();

  const [summary, topCategory, recentTx, pinnedTips, unreadNotifs, budgetRows] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      {S
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { userId, type: "expense", date: { $gte: start, $lt: end } } },
      { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    ]),
    Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(6)
      .populate("categoryId", "name type icon color"),
    Tip.find({ userId, status: "pinned" }).sort({ impactScore: -1 }).limit(3),
    Notification.find({ userId, read: false }).sort({ createdAt: -1 }).limit(10),
    Budget.aggregate([
      {
        $match: {
          userId,
          month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
        },
      },
      {
        $lookup: {
          from: "transactions",
          let: { catId: "$categoryId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$categoryId", "$$catId"] },
                    { $eq: ["$userId", userId] },
                    { $eq: ["$type", "expense"] },
                    { $gte: ["$date", start] },
                    { $lt: ["$date", end] },
                  ],
                },
              },
            },
            { $group: { _id: null, spent: { $sum: "$amount" } } },
          ],
          as: "spend",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryId: 1,
          limit: 1,
          month: 1,
          category: 1,
          spent: { $ifNull: [{ $arrayElemAt: ["$spend.spent", 0] }, 0] },
        },
      },
    ]),
  ]);

  const income = summary.find((s) => s._id === "income")?.total || 0;
  const expense = summary.find((s) => s._id === "expense")?.total || 0;

  const monthTrend = await Transaction.aggregate([
    {
      $match: {
        userId,
        date: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: {
          y: { $year: "$date" },
          m: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.y": 1, "_id.m": 1 } },
  ]);

  const trendMap = {};
  for (const row of monthTrend) {
    const key = `${row._id.y}-${String(row._id.m).padStart(2, "0")}`;
    if (!trendMap[key]) trendMap[key] = { month: key, income: 0, expense: 0 };
    trendMap[key][row._id.type] = row.total;
  }
  const trend = Object.values(trendMap).sort((a, b) => a.month.localeCompare(b.month));

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";

  return sendSuccess(res, {
    greeting,
    balance: income - expense,
    income,
    expense,
    topCategory: topCategory[0] || null,
    recentTransactions: recentTx,
    pinnedTips,
    notifications: unreadNotifs,
    budgets: budgetRows.map((b) => ({
      ...b,
      percentage: b.limit > 0 ? Math.min(100, Math.round((b.spent / b.limit) * 100)) : 0,
    })),
    trend,
    month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
  });
});
