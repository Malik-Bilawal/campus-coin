"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Save, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/ui";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function NewTransactionPage() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    categoryId: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
    isRecurring: false,
    recurringDay: "",
  });
  const [loading, setLoading] = useState(false);
  const [aiSuggest, setAiSuggest] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    api
      .get("/categories")
      .then((r) => {
        setCategories(r.data.categories);
        const firstExp = r.data.categories.find((c) => c.type === "expense");
        if (firstExp) setForm((f) => ({ ...f, categoryId: firstExp._id }));
      })
      .catch(() => {});
  }, []);

  // Live AI category suggest while typing note
  useEffect(() => {
    if (!form.note || form.note.length < 4) {
      setAiSuggest(null);
      return;
    }
    const t = setTimeout(async () => {
      setAiLoading(true);
      try {
        const res = await api.post("/ai/categorize", {
          note: form.note,
          type: form.type,
        });
        setAiSuggest(res.data.suggestion);
        const match = categories.find(
          (c) => c.name.toLowerCase() === String(res.data.suggestion?.name).toLowerCase()
        );
        if (match && res.data.suggestion?.confidence >= 0.5) {
          setForm((f) => ({ ...f, categoryId: match._id }));
        }
      } catch {
        setAiSuggest(null);
      } finally {
        setAiLoading(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [form.note, form.type, categories]);

  const filtered = categories.filter((c) => c.type === form.type);

  function changeType(type) {
    const first = categories.find((c) => c.type === type);
    setForm({
      ...form,
      type,
      categoryId: first?._id || "",
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      addToast({ type: "error", message: "Enter a valid amount" });
      return;
    }
    if (!form.categoryId) {
      addToast({ type: "error", message: "Select a category" });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/transactions", {
        type: form.type,
        amount: Number(form.amount),
        categoryId: form.categoryId,
        note: form.note,
        date: new Date(form.date).toISOString(),
        isRecurring: form.isRecurring,
        recurringDay: form.isRecurring && form.recurringDay ? Number(form.recurringDay) : undefined,
        aiSuggested: !!aiSuggest?.aiSuggested,
      });

      const alerts = res.data?.alerts || [];
      if (alerts.length) {
        alerts.forEach((a) =>
          addToast({
            type: a.level === "exceeded" ? "error" : "warning",
            message: a.message,
          })
        );
      } else {
        addToast({ type: "success", message: "Transaction added" });
      }
      router.push("/transactions");
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader
        title="New transaction"
        subtitle="Log income or expense in seconds"
        breadcrumbs={[
          { label: "Transactions", href: "/transactions" },
          { label: "New" },
        ]}
        actions={
          <Link href="/transactions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
          </Link>
        }
      />

      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/60">
            {["expense", "income"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => changeType(t)}
                className={cn(
                  "relative rounded-lg py-2.5 text-sm font-semibold capitalize transition",
                  form.type === t
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                {form.type === t && (
                  <motion.span
                    layoutId="type-pill"
                    className={cn(
                      "absolute inset-0 rounded-lg",
                      t === "expense"
                        ? "bg-gradient-to-r from-rose-500 to-rose-400 shadow-md"
                        : "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-md"
                    )}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{t}</span>
              </button>
            ))}
          </div>

          <Input
            label="Amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <Select
            label="Category"
            name="categoryId"
            required
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">Select category...</option>
            {filtered.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Input
            label="Date"
            name="date"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <Textarea
            label="Note (optional)"
            name="note"
            placeholder="e.g. Campus cafe lunch, bus fare..."
            maxLength={200}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />

          {(aiLoading || aiSuggest) && form.note.length >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs ${
                aiSuggest?.aiSuggested
                  ? "border-honey-500/40 bg-honey-500/10 text-honey-800 dark:text-honey-200"
                  : "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className={`h-3.5 w-3.5 ${aiLoading ? "animate-pulse" : ""}`} />
                {aiLoading
                  ? "AI thinking..."
                  : aiSuggest?.aiSuggested
                    ? `AI suggests: ${aiSuggest.name} (${Math.round((aiSuggest.confidence || 0) * 100)}%)`
                    : `Rules suggest: ${aiSuggest?.name}`}
              </span>
              {aiSuggest && !aiSuggest.aiSuggested && (
                <span className="text-[10px] uppercase opacity-60">fallback</span>
              )}
            </motion.div>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <input
              type="checkbox"
              id="recurring"
              checked={form.isRecurring}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-honey-500"
            />
            <div className="flex-1">
              <label htmlFor="recurring" className="text-sm font-medium">
                Recurring transaction
              </label>
              <p className="text-xs text-zinc-400">
                For monthly allowances, rent, subscriptions
              </p>
              {form.isRecurring && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3"
                >
                  <Input
                    label="Day of month (1-31)"
                    name="recurringDay"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="e.g. 1"
                    value={form.recurringDay}
                    onChange={(e) => setForm({ ...form, recurringDay: e.target.value })}
                  />
                </motion.div>
              )}
            </div>
          </div>

          <Button type="submit" isLoading={loading} className="w-full py-3">
            <Save className="h-4 w-4" /> Save transaction
          </Button>
        </form>
      </Card>
    </div>
  );
}
