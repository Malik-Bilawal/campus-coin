import { Transaction } from "../models/Transaction.js";

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

/**
 * Creates this month's copy of every recurring transaction whose recurringDay
 * has already passed, as long as no matching transaction (same category + note)
 * exists for the current month. Called on dashboard load so recurring items
 * (rent, subscriptions, allowance) materialize automatically.
 */
export async function materializeRecurringForUser(userId) {
  const now = new Date();
  const today = now.getDate();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const templates = await Transaction.find({
    userId,
    isRecurring: true,
    recurringDay: { $ne: null, $lte: today },
  });

  const created = [];
  for (const tpl of templates) {
    const exists = await Transaction.exists({
      userId,
      categoryId: tpl.categoryId,
      note: tpl.note,
      date: { $gte: monthStart, $lt: monthEnd },
    });
    if (exists) continue;

    const day = Math.min(tpl.recurringDay, daysInMonth(now.getFullYear(), now.getMonth()));
    let date = new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0);
    if (date > now) date = now; // same-day occurrence shouldn't wait until noon
    if (tpl.createdAt && date < new Date(new Date(tpl.createdAt).setHours(0, 0, 0, 0))) continue;

    const doc = await Transaction.create({
      userId,
      type: tpl.type,
      amount: tpl.amount,
      categoryId: tpl.categoryId,
      note: tpl.note,
      date,
      isRecurring: true,
      recurringDay: tpl.recurringDay,
      aiSuggested: false,
    });
    created.push(doc);
  }
  return created;
}
