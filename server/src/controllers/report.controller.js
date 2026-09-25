import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

function parseMonth(s) {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return { start, end, key: s };
}

export const categoryReport = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const parsed = parseMonth(req.query.month);
  const { start, end } = parsed || (() => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  })();

  const rows = await Transaction.aggregate([
    { $match: { userId, type: "expense", date: { $gte: start, $lt: end } } },
    { $group: { _id: "$categoryId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        total: 1,
        count: 1,
        name: "$category.name",
        color: "$category.color",
        icon: "$category.icon",
      },
    },
  ]);

  const totalExpense = rows.reduce((s, r) => s + r.total, 0);
  return sendSuccess(res, { rows, totalExpense, month: parsed?.key || "current" });
});

export const sixMonthTrend = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await Transaction.aggregate([
    { $match: { userId, date: { $gte: since } } },
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

  const map = {};
  for (const r of rows) {
    const key = `${r._id.y}-${String(r._id.m).padStart(2, "0")}`;
    if (!map[key]) map[key] = { month: key, income: 0, expense: 0 };
    map[key][r._id.type] = r.total;
  }

  const trend = Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  return sendSuccess(res, { trend });
});

export const dailyWeeklySummary = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const daily = await Transaction.aggregate([
    { $match: { userId, type: "expense", date: { $gte: monthStart } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const weekly = await Transaction.aggregate([
    { $match: { userId, type: "expense", date: { $gte: monthStart } } },
    {
      $group: {
        _id: { $isoWeek: "$date" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return sendSuccess(res, {
    daily: daily.map((d) => ({ date: d._id, total: d.total, count: d.count })),
    weekly: weekly.map((w) => ({ week: w._id, total: w.total, count: w.count })),
  });
});

/** Linear (least-squares) projection of next month's expense from up to 6 past months. */
export const forecastReport = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const rows = await Transaction.aggregate([
    { $match: { userId, type: "expense", date: { $gte: since } } },
    { $group: { _id: { y: { $year: "$date" }, m: { $month: "$date" } }, total: { $sum: "$amount" } } },
    { $sort: { "_id.y": 1, "_id.m": 1 } },
  ]);

  const series = rows.map((r) => ({
    month: `${r._id.y}-${String(r._id.m).padStart(2, "0")}`,
    total: Math.round(r.total * 100) / 100,
  }));

  let projected = series.length ? series[series.length - 1].total : 0;
  let method = "last_month";

  if (series.length >= 3) {
    const pts = series.slice(-6);
    const n = pts.length;
    const xs = pts.map((_, i) => i);
    const ys = pts.map((p) => p.total);
    const sumX = xs.reduce((a, x) => a + x, 0);
    const sumY = ys.reduce((a, y) => a + y, 0);
    const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
    const sumXX = xs.reduce((a, x) => a + x * x, 0);
    const denom = n * sumXX - sumX * sumX;
    const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    projected = Math.max(0, Math.round((intercept + slope * n) * 100) / 100);
    method = "linear_trend";
  } else if (series.length === 2) {
    projected = Math.max(0, Math.round(((series[0].total + series[1].total) / 2) * 100) / 100);
    method = "average";
  } else if (series.length === 0) {
    method = "no_data";
  }

  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const forecastMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;

  return sendSuccess(res, {
    series,
    forecastMonth,
    projectedExpense: Math.round(projected),
    method,
  });
});

export const filteredReport = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const { from, to, type, categoryId } = req.query;

  const match = { userId };
  if (type) match.type = type;
  if (categoryId) match.categoryId = new mongoose.Types.ObjectId(categoryId);
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      match.date.$lte = end;
    }
  }

  const [byCategory, totals, list] = await Promise.all([
    Transaction.aggregate([
      { $match: match },
      { $group: { _id: { cat: "$categoryId", type: "$type" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      {
        $lookup: {
          from: "categories",
          localField: "_id.cat",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    ]),
    Transaction.aggregate([
      { $match: match },
      { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Transaction.find(match).sort({ date: -1 }).limit(200).populate("categoryId", "name color icon type"),
  ]);

  return sendSuccess(res, { byCategory, totals, transactions: list });
});
