import mongoose from "mongoose";
import { Transaction } from "../../models/Transaction.js";
import { llmChat, parseJsonLoose } from "./provider.js";

const KEYWORD_RULES = [
  { re: /cafe|coffee|latte|canteen|restaurant|lunch|dinner|breakfast|food|pizza|burger|swiggy|zomato|starbucks|mcdonald/i, name: "Food" },
  { re: /bus|metro|train|uber|ola|taxi|petrol|fuel|auto|rickshaw|flight|transport/i, name: "Transport" },
  { re: /rent|hostel|pg|mess|apartment|landlord/i, name: "Hostel/Rent" },
  { re: /book|tuition|stationery|exam|course|udemy|coursera|textbook|semester|academic/i, name: "Academics" },
  { re: /netflix|spotify|prime|subscription|app.?store|google.?one|youtube.?premium|software/i, name: "Subscriptions" },
  { re: /movie|cinema|concert|game|outing|party|entertainment|bookmyshow/i, name: "Entertainment" },
  { re: /salary|wage|paycheck|stipend|part.?time|freelance|gig/i, name: "Part-time Job" },
  { re: /scholarship|grant|stipend.?schol/i, name: "Scholarship" },
  { re: /gift|birthday.?cash|present/i, name: "Gift" },
  { re: /allowance|pocket.?money|monthly.?allow/i, name: "Allowance" },
];

export function ruleCategorize(note, type = "expense") {
  const text = String(note || "");
  if (type === "income") {
    for (const key of ["Allowance", "Part-time Job", "Scholarship", "Gift", "Other Income"]) {
      const row = KEYWORD_RULES.find((r) => r.name === key);
      if (row && row.re.test(text)) return { name: key, confidence: 0.7, source: "rules" };
    }
    return { name: "Other Income", confidence: 0.4, source: "rules" };
  }
  for (const r of KEYWORD_RULES) {
    if (r.re.test(text)) return { name: r.name, confidence: 0.75, source: "rules" };
  }
  return { name: "Miscellaneous", confidence: 0.3, source: "rules" };
}

const SYSTEM = `You are a student expense categorizer for Campus Coin.
Return ONLY JSON: {"category": string, "confidence": number 0-1, "reason": string}.
Income categories: Allowance, Part-time Job, Scholarship, Gift, Other Income.
Expense categories: Food, Transport, Hostel/Rent, Academies, Subscriptions, Entertainment, Miscellaneous.
Prefer exact names from the lists. Be conservative with confidence.`;

function tokenize(note) {
  return String(note || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
}

/**
 * Learns from the user's own history: token -> category frequency, with
 * explicit user corrections weighted 3x. Lets repeated personal notes
 * (e.g. "gym fee", "bus pass") categorize correctly without an LLM call.
 */
async function buildUserLearningMap(userId) {
  const rows = await Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), note: { $ne: "" } } },
    { $sort: { date: -1 } },
    { $limit: 500 },
    {
      $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "cat" },
    },
    { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
    { $match: { "cat.name": { $exists: true } } },
    {
      $project: {
        note: 1,
        name: "$cat.name",
        w: { $cond: ["$userCorrectedCategory", 3, 1] },
      },
    },
  ]);

  const map = {};
  for (const r of rows) {
    for (const t of tokenize(r.note)) {
      if (!map[t]) map[t] = {};
      map[t][r.name] = (map[t][r.name] || 0) + r.w;
    }
  }
  return map;
}

function learnedGuess(note, userMap, availableNames = []) {
  const votes = {};
  let matchedTokens = 0;
  for (const t of tokenize(note)) {
    const row = userMap[t];
    if (!row) continue;
    matchedTokens += 1;
    for (const [name, w] of Object.entries(row)) votes[name] = (votes[name] || 0) + w;
  }
  const top = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  // Needs a real signal: several matching tokens, or one strong repeat
  if (!(matchedTokens >= 2 || top[1] >= 3)) return null;
  const [name] = top;
  if (availableNames.length && !availableNames.some((n) => n.toLowerCase() === name.toLowerCase())) {
    return null;
  }
  return {
    name,
    confidence: 0.9,
    reason: "Matched your own past categorizations",
    source: "user_learning",
    aiSuggested: true,
  };
}

export async function aiCategorize(note, type = "expense", availableNames = [], userId = null) {
  const fallback = ruleCategorize(note, type);

  // 1) Per-user learning beats global rules and the LLM
  if (userId) {
    try {
      const userMap = await buildUserLearningMap(userId);
      const learned = learnedGuess(note, userMap, availableNames);
      if (learned) return learned;
    } catch {
      /* fall through to LLM/rules */
    }
  }

  try {
    const names = availableNames.length
      ? availableNames.join(", ")
      : type === "income"
        ? "Allowance, Part-time Job, Scholarship, Gift, Other Income"
        : "Food, Transport, Hostel/Rent, Academics, Subscriptions, Entertainment, Miscellaneous";

    const { content, provider } = await llmChat(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `type=${type}\nallowed=${names}\nnote=${String(note).slice(0, 200)}`,
        },
      ],
      { json: true, temperature: 0.1, maxTokens: 200, timeoutMs: 8000 }
    );

    const parsed = parseJsonLoose(content);
    if (parsed?.category) {
      const match = availableNames.find(
        (n) => n.toLowerCase() === String(parsed.category).toLowerCase()
      );
      return {
        name: match || parsed.category,
        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.7)),
        reason: parsed.reason || "",
        source: provider,
        aiSuggested: true,
      };
    }
  } catch {
    /* rules fallback */
  }

  return { ...fallback, aiSuggested: false };
}

export async function aiCategorizeBatch(rows) {
  const out = [];
  for (const row of rows) {
    const result = await aiCategorize(
      row.note,
      row.type || "expense",
      row.availableNames || [],
      row.userId || null
    );
    out.push({ ...row, ...result });
  }
  return out;
}
