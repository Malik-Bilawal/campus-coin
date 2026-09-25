"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, SkeletonList } from "@/components/ui/EmptyState";

export default function CategoriesPage() {
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const isAdmin = user?.role === "admin";

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [owner, setOwner] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: "", type: "expense", icon: "tag", color: "#F59E0B" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/categories");
      setCategories(res.data.categories);
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditTarget(null);
    setForm({ name: "", type: "expense", icon: "tag", color: "#F59E0B" });
    setOpen(true);
  }

  function openEdit(c) {
    setEditTarget(c);
    setForm({ name: c.name, type: c.type, icon: c.icon || "tag", color: c.color || "#F59E0B" });
    setOpen(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) {
        await api.patch(`/categories/${editTarget._id}`, form);
        addToast({ type: "success", message: "Category updated" });
      } else {
        await api.post("/categories", form);
        addToast({ type: "success", message: "Category created" });
      }
      setOpen(false);
      load();
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    try {
      await api.delete(`/categories/${deleteTarget._id}`);
      addToast({ type: "success", message: "Category deleted" });
      load();
    } catch (e) {
      addToast({ type: "error", message: e.message });
    }
  }

  const filtersActive = filter !== "all" || owner !== "all" || q.trim() !== "";
  const filtered = categories.filter((c) => {
    const typeOk = filter === "all" || c.type === filter;
    const ownerOk = owner === "all" || (owner === "mine" ? c.userId !== null : c.userId === null);
    const query = q.trim().toLowerCase();
    const qOk = !query || (c.name || "").toLowerCase().includes(query);
    return typeOk && ownerOk && qOk;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manage categories"
        subtitle="Your income & expense categories"
        breadcrumbs={[{ label: "Categories" }]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New category
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          name="search"
          placeholder="Search categories..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full sm:w-64"
        />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Source filter">
          <span className="text-xs font-medium text-zinc-400">Source</span>
          {[
            { value: "all", label: "All" },
            { value: "mine", label: "Mine" },
            { value: "default", label: "Default" },
          ].map((o) => (
            <button
              key={o.value}
              onClick={() => setOwner(o.value)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                owner === o.value
                  ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Type filter">
        <span className="text-xs font-medium text-zinc-400">Type</span>
        {["all", "income", "expense"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium capitalize transition",
              filter === f
                ? "bg-honey-500 text-zinc-900 shadow-honey"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={filtersActive ? "No categories match" : "No categories"}
          description={
            filtersActive
              ? "Try a different search or filter."
              : "Create categories to organize your money."
          }
          action={filtersActive ? undefined : <Button onClick={openCreate}>Create category</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {filtered.map((c, i) => (
              <motion.div
                key={c._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card-hover group p-4"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold"
                    style={{ background: `${c.color}22`, color: c.color }}
                  >
                    {(c.name || "?").charAt(0).toUpperCase()}
                  </div>
                  {c.userId !== null && (
                    <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => openEdit(c)}
                        aria-label={`Edit ${c.name}`}
                        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        aria-label={`Delete ${c.name}`}
                        className="rounded p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold">{c.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                      c.type === "income"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-rose-500/15 text-rose-600"
                    )}
                  >
                    {c.type}
                  </span>
                  {c.userId === null && (
                    <span className="rounded bg-zinc-500/15 px-1.5 py-0.5 text-[10px] text-zinc-500">
                      default
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editTarget ? "Edit category" : "New category"}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Name"
            name="name"
            required
            maxLength={50}
            placeholder="e.g. Coffee"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Select
            label="Type"
            name="type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {["#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444", "#06B6D4", "#64748B"].map(
                (color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={cn(
                      "h-8 w-8 rounded-full transition",
                      form.color === color
                        ? "ring-2 ring-offset-2 ring-honey-500 dark:ring-offset-zinc-900"
                        : "hover:scale-110"
                    )}
                    style={{ background: color }}
                  />
                )
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              {editTarget ? "Save changes" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete category?"
        message={`"${deleteTarget?.name}" will be removed. Categories with transactions cannot be deleted.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
