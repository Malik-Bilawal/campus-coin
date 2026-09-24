import mongoose from "mongoose";
import { Transaction } from "../../models/Transaction.js";
import { Budget } from "../../models/Budget.js";
import { Insight } from "../../models/Insight.js";
import { llmChat, parseJsonLoose } from "./provider.js";

function monthBounds(key) {
  const [y, m] = key.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { start, end };
}

export async function buildMonthStats(userId, monthKey) {
  const oid = new mongoose.Types.ObjectId(userId);
  const { start, end } = monthBounds(monthKey);
  const prevDate = new Date(start);
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevEnd = start;

  const [byType, byCategory, prevByCategory, budgets] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId: oid, date: { $gte: start, $lt: end } } },
      { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { userId: oid, type: "expense", date: { $gte: start, $lt: end } } },
      { $group: { _id: "$categoryId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "cat",
        },
      },
      { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          total: 1,
          count: 1,
          name: "$cat.name",
          color: "$cat.color",
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { userId: oid, type: "expense", date: { $gte: prevDate, $lt: prevEnd } } },
      { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "cat",
        },
      },
      { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
      { $project: { total: 1, name: "$cat.name" } },
    ]),
    Budget.find({ userId, month: monthKey }).populate("categoryId", "name"),
  ]);

  const income = byType.find((r) => r._id === "income")?.total || 0;
  const expense = byType.find((r) => r._id === "expense")?.total || 0;

  const flags = [];
  const prevMap = Object.fromEntries(prevByCategory.map((r) => [r.name, r.total]));
  for (const row of byCategory) {
    const prev = prevMap[row.name] || 0;
    if (prev > 0 && row.total > prev * 1.2) {
      const rise = Math.round(((row.total - prev) / prev) * 100);
      flags.push(`${row.name} spending rose ${rise}% vs last month`);
    }
  }

  const budgetFlags = [];
  for (const b of budgets) {
    const spend = byCategory.find((c) => String(c._id) === String(b.categoryId?._id));
    if (b.limit > 0 && spend && spend.total > b.limit) {
      budgetFlags.push(`${b.categoryId?.name || "Category"} exceeded budget`);
    }
  }

  return {
    month: monthKey,
    income,
    expense,
    saved: income - expense,
    byCategory: byCategory.map((c) => ({
      name: c.name || "Other",
      total: c.total,
      count: c.count,
    })),
    flags: [...flags, ...budgetFlags],
    budgetCount: budgets.length,
  };
}

const SYSTEM = `You are BudgetBee, a friendly student finance assistant for Campus Coin.
Write a short plain-language monthly spending insight (3-5 sentences).
Highlight patterns, flag big increases, and give ONE simple actionable tip.
Tone: warm, encouraging, not judgmental. Currency amounts as numbers only.
No markdown headings. No disclaimer boilerplate.`;

export async function generateInsight(userId, monthKey, force = false) {
  const existing = await Insight.findOne({ userId, month: monthKey });
  if (existing && !force) return existing;

  const stats = await buildMonthStats(userId, monthKey);

  let narrative = "";
  let provider = "rules";

  try {
    const { content, provider: p } = await llmChat(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            month: monthKey,
            income: stats.income,
            expense: stats.expense,
            saved: stats.saved,
            topCategories: stats.byCategory.slice(0, 6),
            flags: stats.flags,
          }),
        },
      ],
      { temperature: 0.5, maxTokens: 400, timeoutMs: 12000 }
    );
    narrative = content.trim();
    provider = p;
  } catch {
    const top = stats.byCategory[0];
    narrative =
      stats.byCategory.length === 0
        ? `No expenses logged in ${monthKey}. Add transactions to unlock your monthly insight.`
        : `In ${monthKey} you spent ${stats.expense.toFixed(0)} and earned ${stats.income.toFixed(0)} ${
            stats.saved >= 0 ? `, saving ${stats.saved.toFixed(0)}` : `, going over by ${Math.abs(stats.saved).toFixed(0)}`
          }. Top category: ${top?.name || "n/a"} at ${top?.total?.toFixed(0) || 0}.${
            stats.flags[0] ? ` Note: ${stats.flags[0]}.` : ""
          } Try capping that category next week.`;
    provider = "rules";
  }

  const insight = await Insight.findOneAndUpdate(
    { userId, month: monthKey },
    {
      userId,
      month: monthKey,
      narrative,
      flags: stats.flags,
      meta: { ...stats, provider },
    },
    { new: true, upsert: true }
  );
  return insight;
}

export async function listInsights(userId) {
  return Insight.find({ userId }).sort({ month: -1 }).limit(12);
}
