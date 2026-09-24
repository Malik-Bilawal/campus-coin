import { Category } from "../models/Category.js";

export const DEFAULT_INCOME = [
  { name: "Allowance", icon: "wallet", color: "#10B981" },
  { name: "Part-time Job", icon: "briefcase", color: "#3B82F6" },
  { name: "Scholarship", icon: "graduation-cap", color: "#8B5CF6" },
  { name: "Gift", icon: "gift", color: "#EC4899" },
  { name: "Other Income", icon: "plus-circle", color: "#64748B" },
];

export const DEFAULT_EXPENSE = [
  { name: "Food", icon: "utensils", color: "#F59E0B" },
  { name: "Transport", icon: "bus", color: "#3B82F6" },
  { name: "Hostel/Rent", icon: "home", color: "#EF4444" },
  { name: "Academics", icon: "book-open", color: "#8B5CF6" },
  { name: "Subscriptions", icon: "repeat", color: "#06B6D4" },
  { name: "Entertainment", icon: "film", color: "#EC4899" },
  { name: "Miscellaneous", icon: "more-horizontal", color: "#64748B" },
];

export async function seedSystemCategories() {
  const count = await Category.countDocuments({ userId: null, isDefault: true });
  if (count > 0) return;

  const docs = [
    ...DEFAULT_INCOME.map((c) => ({ ...c, type: "income", userId: null, isDefault: true })),
    ...DEFAULT_EXPENSE.map((c) => ({ ...c, type: "expense", userId: null, isDefault: true })),
  ];
  await Category.insertMany(docs);
  console.log(`✅ Seeded ${docs.length} system categories`);
}

export async function createUserDefaultCategories(userId) {
  const docs = [
    ...DEFAULT_INCOME.map((c) => ({ ...c, type: "income", userId, isDefault: true })),
    ...DEFAULT_EXPENSE.map((c) => ({ ...c, type: "expense", userId, isDefault: true })),
  ];
  await Category.insertMany(docs);
  return docs.length;
}
