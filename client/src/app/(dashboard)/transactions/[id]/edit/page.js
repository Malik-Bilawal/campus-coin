"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/ui";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

export default function EditTransactionPage({ params }) {
  const id = params?.id;
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.get(`/transactions/${id}`), api.get("/categories")])
      .then(([txRes, catRes]) => {
        const tx = txRes.data.transaction;
        setCategories(catRes.data.categories);
        setForm({
          type: tx.type,
          amount: String(tx.amount),
          categoryId: tx.categoryId?._id || tx.categoryId || "",
          note: tx.note || "",
          date: new Date(tx.date).toISOString().slice(0, 10),
          isRecurring: !!tx.isRecurring,
          recurringDay: tx.recurringDay ? String(tx.recurringDay) : "",
        });
      })
      .catch((e) => addToast({ type: "error", message: e.message }))
      .finally(() => setLoading(false));
  }, [id, addToast]);

  const filtered = categories.filter((c) => c.type === form?.type);

  function changeType(type) {
    const first = categories.find((c) => c.type === type);
    setForm({ ...form, type, categoryId: first?._id || "" });
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
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        amount: Number(form.amount),
        categoryId: form.categoryId,
        note: form.note || "",
        date: new Date(form.date).toISOString(),
        isRecurring: !!form.isRecurring,
      };
      if (form.isRecurring && form.recurringDay) {
        payload.recurringDay = Number(form.recurringDay);
      }
      await api.patch(`/transactions/${id}`, payload);
      addToast({ type: "success", message: "Transaction updated" });
      router.push("/transactions");
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <div className="skeleton h-12 w-64" />
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader
        title="Edit transaction"
        breadcrumbs={[
          { label: "Transactions", href: "/transactions" },
          { label: "Edit" },
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
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/60">
            {["expense", "income"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => changeType(t)}
                className={cn(
                  "relative rounded-lg py-2.5 text-sm font-semibold capitalize transition",
                  form.type === t ? "text-white" : "text-zinc-500"
                )}
              >
                {form.type === t && (
                  <span
                    className={cn(
                      "absolute inset-0 rounded-lg",
                      t === "expense" ? "bg-rose-500" : "bg-emerald-500"
                    )}
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
            <option value="">Select...</option>
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
            label="Note"
            name="note"
            maxLength={200}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />

          <label className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              className="h-4 w-4 accent-honey-500"
            />
            <div>
              <span className="text-sm font-medium">Recurring</span>
              <p className="text-xs text-zinc-400">Repeats monthly</p>
            </div>
          </label>

          <Button type="submit" isLoading={saving} className="w-full py-3">
            <Save className="h-4 w-4" /> Update transaction
          </Button>
        </form>
      </Card>
    </div>
  );
}
