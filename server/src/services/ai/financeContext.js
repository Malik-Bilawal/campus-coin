import mongoose from "mongoose";
import { Transaction } from "../../models/Transaction.js";
import { Budget } from "../../models/Budget.js";
import { User } from "../../models/User.js";
import { buildMonthStats } from "./insight.js";

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function daysInMonth(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export async function buildFinanceContext(userId) {
  const user = await User.findById(userId).lean();
  const now = new Date();
  const month = monthKey(now);
  const dayOfMonth = now.getDate();
  const dim = daysInMonth(month);
  const daysLeft = Math.max(1, dim - dayOfMonth + 1);

  const [stats, budgets] = await Promise.all([
    buildMonthStats(userId, month),
    Budget.find({ userId, month: month }).populate("categoryId", "name type icon color"),
  ]);

  const oid = new mongoose.Types.ObjectId(userId);
  const start = new Date(`${month}-01T00:00:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const [largeTx, recentTx] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          userId: oid,
          type: "expense",
          date: { $gte: start, $lt: end },
        },
      },
      { $sort: { amount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "cat",
        },
      },
      {
        $project: {
          amount: 1,
          note: 1,
          date: 1,
          category: { $arrayElemAt: ["$cat.name", 0] },
        },
      },
    ]),
    Transaction.find({ userId, date: { $gte: start, $lt: end } })
      .sort({ date: -1 })
      .limit(8)
      .populate("categoryId", "name")
      .select("type amount note date categoryId")
      .lean(),
  ]);

  const budgetRows = budgets.map((b) => {
    const spent =
      stats.byCategory.find((c) => c.name === b.categoryId?.name)?.total || 0;
    const limit = b.limit || 0;
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    return {
      category: b.categoryId?.name || "Unknown",
      limit,
      spent,
      remaining: limit - spent,
      pct,
      status: pct >= 100 ? "exceeded" : pct >= 80 ? "warning" : "ok",
    };
  });

  const income = stats.income || 0;
  const expense = stats.expense || 0;
  const saved = income - expense;
  const safeToSpend = Math.max(0, income - expense);
  const dailyBurn = expense / dayOfMonth;
  const projectedEom = dailyBurn * dim;
  const allowance = Number(user?.allowanceBaseline) || 0;
  const savingsGoal = Number(user?.savingsGoal) || 0;
  const goalProgress =
    savingsGoal > 0 ? Math.min(100, Math.round((Math.max(0, saved) / savingsGoal) * 100)) : 0;

  return {
    today: now.toISOString().slice(0, 10),
    month,
    dayOfMonth,
    daysInMonth: dim,
    daysLeft,
    profile: {
      name: user?.name || "Student",
      currency: user?.currency || "BDT",
      academicYear: user?.academicYear || "",
      allowanceBaseline: allowance,
      savingsGoal,
      goalProgress,
    },
    money: {
      income,
      expense,
      saved,
      safeToSpend,
      remainingThisMonth: safeToSpend,
      dailyBurn: Math.round(dailyBurn * 100) / 100,
      projectedEomExpense: Math.round(projectedEom),
      onTrackVsIncome: projectedEom <= income,
      burnVsAllowance:
        allowance > 0 ? Math.round((dailyBurn / (allowance / dim)) * 100) : null,
    },
    budgets: budgetRows,
    topCategories: stats.byCategory.slice(0, 8),
    flags: stats.flags || [],
    largestExpenses: largeTx.map((t) => ({
      amount: t.amount,
      note: t.note || "",
      category: t.category || "Other",
      date: t.date,
    })),
    recent: recentTx.map((t) => ({
      type: t.type,
      amount: t.amount,
      note: t.note || "",
      category: t.categoryId?.name || "",
      date: t.date,
    })),
  };
}

export function extractAmount(message) {
  const m = String(message).replace(/,/g, "");
  const patterns = [
    /(?:price|cost|rate|for|of|is)\s+(?:about\s+|around\s+|only\s+)?(?:bdt|usd|eur|tk|taka|\$|€)?\s*(\d+(?:\.\d+)?)\s*(k| thousand|k\b)?/i,
    /(?:bdt|usd|eur|tk|taka|\$|€)\s*(\d+(?:\.\d+)?)\s*(k)?/i,
    /(\d+(?:\.\d+)?)\s*(k|thousand)\s*(bdt|usd|eur|tk)?/i,
    /(?:buy|purchase|get|order|rent|pay)\s+[^?]{0,40}?(\d+(?:\.\d+)?)\s*(k)?/i,
  ];
  for (const re of patterns) {
    const match = m.match(re);
    if (match) {
      let n = parseFloat(match[1]);
      if (!Number.isFinite(n) || n <= 0) continue;
      if (match[2] && /k|thousand/i.test(match[2])) n *= 1000;
      if (n > 0 && n < 1) continue;
      return n;
    }
  }
  return null;
}

export function detectIntent(message) {
  const lower = String(message || "").toLowerCase();
  const intents = [];

  const purchaseRe =
    /\b(should i|can i|afford|buy|purchase|get a|get the|order|rent|upgrade|replace| invest in|spend on)\b|\b(phone|laptop|iphone|android|headphone|earbuds|shoes|jacket|course|bike|car|gpu|monitor|tablet|ps5|switch|camera|watch)\b/;
  if (purchaseRe.test(lower)) intents.push("purchase");

  if (/\b(buy|purchase|afford|price|cost of|should i get)\b/.test(lower) && extractAmount(message) != null) {
    if (!intents.includes("purchase")) intents.push("purchase");
  }
  if (/\bhow much\b|\bspent\b|\bspending\b|\bbalance\b|\bsave[sd]?\b|\bleft\b|\bremain/.test(lower)) {
    intents.push("spending");
  }
  if (/\bbudget\b|\bcap\b|\blimit\b/.test(lower)) intents.push("budget");
  if (/\bgoal\b|\bsaving goal\b|\bsave for\b/.test(lower)) intents.push("goal");
  if (/\btip\b|\badvice\b|\bimprove\b|\bcut\b|\breduce\b|\bhelp me save\b/.test(lower)) {
    intents.push("advice");
  }
  if (/\bforecast\b|\bnext month\b|\bproject\b|\bwill i\b/.test(lower)) intents.push("forecast");

  return intents;
}

export function rulePurchaseAdvice(ctx, amount, message) {
  const cur = ctx.profile.currency;
  const safe = ctx.money.safeToSpend;
  const dailyBurn = ctx.money.dailyBurn;
  const daysLeft = ctx.daysLeft;
  const lower = String(message).toLowerCase();

  const essentialRe =
    /\b(laptop|tablet|textbook|book|tuition|exam|course|medic|glasses|repair|hostel|rent|bus pass|metro)\b/;
  const discretionaryRe =
    /\b(shoes|jacket|headphone|earbud|game|ps5|switch|camera|watch|perfume|makeup|party|trip)\b/;

  const isEssential = essentialRe.test(lower);
  const isDiscretionary = discretionaryRe.test(lower) && !isEssential;

  if (amount == null) {
    return {
      verdict: "Need price",
      body: `I can advise better if you share the price (e.g. "phone 25000"). Right now you have about ${safe.toFixed(0)} ${cur} left this month with ${daysLeft} days to go (daily burn ~${dailyBurn.toFixed(0)} ${cur}).`,
      source: "rules",
    };
  }

  const after = safe - amount;
  const essentialCover = amount <= safe * 0.9;
  const stretch = amount > safe && amount <= safe + dailyBurn * daysLeft * 0.15;
  const overBudgetCat = ctx.budgets.find((b) => b.status !== "ok" && amount > Math.max(0, b.remaining));
  const goalHitSoon = ctx.profile.savingsGoal > 0 && ctx.profile.goalProgress < 50;

  let verdict;
  let body;

  if (amount <= safe * 0.3 && !isDiscretionary) {
    verdict = "Yes — go for it";
    body = `Price ${amount.toFixed(0)} ${cur} fits comfortably. You still have ~${after.toFixed(0)} ${cur} after the purchase (${daysLeft} days left). ${
      isEssential ? "If it's needed for study/living, buy without guilt." : "Looks reasonable against your current month."
    }`;
  } else if (amount <= safe * 0.5) {
    verdict = "Yes, with a check";
    body = `${amount.toFixed(0)} ${cur} is about ${Math.round((amount / Math.max(safe, 1)) * 100)}% of your remaining ${safe.toFixed(0)} ${cur}. After buying you'd have ~${after.toFixed(0)} ${cur} for ${daysLeft} days (~${(
      after / daysLeft
    ).toFixed(0)} ${cur}/day). ${
      isEssential
        ? "Worth it if essential."
        : "Fine if this isn't stacking on other big spends this week."
    }`;
  } else if (amount <= safe * 0.85) {
    verdict = "Wait or stage it";
    body = `That's ${Math.round((amount / Math.max(safe, 1)) * 100)}% of your free money (${safe.toFixed(0)} ${cur}). After it: ~${after.toFixed(0)} ${cur} for ${daysLeft} days = ~${(
      after / daysLeft
    ).toFixed(0)} ${cur}/day${
      dailyBurn > 0 ? ` vs your usual ~${dailyBurn.toFixed(0)} ${cur}/day` : ""
    }. ${isEssential ? "If essential, look for student discount / EMI." : "Consider waiting for sale or next allowance."}`;
  } else if (stretch) {
    verdict = "Not this month";
    body = `${amount.toFixed(0)} ${cur} exceeds your remaining ${safe.toFixed(0)} ${cur}. You'd be ~${Math.abs(after).toFixed(0)} ${cur} short before month-end. ${
      isEssential ? "Delay until next income, or cut one flexible category this week first." : "Push this purchase to next month after allowance hits."
    }`;
  } else {
    verdict = "No — too tight";
    body = `Price ${amount.toFixed(0)} ${cur} vs remaining ${safe.toFixed(0)} ${cur} with only ${daysLeft} days left (burn ~${dailyBurn.toFixed(
      0
    )} ${cur}/day). ${
      goalHitSoon
        ? `Your savings goal is only ${ctx.profile.goalProgress}% done — buying now would delay it.`
        : "This would push you over before month-end."
    } ${
      ctx.flags[0] ? `Also: ${ctx.flags[0]}.` : ""
    } Tip: wait for income day or sell/trim one discretionary category first.`;
  }

  if (overBudgetCat && verdict.startsWith("Yes")) {
    body += ` Note: ${overBudgetCat.category} budget is already ${overBudgetCat.pct}% used — don't charge this purchase there.`;
  }
  if (ctx.money.projectedEomExpense > ctx.money.income && ctx.money.income > 0) {
    body += ` Trend: at current pace you'd spend ~${ctx.money.projectedEomExpense} ${cur} vs income ${ctx.money.income} ${cur}.`;
  }

  return { verdict, body, source: "rules" };
}

