import "dotenv/config";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";
import { seedSystemCategories } from "./categories.js";
import { User } from "../models/User.js";
import { Category } from "../models/Category.js";
import { Transaction } from "../models/Transaction.js";
import { Budget } from "../models/Budget.js";
import { Notification } from "../models/Notification.js";
import { Tip } from "../models/Tip.js";
import { Bookmark } from "../models/Bookmark.js";
import { Announcement } from "../models/Announcement.js";
import { generateTips } from "../services/tipsEngine.js";

// ---------- deterministic PRNG (reproducible seed data) ----------
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const randInt = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (rng, arr) => arr[randInt(rng, 0, arr.length - 1)];
const nice = (n, step = 10) => Math.round(n / step) * step;

const now = new Date();
const CUR_MONTH = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const MONTHS_BACK = 6;

function maxDayFor(offset) {
  if (offset === 0) return now.getDate();
  return new Date(now.getFullYear(), now.getMonth() - offset + 1, 0).getDate();
}
function dateIn(rng, offset) {
  const day = randInt(rng, 1, Math.max(1, maxDayFor(offset)));
  const hour = offset === 0 ? randInt(rng, 6, Math.max(6, now.getHours())) : randInt(rng, 8, 22);
  return new Date(now.getFullYear(), now.getMonth() - offset, day, hour, randInt(rng, 0, 59));
}
function dayOf(rng, offset, day) {
  const dd = Math.min(day, Math.max(1, maxDayFor(offset)));
  return new Date(now.getFullYear(), now.getMonth() - offset, dd, 12, 0, 0);
}

