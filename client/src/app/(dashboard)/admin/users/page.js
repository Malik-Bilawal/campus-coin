"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, ShieldOff, ShieldCheck, KeyRound, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { formatDate, cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { SkeletonList } from "@/components/ui/EmptyState";

export default function AdminUsersPage() {
  const me = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [resetTarget, setResetTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newPw, setNewPw] = useState("Reset@123");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : "";
      const res = await api.get(`/admin/users${params}`);
      setUsers(res.data.users);
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }, [q, addToast]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function toggleActive(u) {
    try {
      await api.patch(`/admin/users/${u.id}/toggle`);
      addToast({ type: "success", message: "User status updated" });
      load();
    } catch (e) {
      addToast({ type: "error", message: e.message });
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/admin/users/${resetTarget.id}/reset-password`, { newPassword: newPw });
      addToast({ type: "success", message: "Password reset" });
      setResetTarget(null);
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      addToast({ type: "success", message: "User deleted" });
      load();
    } catch (e) {
      addToast({ type: "error", message: e.message });
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="User management"
        subtitle="View, disable, or reset student accounts"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}
      />

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <SkeletonList count={5} />
      ) : (
        <div className="space-y-2">
          {users.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card group flex flex-wrap items-center gap-3 p-4"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                  u.role === "admin"
                    ? "bg-purple-500/20 text-purple-600"
                    : "bg-honey-500/20 text-honey-700"
                )}
              >
                {u.name?.charAt(0)}
              </div>
              <div className="min-w-[160px] flex-1">
                <p className="text-sm font-semibold">
                  {u.name}
                  {u.id === me?.id && (
                    <span className="ml-2 text-[10px] text-honey-500">(you)</span>
                  )}
                </p>
                <p className="text-xs text-zinc-400">{u.email}</p>
              </div>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-medium uppercase",
                  u.role === "admin"
                    ? "bg-purple-500/15 text-purple-600"
                    : "bg-blue-500/15 text-blue-600"
                )}
              >
                {u.role}
              </span>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-medium",
                  u.isActive
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-rose-500/15 text-rose-600"
                )}
              >
                {u.isActive ? "active" : "disabled"}
              </span>
              <span className="text-[11px] text-zinc-400">
                {u.createdAt ? formatDate(u.createdAt, "short") : ""}
              </span>

              <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => toggleActive(u)}
                  title={u.isActive ? "Disable" : "Enable"}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                >
                  {u.isActive ? (
                    <ShieldOff className="h-4 w-4" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setResetTarget(u)}
                  title="Reset password"
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-honey-600 dark:hover:bg-zinc-800"
                >
                  <KeyRound className="h-4 w-4" />
                </button>
                {u.role !== "admin" && u.id !== me?.id && (
                  <button
                    onClick={() => setDeleteTarget(u)}
                    title="Delete"
                    className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {users.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-400">No users found</p>
          )}
        </div>
      )}

      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title={`Reset password — ${resetTarget?.name}`}
      >
        <form onSubmit={resetPassword} className="space-y-4">
          <Input
            label="New password"
            name="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
            minLength={6}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Reset
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete user?"
        message={`${deleteTarget?.name} and their data will be permanently removed.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