export function ruleSpendingAnswer(ctx) {
  const cur = ctx.profile.currency;
  const top = ctx.topCategories[0];
  const lines = [
    `This month (${ctx.month}): income ${ctx.money.income.toFixed(0)} ${cur}, spent ${ctx.money.expense.toFixed(0)} ${cur}, ${
      ctx.money.saved >= 0 ? `saved ${ctx.money.saved.toFixed(0)}` : `over by ${Math.abs(ctx.money.saved).toFixed(0)}`
    } ${cur}.`,
    `Left for ${ctx.daysLeft} days: ~${ctx.money.safeToSpend.toFixed(0)} ${cur} (≈${ctx.money.dailyBurn.toFixed(0)} ${cur}/day).`,
  ];
  if (top) lines.push(`Top category: ${top.name} ${top.total.toFixed(0)} ${cur}.`);
  if (ctx.budgets.length) {
    const tight = ctx.budgets.filter((b) => b.status !== "ok").slice(0, 3);
    if (tight.length) {
      lines.push(
        `Budget watch: ${tight.map((b) => `${b.category} ${b.pct}%`).join(", ")}.`
      );
    }
  }
  if (ctx.flags[0]) lines.push(`Flag: ${ctx.flags[0]}.`);
  return lines.join(" ");
}

export function ruleForecast(ctx) {
  const cur = ctx.profile.currency;
  const pace = ctx.money.projectedEomExpense;
  const diff = ctx.money.income - pace;
  return `At your current pace (${ctx.money.dailyBurn.toFixed(0)} ${cur}/day), ${ctx.month} ends near ${pace.toFixed(0)} ${cur} ${
    diff >= 0
      ? `vs income ${ctx.money.income.toFixed(0)} ${cur} — on track to keep ~${diff.toFixed(0)} ${cur}.`
      : `vs income ${ctx.money.income.toFixed(0)} ${cur} — you'd be ~${Math.abs(diff).toFixed(0)} ${cur} short. Cut ~${(
          Math.abs(diff) / ctx.daysLeft
        ).toFixed(0)} ${cur}/day for the remaining ${ctx.daysLeft} days.`
  }`;
}