// ---------- personas ----------
const PERSONAS = [
  {
    email: "demo@campuscoin.app",
    password: "Demo@123",
    name: "Demo Student",
    academicYear: "3rd Year",
    allowanceBaseline: 15000,
    savingsGoal: 5000,
    tag: "demo",
    allowanceDay: 1,
    extras: [{ income: "Part-time Job", months: [5, 3, 0], amount: 3500, day: 15, note: "Campus library shift" }],
    custom: [
      { name: "Coffee & Cafe", type: "expense", icon: "coffee", color: "#8B5CF6" },
      { name: "Tutoring", type: "income", icon: "graduation-cap", color: "#10B981" },
    ],
    expenseCats: ["Food", "Transport", "Academics", "Subscriptions", "Entertainment", "Miscellaneous", "Coffee & Cafe"],
    budgetCats: ["Food", "Transport", "Subscriptions", "Entertainment", "Academics"],
    overBudget: ["Food"],
    template: (rng, cat) => {
      switch (cat) {
        case "Food":
          return Array.from({ length: randInt(rng, 12, 15) }, () => ({
            amount: nice(randInt(rng, 110, 340), 10),
            note: pick(rng, ["Canteen lunch", "Dinner with friends", "Breakfast at hall", "Snacks from canteen", "Weekend treat"]),
          }));
        case "Transport":
          return Array.from({ length: randInt(rng, 6, 9) }, () => ({
            amount: nice(randInt(rng, 35, 110), 5),
            note: pick(rng, ["Bus to campus", "Bus home", "Rideshare in rain"]),
          }));
        case "Academics":
          return rng() < 0.55
            ? [{ amount: nice(randInt(rng, 300, 1200), 50), note: pick(rng, ["Printed lecture handouts", "Reference book", "Lab report printing"]) }]
            : [];
        case "Subscriptions":
          return [
            { amount: 159, note: "Spotify Student", recurring: true, day: 5 },
            { amount: 499, note: "Netflix subscription", recurring: true, day: 12 },
          ];
        case "Entertainment":
          return [{ amount: nice(randInt(rng, 300, 900), 50), note: pick(rng, ["Movie night", "Campus cultural event", "Concert with friends"]) }];
        case "Miscellaneous":
          return Array.from({ length: randInt(rng, 1, 3) }, () => ({
            amount: nice(randInt(rng, 100, 700), 50),
            note: pick(rng, ["Mobile top-up", "Birthday gift for friend", "Stationery"]),
          }));
        case "Coffee & Cafe":
          return Array.from({ length: randInt(rng, 4, 7) }, () => ({
            amount: nice(randInt(rng, 150, 380), 10),
            note: pick(rng, ["Cappuccino study session", "Coffee with group mates", "Iced latte"]),
          }));
        default:
          return [];
      }
    },
  },
  {
    email: "rafi@campuscoin.app",
    password: "Rafi@123",
    name: "Rafi Hasan",
    academicYear: "2nd Year",
    allowanceBaseline: 12000,
    savingsGoal: 6000,
    tag: "rafi",
    allowanceDay: 1,
    extras: [{ income: "Freelance", months: [5, 4, 2, 1, 0], amount: [2500, 6800], day: 20, note: "Freelance web project" }],
    custom: [
      { name: "Gym", type: "expense", icon: "dumbbell", color: "#10B981" },
      { name: "Freelance", type: "income", icon: "laptop", color: "#3B82F6" },
    ],
    expenseCats: ["Hostel/Rent", "Food", "Transport", "Academics", "Subscriptions", "Entertainment", "Miscellaneous", "Gym"],
    budgetCats: ["Hostel/Rent", "Food", "Transport", "Subscriptions", "Gym"],
    overBudget: [],
    template: (rng, cat) => {
      switch (cat) {
        case "Hostel/Rent":
          return [{ amount: 5500, note: "Hostel seat + mess bill", recurring: true, day: 3 }];
        case "Food":
          return Array.from({ length: randInt(rng, 10, 14) }, () => ({
            amount: nice(randInt(rng, 90, 310), 10),
            note: pick(rng, ["Mess dinner", "Canteen lunch", "Late night food run", "Halla with friends"]),
          }));
        case "Transport":
          return Array.from({ length: randInt(rng, 5, 8) }, () => ({
            amount: nice(randInt(rng, 35, 100), 5),
            note: pick(rng, ["Bus to campus", "Local train fare", "Bus home"]),
          }));
        case "Academics":
          return rng() < 0.7
            ? [{ amount: nice(randInt(rng, 400, 1500), 50), note: pick(rng, ["Semester textbook", "Assignment printing", "Programming course fee"]) }]
            : [];
        case "Subscriptions":
          return [
            { amount: 159, note: "Spotify Student", recurring: true, day: 5 },
            ...(rng() < 0.5 ? [{ amount: 400, note: "Game purchase", day: randInt(rng, 8, 24) }] : []),
          ];
        case "Entertainment":
          return [{ amount: nice(randInt(rng, 250, 700), 50), note: pick(rng, ["Movie with hallmates", "Cricket match night", "Day trip"]) }];
        case "Miscellaneous":
          return Array.from({ length: randInt(rng, 1, 2) }, () => ({
            amount: nice(randInt(rng, 100, 500), 50),
            note: pick(rng, ["Mobile top-up", "Laundry", "Haircut"]),
          }));
        case "Gym":
          return [{ amount: 800, note: "Monthly gym fee", recurring: true, day: 2 }];
        default:
          return [];
      }
    },
  },
  {
    email: "nusrat@campuscoin.app",
    password: "Nusrat@123",
    name: "Nusrat Jahan",
    academicYear: "4th Year",
    allowanceBaseline: 16000,
    savingsGoal: 10000,
    tag: "nusrat",
    allowanceDay: 1,
    extras: [{ income: "Private Tuition", months: [5, 4, 3, 2, 1, 0], amount: 6000, day: 10, note: "Two students tuition fee" }],
    custom: [
      { name: "Shopping", type: "expense", icon: "shopping-bag", color: "#EC4899" },
      { name: "Coffee", type: "expense", icon: "coffee", color: "#8B5CF6" },
      { name: "Private Tuition", type: "income", icon: "graduation-cap", color: "#10B981" },
    ],
    expenseCats: ["Food", "Transport", "Academics", "Subscriptions", "Entertainment", "Miscellaneous", "Shopping", "Coffee"],
    budgetCats: ["Food", "Transport", "Shopping", "Coffee", "Entertainment"],
    overBudget: ["Shopping"],
    template: (rng, cat) => {
      switch (cat) {
        case "Food":
          return Array.from({ length: randInt(rng, 13, 17) }, () => ({
            amount: nice(randInt(rng, 150, 520), 10),
            note: pick(rng, ["Lunch at cafe", "Dinner out", "Brunch with friends", "Food court", "Home delivery"]),
          }));
        case "Transport":
          return Array.from({ length: randInt(rng, 8, 12) }, () => ({
            amount: nice(randInt(rng, 60, 260), 10),
            note: pick(rng, ["Rideshare to campus", "Rideshare home", "Uber share", "Bus fare"]),
          }));
        case "Academics":
          return [{ amount: nice(randInt(rng, 500, 1800), 50), note: pick(rng, ["Final year project material", "Printing thesis draft", "Workshop fee"]) }];
        case "Subscriptions":
          return [
            { amount: 499, note: "Netflix subscription", recurring: true, day: 12 },
            { amount: 159, note: "Spotify Student", recurring: true, day: 5 },
          ];
        case "Entertainment":
          return [{ amount: nice(randInt(rng, 500, 1500), 50), note: pick(rng, ["Cafe hopping", "Concert ticket", "Cinema with friends"]) }];
        case "Miscellaneous":
          return Array.from({ length: randInt(rng, 1, 3) }, () => ({
            amount: nice(randInt(rng, 200, 800), 50),
            note: pick(rng, ["Salon", "Mobile top-up", "Gift for sister"]),
          }));
        case "Shopping":
          return Array.from({ length: randInt(rng, 1, 3) }, () => ({
            amount: nice(randInt(rng, 800, 3500), 50),
            note: pick(rng, ["New outfit", "Online order", "Shoes", "Skincare restock"]),
          }));
        case "Coffee":
          return Array.from({ length: randInt(rng, 4, 8) }, () => ({
            amount: nice(randInt(rng, 180, 430), 10),
            note: pick(rng, ["Caramel latte", "Coffee before class", "Study cafe session"]),
          }));
        default:
          return [];
      }
    },
  },
];

