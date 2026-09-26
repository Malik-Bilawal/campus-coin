import mongoose from "mongoose";
import { Transaction } from "../../models/Transaction.js";
import { Budget } from "../../models/Budget.js";
import { Insight } from "../../models/Insight.js";
import { llmChat, parseJsonLoose, stripMarkdown } from "./provider.js";

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
Plain text only — no markdown, no **, no headings, no disclaimer boilerplate.`;

/** One concrete, stats-derived action the student can take next month. */
function deriveAdvice(stats) {
  if (!stats.byCategory || stats.byCategory.length === 0) {
    return "No expenses logged this month — add a few transactions to unlock personalized advice.";
  }
  const top = stats.byCategory[0];
  if (stats.saved < 0) {
    return `You spent ${Math.abs(stats.saved).toFixed(0)} more than you earned. Cap ${top.name} (your top category at ${top.total.toFixed(0)}) next week to get back on track.`;
  }
  if (stats.flags && stats.flags.length) {
    return `Fix this first: ${stats.flags[0]}. Trim ${top.name} spending to protect the ${stats.saved.toFixed(0)} you saved.`;
  }
  const saveRate = stats.income > 0 ? Math.round((stats.saved / stats.income) * 100) : 0;
  if (saveRate < 20) {
    return `Aim to save at least 20% of income — you're at ${saveRate}%. Small cuts in ${top.name} can close the gap.`;
  }
  return `Solid month with ${saveRate}% saved. Keep ${top.name} steady and move the surplus into your savings goal.`;
}

/** Stats-derived narrative used whenever the LLM can't produce one. */
function ruleNarrative(stats, monthKey) {
  if (stats.byCategory.length === 0) {
    return `No expenses logged in ${monthKey}. Add transactions to unlock your monthly insight.`;
  }
  const top = stats.byCategory[0];
  return `In ${monthKey} you spent ${stats.expense.toFixed(0)} and earned ${stats.income.toFixed(0)} ${
    stats.saved >= 0 ? `, saving ${stats.saved.toFixed(0)}` : `, going over by ${Math.abs(stats.saved).toFixed(0)}`
  }. Top category: ${top?.name || "n/a"} at ${top?.total?.toFixed(0) || 0}.${
    stats.flags[0] ? ` Note: ${stats.flags[0]}.` : ""
  } Try capping that category next week.`;
}

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
    narrative = stripMarkdown(content.trim());
    if (!narrative) throw new Error("empty LLM reply");
    provider = p;
  } catch {
    narrative = ruleNarrative(stats, monthKey);
    provider = "rules";
  }

  const advice = deriveAdvice(stats);

  const insight = await Insight.findOneAndUpdate(
    { userId, month: monthKey },
    {
      userId,
      month: monthKey,
      narrative,
      advice,
      flags: stats.flags,
      meta: { ...stats, provider },
    },
    { new: true, upsert: true }
  );
  return insight;
}

export async function listInsights(userId) {
  const insights = await Insight.find({ userId }).sort({ month: -1 }).limit(12);
  // Backfill advice for insights generated before the advice field existed
  for (const i of insights) {
    if (!i.advice && i.meta) {
      i.advice = deriveAdvice(i.meta);
      await i.save({ validateBeforeSave: false });
    }
  }
  return insights;
}
