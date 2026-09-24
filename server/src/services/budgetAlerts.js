import { Budget } from "../models/Budget.js";
import { Transaction } from "../models/Transaction.js";
import { Notification } from "../models/Notification.js";
import { Category } from "../models/Category.js";

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function checkBudgetAlerts(userId, categoryId, date) {
  try {
    const d = date ? new Date(date) : new Date();
    const month = monthKey(d);
    const start = new Date(`${month}-01T00:00:00`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const budget = await Budget.findOne({ userId, categoryId, month }).populate(
      "categoryId",
      "name"
    );
    if (!budget || budget.limit <= 0) return [];

    const agg = await Transaction.aggregate([
      {
        $match: {
          userId: budget.userId,
          categoryId: budget.categoryId._id,
          type: "expense",
          date: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: null, spent: { $sum: "$amount" } } },
    ]);

    const spent = agg[0]?.spent || 0;
    const pct = (spent / budget.limit) * 100;
    const catName = budget.categoryId?.name || "Category";

    const alerts = [];
    if (pct >= 100) {
      const msg = `🚨 ${catName} budget exceeded! Spent ${spent.toFixed(0)} / ${budget.limit.toFixed(0)}`;
      alerts.push({ level: "exceeded", message: msg, percentage: 100 });
      await Notification.create({ userId, type: "budget_alert", message: msg });
    } else if (pct >= 80) {
      const msg = `⚠️ ${catName} budget at ${Math.round(pct)}% (${spent.toFixed(0)} / ${budget.limit.toFixed(0)})`;
      alerts.push({ level: "warning", message: msg, percentage: Math.round(pct) });
      await Notification.create({ userId, type: "budget_alert", message: msg });
    }

    return alerts;
  } catch (e) {
    console.error("Budget alert error:", e.message);
    return [];
  }
}