async function seedUser(persona, catMap) {
  const rng = mulberry32(hash(persona.tag));
  const user = await User.create({
    name: persona.name,
    email: persona.email,
    password: await User.hashPassword(persona.password),
    role: "student",
    academicYear: persona.academicYear,
    allowanceBaseline: persona.allowanceBaseline,
    savingsGoal: persona.savingsGoal,
    currency: "BDT",
    loginStreak: randInt(rng, 3, 9),
    lastLoginAt: new Date(now.getTime() - 24 * 3600 * 1000),
  });

  const customCats = await Category.insertMany(
    persona.custom.map((c) => ({ ...c, userId: user._id, isDefault: false }))
  );
  const allCats = { ...catMap };
  for (const c of customCats) allCats[`${c.name}|${c.type}`] = c._id;

  const txs = [];
  const push = (type, catName, t) => {
    const categoryId = allCats[`${catName}|${type}`];
    if (!categoryId) {
      console.warn(`⚠️ skipped tx: category "${catName}|${type}" not found`);
      return;
    }
    txs.push({
      userId: user._id,
      type,
      amount: Math.max(1, t.amount),
      categoryId,
      note: t.note || "",
      date: t.date,
      isRecurring: !!t.recurring,
      recurringDay: t.recurring ? t.day || undefined : undefined,
    });
  };

  for (let offset = MONTHS_BACK - 1; offset >= 0; offset--) {
    push("income", "Allowance", {
      amount: persona.allowanceBaseline,
      note: "Monthly allowance",
      date: dayOf(rng, offset, persona.allowanceDay),
      recurring: true,
      day: persona.allowanceDay,
    });
    for (const extra of persona.extras) {
      if (!extra.months.includes(offset)) continue;
      const amount = Array.isArray(extra.amount) ? randInt(rng, extra.amount[0], extra.amount[1]) : extra.amount;
      push("income", extra.income, { amount, note: extra.note, date: dayOf(rng, offset, extra.day) });
    }
    for (const catName of persona.expenseCats) {
      for (const t of persona.template(rng, catName)) {
        const date = t.day ? dayOf(rng, offset, t.day) : dateIn(rng, offset);
        push("expense", catName, { ...t, date });
      }
    }
  }

  const txDocs = await Transaction.insertMany(txs);

  // current-month budgets based on actual spend (one over budget for alerts)
  const spentByCat = {};
  for (const t of txDocs) {
    if (t.type !== "expense") continue;
    const m = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    if (m !== CUR_MONTH) continue;
    const key = String(t.categoryId);
    spentByCat[key] = (spentByCat[key] || 0) + t.amount;
  }
  const budgets = [];
  for (const catName of persona.budgetCats) {
    const categoryId = allCats[`${catName}|expense`];
    if (!categoryId) continue;
    const spent = spentByCat[String(categoryId)] || 0;
    if (spent <= 0) continue;
    let limit = nice(spent * 1.15, 100);
    if (persona.overBudget.includes(catName)) limit = nice(spent * 0.85, 100);
    if (limit < 100) limit = 100;
    budgets.push({ userId: user._id, categoryId, month: CUR_MONTH, limit });
  }
  await Budget.insertMany(budgets);

  // notifications (mix of read / unread)
  const overCat = persona.budgetCats.find((c) => persona.overBudget.includes(c));
  const notifications = [
    {
      type: "info",
      title: "Welcome to Campus Coin",
      message: `Hi ${persona.name.split(" ")[0]}, your budget tracker is ready. Log your first expense!`,
      read: true,
      hoursAgo: 96,
    },
    {
      type: "achievement",
      title: `${randInt(rng, 4, 9)}-day logging streak!`,
      message: "You have been logging expenses consistently. Keep it up!",
      read: true,
      hoursAgo: 48,
    },
    {
      type: "budget_alert",
      title: overCat ? `${overCat} budget exceeded` : "Budget update",
      message: overCat
        ? `Your ${overCat} budget for ${CUR_MONTH} is over. Review recent spending to get back on track.`
        : `Your ${CUR_MONTH} budgets were recalculated after your latest transactions.`,
      read: false,
      hoursAgo: 20,
    },
    {
      type: "announcement",
      title: "Midterm Budget Challenge",
      message: "Join the 2-week no-delivery challenge and win campus cafe vouchers.",
      read: false,
      hoursAgo: 5,
    },
  ];
  await Notification.insertMany(
    notifications.map((n) => ({
      userId: user._id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: new Date(now.getTime() - n.hoursAgo * 3600 * 1000),
      updatedAt: new Date(now.getTime() - n.hoursAgo * 3600 * 1000),
    }))
  );

  // rule-based tips + one bookmark
  await generateTips(user._id);
  const topTip = await Tip.findOne({ userId: user._id }).sort({ impactScore: -1 });
  if (topTip) {
    await Bookmark.create({
      userId: user._id,
      refModel: "Tip",
      refId: topTip._id,
      title: topTip.title,
      snippet: topTip.body.slice(0, 120),
    });
  }

  return { user, transactions: txs.length, budgets: budgets.length };
}

