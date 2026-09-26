import { buildMonthStats } from "./insight.js";
import { llmChat, stripMarkdown } from "./provider.js";
import { User } from "../../models/User.js";
import {
  buildFinanceContext,
  detectIntent,
  extractAmount,
  rulePurchaseAdvice,
  ruleSpendingAnswer,
  ruleForecast,
} from "./financeContext.js";

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
  {
    keys: ["import", "csv", "upload"],
    answer: "Transactions → CSV import. Upload, optionally AI-categorize, then confirm import.",
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
  return bestScore >= 2 || (bestScore === 1 && best.keys[0].length > 6)
    ? best.answer
    : null;
}

function smalltalkReply(message) {
  const m = String(message).trim().toLowerCase();
  if (/^(thanks|thank you|thankyou|ty|cheers|jazak|shukriya)/.test(m)) {
    return "Anytime 🐝 Small daily checks keep big surprises away — come back whenever.";
  }
  if (/^(bye|goodbye|see ya|good night|gn)/.test(m)) {
    return "See you! Log today's spending to keep your streak alive 💪";
  }
  if (/^how (are|r) (you|u)/.test(m)) {
    return "Running smooth and buzzing 🐝 — more importantly, how's your budget this month? Ask me anything about your spending.";
  }
  return "Hey! I'm BudgetBee 🐝 — I advise on purchases, budgets, spending and goals using your real numbers. Try:\n• Should I buy a phone for 25000 this month?\n• How much can I spend today?\n• Where did my money go?\n• Am I on track for my savings goal?";
}

function matchSmalltalk(message) {
  const re =
    /^(?:hi|hii+|hello|hey|yo|sup|hola|salam|asalam(?:ualaikum)?|assalamualaikum|good\s*(?:morning|afternoon|evening)|how\s*(?:are|r)\s*(?:you|u)|thanks?|thank\s*you|thankyou|ty|cheers|shukriya|jazakallah|bye+|goodbye|see\s*ya|good\s*night|gn)[.!?\s]*$/i;
  return re.test(String(message).trim()) ? smalltalkReply(message) : null;
}

function compactCtx(ctx) {
  return {
    today: ctx.today,
    month: ctx.month,
    daysLeft: ctx.daysLeft,
    name: ctx.profile.name,
    currency: ctx.profile.currency,
    savingsGoal: ctx.profile.savingsGoal,
    goalProgressPct: ctx.profile.goalProgress,
    allowanceBaseline: ctx.profile.allowanceBaseline,
    income: ctx.money.income,
    expense: ctx.money.expense,
    saved: ctx.money.saved,
    safeToSpend: ctx.money.safeToSpend,
    dailyBurn: ctx.money.dailyBurn,
    projectedEomExpense: ctx.money.projectedEomExpense,
    budgets: ctx.budgets.map((b) => ({
      cat: b.category,
      limit: b.limit,
      spent: b.spent,
      pct: b.pct,
      status: b.status,
    })),
    topCategories: ctx.topCategories,
    flags: ctx.flags,
    largestExpenses: ctx.largestExpenses.slice(0, 5),
  };
}

const ADVISOR_SYSTEM = `You are BudgetBee, BudgetBee's personal finance advisor for students inside Campus Coin.
You are practical, warm, and specific — never generic.

Rules:
- Use ONLY the JSON financial context provided. Invent no numbers.
- Currency is in the context. Quote amounts as plain numbers with the currency code.
- For purchase questions ("should I buy X"): give a clear verdict first line: Yes / Yes with a check / Wait / Not this month / No — too tight.
- Then 2-4 short bullets: remaining money, daily burn / days left, impact on savings goal, and one concrete alternative (delay, EMI, sale, cut a category).
- For spending/budget/goal questions: answer with their actual numbers and one actionable next step.
- Max ~120 words. Plain text only — no markdown, no **, no headers, no code. Use "•" for bullets. No disclaimer essays. Advisory only.
- If the message is feature help (how to use the app), answer briefly without inventing stats.
- If amount is missing for a purchase, ask for the price AND still show their current safe-to-spend.`;

