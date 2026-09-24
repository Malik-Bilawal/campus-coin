"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/ui";
import { formatDate, cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState, SkeletonList } from "@/components/ui/EmptyState";

export default function AdminAnnouncementsPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ title: "", body: "", active: true });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/admin/announcements");
      setItems(res.data.announcements);
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
    setForm({ title: "", body: "", active: true });
    setOpen(true);
  }

  function openEdit(a) {
    setEditTarget(a);
    setForm({ title: a.title, body: a.body, active: a.active });
    setOpen(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) {
        await api.patch(`/admin/announcements/${editTarget._id}`, form);
        addToast({ type: "success", message: "Updated" });
      } else {
        await api.post("/admin/announcements", form);
        addToast({ type: "success", message: "Announcement created" });
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
      await api.delete(`/admin/announcements/${deleteTarget._id}`);
      addToast({ type: "success", message: "Deleted" });
      load();
    } catch (e) {
      addToast({ type: "error", message: e.message });
    }
  }

  async function toggleActive(a) {
    try {
      await api.patch(`/admin/announcements/${a._id}`, { active: !a.active });
      load();
    } catch (e) {
      addToast({ type: "error", message: e.message });
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Announcements"
        subtitle="System-wide tip templates and messages"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Announcements" },
        ]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New announcement
          </Button>
        }
      />

      {loading ? (
        <SkeletonList count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          description="Create tips or messages shown across the system."
          action={<Button onClick={openCreate}>Create</Button>}
        />
      ) : (
        <div className="space-y-3">
          {items.map((a, i) => (
            <motion.div
              key={a._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card group p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{a.title}</h3>
                    <button
                      onClick={() => toggleActive(a)}
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-medium uppercase",
                        a.active
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-zinc-500/15 text-zinc-500"
                      )}
                    >
                      {a.active ? "active" : "inactive"}
                    </button>
                  </div>
                  <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{a.body}</p>
                  <p className="mt-2 text-[11px] text-zinc-400">
                    {formatDate(a.createdAt, "medium")}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(a)}
                    className="rounded p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(a)}
                    className="rounded p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editTarget ? "Edit announcement" : "New announcement"}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Title"
            required
            maxLength={120}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Textarea
            label="Body"
            required
            maxLength={500}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 accent-honey-500"
            />
            Active (visible)
          </label>
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
        title="Delete announcement?"
        message={`"${deleteTarget?.title}" will be removed.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
