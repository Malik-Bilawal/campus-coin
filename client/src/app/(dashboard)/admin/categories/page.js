"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/EmptyState";

export default function AdminCategoriesPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: "", type: "expense", icon: "tag", color: "#F59E0B" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/admin/categories");
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
    setForm({ name: c.name, type: c.type, icon: c.icon, color: c.color });
    setOpen(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) {
        await api.patch(`/admin/categories/${editTarget._id}`, form);
        addToast({ type: "success", message: "Category updated" });
      } else {
        await api.post("/admin/categories", form);
        addToast({ type: "success", message: "Default category created" });
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
      await api.delete(`/admin/categories/${deleteTarget._id}`);
      addToast({ type: "success", message: "Deleted" });
      load();
    } catch (e) {
      addToast({ type: "error", message: e.message });
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Default categories"
        subtitle="System-wide categories available to all students"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Categories" },
        ]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New default
          </Button>
        }
      />

      {loading ? (
        <SkeletonList count={5} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, i) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card-hover group p-4"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl font-bold"
                  style={{ background: `${c.color}22`, color: c.color }}
                >
                  {c.name.charAt(0)}
                </div>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(c)}
                    className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(c)}
                    className="rounded p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm font-semibold">{c.name}</p>
              <span
                className={cn(
                  "mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                  c.type === "income"
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-rose-500/15 text-rose-600"
                )}
              >
                {c.type}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editTarget ? "Edit default category" : "New default category"}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Name"
            name="name"
            required
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
            <label className="mb-1.5 block text-xs font-medium">Color</label>
            <div className="flex flex-wrap gap-2">
              {["#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444"].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={cn(
                    "h-8 w-8 rounded-full transition",
                    form.color === color && "ring-2 ring-offset-2 ring-honey-500"
                  )}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete default category?"
        message={`"${deleteTarget?.name}" will be removed from system defaults.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