async function personalAdvisor(userId, message, history, intents) {
  const amount = extractAmount(message);
  const isFinance =
    intents.length > 0 ||
    /spen|spent|cost|how much|balance|save|saved|afford|left|budget|income|expense|buy|price|goal|forecast|invest|phone|laptop|money|cash|allowance/i.test(
      message
    );

  if (!isFinance) return null;

  // Never let a context/DB hiccup fail the whole chat — degrade gracefully.
  try {
    const ctx = await buildFinanceContext(userId);

    const rule =
      intents.includes("purchase") && amount != null
        ? rulePurchaseAdvice(ctx, amount, message)
        : intents.includes("purchase")
          ? rulePurchaseAdvice(ctx, null, message)
          : intents.includes("forecast")
            ? { verdict: "Forecast", body: ruleForecast(ctx), source: "rules" }
            : intents.some((i) => ["spending", "budget", "goal", "advice"].includes(i))
              ? { verdict: "", body: ruleSpendingAnswer(ctx), source: "rules" }
              : null;

    try {
      const { content, provider } = await llmChat(
        [
          { role: "system", content: ADVISOR_SYSTEM },
          {
            role: "user",
            content: `Financial context JSON:\n${JSON.stringify(compactCtx(ctx))}\n\nDetected intents: ${
              intents.join(", ") || "general"
            }\nExtracted purchase amount: ${amount ?? "n/a"}\n\nQuestion: ${message}`,
          },
        ],
        {
          temperature: 0.35,
          maxTokens: 450,
          timeoutMs: 12000,
        }
      );

      let reply = stripMarkdown(content.trim());
      if (!reply) throw new Error("empty LLM reply");
      if (
        intents.includes("purchase") &&
        amount != null &&
        !/^(yes|wait|no|not |hold|skip|maybe|don'?t|save|delay|go for)/i.test(reply)
      ) {
        const r = rulePurchaseAdvice(ctx, amount, message);
        if (r.verdict && r.verdict !== "Need price") {
          reply = `${r.verdict}\n${reply}`;
        }
      }
      return { reply, source: `ai-advisor:${provider}` };
    } catch {
      if (rule) return { reply: rule.body, source: rule.source };
      return {
        reply: ruleSpendingAnswer(ctx),
        source: "rules",
      };
    }
  } catch {
    return null;
  }
}

export async function aiChat(userId, message, history = []) {
  const intents = detectIntent(message);
  const lower = message.toLowerCase();

  const personal = await personalAdvisor(userId, message, history, intents);

  if (personal) {
    return { reply: personal.reply, source: personal.source };
  }

  const talk = matchSmalltalk(message);
  if (talk) return { reply: talk, source: "smalltalk" };

  const faq = matchFaq(message);
  if (faq) return { reply: faq, source: "faq" };

  try {
    const user = await User.findById(userId).select("name currency").lean();
    const stats = await buildMonthStats(
      userId,
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
    );
    const messages = [
      {
        role: "system",
        content:
          "You are BudgetBee inside Campus Coin, a student budget app. Answer briefly (1-3 sentences) in plain text — no markdown, no ** — using the light stats only if money-related. Advisory only. If asked about unbuilt features, say so honestly.",
      },
      ...history.slice(-6).map((h) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: h.content,
      })),
      {
        role: "user",
        content: `Student: ${user?.name || ""} (${user?.currency || "BDT"})\nMonth stats: ${JSON.stringify(
          {
            income: stats.income,
            expense: stats.expense,
            saved: stats.saved,
            top: stats.byCategory.slice(0, 5),
          }
        )}\nQuestion: ${message}`,
      },
    ];
    const { content, provider } = await llmChat(messages, {
      temperature: 0.5,
      maxTokens: 300,
      timeoutMs: 10000,
    });
    const reply = stripMarkdown(content.trim());
    if (!reply) throw new Error("empty LLM reply");
    return { reply, source: `ai:${provider}` };
  } catch {
    return {
      reply:
        "I can advise on purchases, budgets, spending, and goals using your real data. Try:\n• “Should I buy a phone for 25000 this month?”\n• “How much can I spend today?”\n• “Am I on track for my savings goal?”\n• “How do I set a budget?”",
      source: "fallback",
    };
  }
}
