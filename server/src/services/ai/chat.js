import { buildMonthStats } from "./insight.js";
import { llmChat } from "./provider.js";
import { User } from "../../models/User.js";

const FAQ = [
  {
    keys: ["how", "budget", "set"],
    answer:
      "Go to Budgets → New budget. Pick a category and monthly limit. You'll get live progress bars and alerts at 80% and 100%.",
  },
  {
    keys: ["export", "pdf", "download"],
    answer: "Open Reports and click Export PDF. It saves a copy of your monthly report instantly.",
  },
  {
    keys: ["recurring", "subscription", "every month"],
    answer: "When adding a transaction, toggle Recurring and set the day of month (1–31).",
  },
  {
    keys: ["category", "custom"],
    answer: "Categories page → New category. You can add personal income/expense categories anytime.",
  },
  {
    keys: ["streak", "habit"],
    answer: "Log in and add transactions daily to grow your streak — it shows on your profile.",
  },
  {
    keys: ["ai", "categor", "smart"],
    answer:
      "As you type a note, Campus Coin can suggest a category (AI badge). You can always override it.",
  },
  {
    keys: ["currency", "bdt", "dollar"],
    answer: "Profile → Currency. Switch between BDT, USD, EUR and more.",
  },
  {
    keys: ["forgot", "password", "reset"],
    answer: "Use Forgot password on the login page. In dev, the reset link appears on screen.",
  },
];

function matchFaq(message) {
  const lower = message.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const item of FAQ) {
    const score = item.keys.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return bestScore > 0 ? best.answer : null;
}

async function personalAnswer(userId, message) {
  const user = await User.findById(userId);
  const lower = message.toLowerCase();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const stats = await buildMonthStats(userId, monthKey);

  const wantsMoney =
    /spen|spent|cost|how much|balance|save|saved|afford|left|budget|income|expense|food|top/.test(
      lower
    );

  if (!wantsMoney) return null;

  try {
    const { content } = await llmChat(
      [
        {
          role: "system",
          content:
            "You are BudgetBee. Answer the student's money question using ONLY the JSON stats provided. Be concise (2-4 sentences). Friendly. Advisory only.",
        },
        {
          role: "user",
          content: `Question: ${message}\nName: ${user?.name}\nSavings goal: ${user?.savingsGoal}\nStats: ${JSON.stringify(
            {
              month: stats.month,
              income: stats.income,
              expense: stats.expense,
              saved: stats.saved,
              categories: stats.byCategory.slice(0, 8),
              flags: stats.flags,
            }
          )}`,
        },
      ],
      { temperature: 0.4, maxTokens: 350, timeoutMs: 10000 }
    );
    return content.trim();
  } catch {
    const top = stats.byCategory[0];
    return `This month (${monthKey}): income ${stats.income.toFixed(0)}, spent ${stats.expense.toFixed(0)}, ${
      stats.saved >= 0 ? `saved ${stats.saved.toFixed(0)}` : `over by ${Math.abs(stats.saved).toFixed(0)}`
    }.${top ? ` Top category ${top.name} (${top.total.toFixed(0)}).` : ""}`;
  }
}

export async function aiChat(userId, message, history = []) {
  const faq = matchFaq(message);
  const personal = await personalAnswer(userId, message);

  if (personal) {
    return { reply: personal, source: "ai-personal" };
  }
  if (faq) {
    return { reply: faq, source: "faq" };
  }

  try {
    const messages = [
      {
        role: "system",
        content:
          "You are BudgetBee inside Campus Coin, a student budget app. Answer briefly (1-3 sentences). If asked about features not built, say so honestly. Advisory only.",
      },
      ...history.slice(-6).map((h) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: h.content,
      })),
      { role: "user", content: message },
    ];
    const { content } = await llmChat(messages, { temperature: 0.5, maxTokens: 300, timeoutMs: 10000 });
    return { reply: content.trim(), source: "ai" };
  } catch {
    return {
      reply:
        "I can help with budgets, categories, reports, and your spending summary. Try: “How much did I spend on food?” or “How do I set a budget?”",
      source: "fallback",
    };
  }
}
