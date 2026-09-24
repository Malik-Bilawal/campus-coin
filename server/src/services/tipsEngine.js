import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.js";
import { Budget } from "../models/Budget.js";
import { Tip } from "../models/Tip.js";

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

export async function generateTips(userId) {
  const oid = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevStart = monthsAgo(1);
  const prevEnd = monthStart;

  const [byCategoryThis, byCategoryPrev, budgets, savings] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId: oid, type: "expense", date: { $gte: monthStart } } },
      { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
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
    ]),
    Transaction.aggregate([
      { $match: { userId: oid, type: "expense", date: { $gte: prevStart, $lt: prevEnd } } },
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
    ]),
    Budget.find({ userId, month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` })
      .populate("categoryId", "name"),
    Transaction.aggregate([
      {
        $match: {
          userId: oid,
          date: { $gte: monthsAgo(3) },
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const prevMap = Object.fromEntries(byCategoryPrev.map((r) => [String(r._id), r.total]));
  const tips = [];

  for (const row of byCategoryThis.slice(0, 5)) {
    const name = row.cat?.name || "Category";
    const prev = prevMap[String(row._id)] || 0;

    if (prev > 0 && row.total > prev * 1.2) {
      const rise = Math.round(((row.total - prev) / prev) * 100);
      tips.push({
        title: `${name} spending is up ${rise}%`,
        body: `You spent more on ${name} this month vs last. Try a weekly cap to bring it back near ${prev.toFixed(0)}.`,
        impactScore: Math.min(100, rise),
        category: name,
      });
    }

    if (row.total > 0) {
      tips.push({
        title: `Top spend: ${name}`,
        body: `${name} is your biggest expense this month at ${row.total.toFixed(0)}. Small cuts here save the most.`,
        impactScore: Math.min(90, Math.round(row.total / 100)),
        category: name,
      });
    }
  }

  for (const b of budgets) {
    if (!b.categoryId) continue;
    const spendRow = byCategoryThis.find((r) => String(r._id) === String(b.categoryId._id));
    const spent = spendRow?.total || 0;
    if (b.limit > 0 && spent > b.limit * 0.7) {
      const left = Math.max(0, b.limit - spent);
      tips.push({
        title: `${b.categoryId.name} budget nearly used`,
        body: `Only ${left.toFixed(0)} left of your ${b.limit.toFixed(0)} ${b.categoryId.name} budget this month.`,
        impactScore: 85,
        category: b.categoryId.name,
      });
    }
  }

  const income = savings.find((s) => s._id === "income")?.total || 0;
  const expense = savings.find((s) => s._id === "expense")?.total || 0;
  if (income > 0) {
    const saveRate = ((income - expense) / income) * 100;
    if (saveRate < 20) {
      tips.push({
        title: "Savings rate below 20%",
        body: `You're saving only ${Math.round(saveRate)}% of income. Aim to keep at least 20% for your savings goal.`,
        impactScore: 95,
        category: "savings",
      });
    } else {
      tips.push({
        title: `Great! You saved ${Math.round(saveRate)}%`,
        body: "Keep this rate up to hit your savings goal faster.",
        impactScore: 40,
        category: "savings",
      });
    }
  }

  tips.sort((a, b) => b.impactScore - a.impactScore);
  const top = tips.slice(0, 6);

  if (top.length > 0) {
    const existingPinned = await Tip.find({ userId, status: { $in: ["pinned", "dismissed"] } });
    const skipTitles = new Set(existingPinned.map((t) => t.title));

    for (const t of top) {
      if (skipTitles.has(t.title)) continue;
      await Tip.findOneAndUpdate(
        { userId, title: t.title },
        { ...t, userId, status: "active" },
        { upsert: true, new: true }
      );
    }
  }

  return top.length;
}
