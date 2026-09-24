"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Repeat,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { formatMoney, formatDate, cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, SkeletonList } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/Modal";

export default function TransactionsPage() {
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const currency = user?.currency || "BDT";

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "", categoryId: "", q: "", page: 1 });
  const [categories, setCategories] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    api
      .get("/categories")
      .then((r) => setCategories(r.data.categories))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.set("type", filters.type);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.q) params.set("q", filters.q);
      params.set("page", String(filters.page));
      params.set("limit", "15");

      const res = await api.get(`/transactions?${params}`);
      setItems(res.data.transactions);
      setPagination(res.data.pagination);
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }, [filters, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    try {
      await api.delete(`/transactions/${deleteTarget._id}`);
      addToast({ type: "success", message: "Transaction deleted" });
      load();
    } catch (e) {
      addToast({ type: "error", message: e.message });
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transactions"
        subtitle={`${pagination.total} total entries`}
        breadcrumbs={[{ label: "Transactions" }]}
        actions={
          <Link href="/transactions/new">
            <Button>
              <Plus className="h-4 w-4" /> New transaction
            </Button>
          </Link>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search notes..."
              className="pl-9"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })}
            />
          </div>
          <Select
            className="w-auto min-w-[130px]"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
          >
            <option value="">All types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
          <Select
            className="w-auto min-w-[150px]"
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value, page: 1 })}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {loading ? (
        <SkeletonList count={5} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No transactions found"
          description="Add your first income or expense to get started."
          action={
            <Link href="/transactions/new">
              <Button>
                <Plus className="h-4 w-4" /> Add transaction
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {items.map((tx, i) => (
              <motion.div
                key={tx._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card group flex items-center gap-3 p-4"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    background: `${tx.categoryId?.color || "#F59E0B"}22`,
                    color: tx.categoryId?.color || "#F59E0B",
                  }}
                >
                  {(tx.categoryId?.name || "?").charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {tx.note || tx.categoryId?.name || "Transaction"}
                    </p>
                    {tx.isRecurring && (
                      <span className="rounded bg-blue-500/15 p-0.5 text-blue-500" title="Recurring">
                        <Repeat className="h-3 w-3" />
                      </span>
                    )}
                    {tx.flags?.map((f) => (
                      <span
                        key={f}
                        className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600"
                      >
                        {f.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {tx.categoryId?.name} · {formatDate(tx.date, "medium")}
                  </p>
                </div>

                <span
                  className={cn(
                    "money text-sm",
                    tx.type === "income" ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatMoney(tx.amount, currency)}
                </span>

                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <Link
                    href={`/transactions/${tx._id}/edit`}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(tx)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-sm text-zinc-500">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={pagination.page >= pagination.pages}
            onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete transaction?"
        message={`This will permanently remove "${deleteTarget?.note || deleteTarget?.categoryId?.name}" for ${formatMoney(deleteTarget?.amount || 0, currency)}.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
