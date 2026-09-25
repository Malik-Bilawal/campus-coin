"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Target } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { formatMoney, monthKey, monthLabel, cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, SkeletonList } from "@/components/ui/EmptyState";
import { celebrate } from "@/lib/confetti";

export default function BudgetsPage() {
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const currency = user?.currency || "BDT";

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(monthKey());
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ categoryId: "", limit: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/categories?type=expense")
      .then((r) => setCategories(r.data.categories))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/budgets?month=${month}`);
      const list = res.data.budgets || [];
      setBudgets(list);
      const allSafe = list.length > 0 && list.every((b) => (b.percentage || 0) < 80);
      if (allSafe) {
        const key = `cc-confetti-budgets-${month}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          celebrate();
        }
      }
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }, [month, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/budgets", {
        categoryId: form.categoryId,
        month,
        limit: Number(form.limit),
      });
      addToast({ type: "success", message: "Budget saved" });
      setOpen(false);
      setForm({ categoryId: "", limit: "" });
      load();
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    try {
      await api.delete(`/budgets/${deleteTarget._id}`);
      addToast({ type: "success", message: "Budget removed" });
      load();
    } catch (e) {
      addToast({ type: "error", message: e.message });
    }
  }

  function shiftMonth(delta) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(monthKey(d));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Budget goals"
        subtitle={`Monthly limits · ${monthLabel(month)}`}
        breadcrumbs={[{ label: "Budgets" }]}
        actions={
          <>
            <div className="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => shiftMonth(-1)}
                className="px-2.5 py-2 text-zinc-500 hover:text-honey-600"
              >
                ‹
              </button>
              <span className="px-2 text-xs font-medium">{monthLabel(month)}</span>
              <button
                onClick={() => shiftMonth(1)}
                className="px-2.5 py-2 text-zinc-500 hover:text-honey-600"
              >
                ›
              </button>
            </div>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> New budget
            </Button>
          </>
        }
      />

      {loading ? (
        <SkeletonList count={4} />
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No budgets for this month"
          description="Set a monthly spending limit per category to stay on track."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Create budget
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b, i) => {
            const pct = b.percentage || 0;
            const status =
              pct >= 100 ? "exceeded" : pct >= 80 ? "warning" : "ok";
            return (
              <motion.div
                key={b._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card-hover group p-5"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                      style={{
                        background: `${b.categoryId?.color || "#F59E0B"}22`,
                        color: b.categoryId?.color || "#F59E0B",
                      }}
                    >
                      {(b.categoryId?.name || "?").charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{b.categoryId?.name}</p>
                      <p className="text-xs text-zinc-400">
                        {formatMoney(b.spent, currency)} of {formatMoney(b.limit, currency)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(b)}
                    className="rounded p-1.5 text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span
                    className={cn(
                      "font-medium",
                      status === "exceeded"
                        ? "text-rose-500"
                        : status === "warning"
                          ? "text-amber-500"
                          : "text-emerald-500"
                    )}
                  >
                    {pct}%
                  </span>
                  <span className="text-zinc-400">
                    {formatMoney(Math.max(0, b.limit - b.spent), currency)} left
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, pct)}%` }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 + i * 0.05 }}
                    className={cn(
                      "h-full rounded-full",
                      status === "exceeded"
                        ? "bg-rose-500"
                        : status === "warning"
                          ? "bg-amber-500"
                          : "bg-gradient-to-r from-honey-500 to-honey-400"
                    )}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New budget">
        <form onSubmit={onSubmit} className="space-y-4">
          <Select
            label="Expense category"
            name="categoryId"
            required
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">Select category...</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label={`Monthly limit (${currency})`}
            name="limit"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="e.g. 3000"
            value={form.limit}
            onChange={(e) => setForm({ ...form, limit: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Save budget
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remove budget?"
        message={`Delete the ${deleteTarget?.categoryId?.name} budget for ${monthLabel(month)}?`}
        confirmLabel="Remove"
      />
    </div>
  );
}