async function main() {
  await connectDB();

  const host = mongoose.connection.host || "";
  if (/127\.0\.0\.1|localhost/i.test(host)) {
    console.error(`❌ Refusing to seed: connected to "${host}", not Atlas. Fix DB connectivity first.`);
    await disconnectDB();
    process.exit(1);
  }

  console.log(`🗑️  Dropping database on ${host} (deleting ALL data)...`);
  await mongoose.connection.dropDatabase();

  await seedSystemCategories();
  const sysCats = await Category.find({ userId: null, isDefault: true });
  const catMap = {};
  for (const c of sysCats) catMap[`${c.name}|${c.type}`] = c._id;

  const admin = await User.create({
    name: "Campus Coin Admin",
    email: "admin@campuscoin.app",
    password: await User.hashPassword("Admin@123"),
    role: "admin",
    currency: "BDT",
  });
  console.log(`✅ Admin: ${admin.email} / Admin@123`);

  for (const persona of PERSONAS) {
    const r = await seedUser(persona, catMap);
    console.log(`✅ ${persona.name} (${persona.email} / ${persona.password}): ${r.transactions} tx, ${r.budgets} budgets`);
  }

  await Announcement.insertMany([
    {
      title: "Welcome to the new semester",
      body: "Campus Coin is live for this semester. Set your budgets in the first week for the best results!",
      active: true,
    },
    {
      title: "Midterm Budget Challenge",
      body: "Two weeks, no unnecessary deliveries. Track every taka and climb the savings leaderboard.",
      active: true,
    },
  ]);
  console.log("✅ 2 announcements");

  const [u, t, b, n, tip, bm] = await Promise.all([
    User.countDocuments(),
    Transaction.countDocuments(),
    Budget.countDocuments(),
    Notification.countDocuments(),
    Tip.countDocuments(),
    Bookmark.countDocuments(),
  ]);
  console.log(`🎉 Atlas seed complete — users:${u} tx:${t} budgets:${b} notifications:${n} tips:${tip} bookmarks:${bm}`);

  await disconnectDB();
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
