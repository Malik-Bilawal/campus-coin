"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Save, Lock, Target, GraduationCap, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { CURRENCIES } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/EmptyState";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();
  const addToast = useUIStore((s) => s.addToast);

  const [form, setForm] = useState({
    name: "",
    academicYear: "",
    allowanceBaseline: "",
    savingsGoal: "",
    currency: "BDT",
  });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        academicYear: user.academicYear || "",
        allowanceBaseline: String(user.allowanceBaseline || ""),
        savingsGoal: String(user.savingsGoal || ""),
        currency: user.currency || "BDT",
      });
      setLoading(false);
    }
  }, [user]);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch("/users", {
        ...form,
        allowanceBaseline: Number(form.allowanceBaseline) || 0,
        savingsGoal: Number(form.savingsGoal) || 0,
      });
      updateUser(res.data.user);
      addToast({ type: "success", message: "Profile updated" });
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) {
      addToast({ type: "error", message: "Passwords do not match" });
      return;
    }
    setSavingPw(true);
    try {
      await api.patch("/users/password", {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      addToast({ type: "success", message: "Password updated" });
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setSavingPw(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-12 w-48" />
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Manage your account and preferences"
        breadcrumbs={[{ label: "Profile" }]}
      />

      {/* Avatar card */}
      <Card className="flex items-center gap-5 p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-honey-400 to-honey-600 text-3xl font-bold text-zinc-900 shadow-honey"
        >
          {user?.name?.charAt(0)?.toUpperCase()}
        </motion.div>
        <div>
          <h2 className="text-xl font-bold">{user?.name}</h2>
          <p className="text-sm text-zinc-500">{user?.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-honey-500/15 px-3 py-1 text-xs font-medium capitalize text-honey-700 dark:text-honey-300">
              {user?.role}
            </span>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-600">
              Streak: {user?.loginStreak || 0} days
            </span>
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-600">
              {user?.currency}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <CardHeader title="Personal details" icon={User} />
        <form onSubmit={saveProfile} className="space-y-4">
          <Input
            label="Full name"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Academic year"
              name="academicYear"
              value={form.academicYear}
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
              placeholder="e.g. 3rd Year"
            />
            <Select
              label="Currency"
              name="currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Monthly allowance"
              name="allowanceBaseline"
              type="number"
              min="0"
              value={form.allowanceBaseline}
              onChange={(e) => setForm({ ...form, allowanceBaseline: e.target.value })}
            />
            <Input
              label="Savings goal"
              name="savingsGoal"
              type="number"
              min="0"
              value={form.savingsGoal}
              onChange={(e) => setForm({ ...form, savingsGoal: e.target.value })}
            />
          </div>
          <Button type="submit" isLoading={saving}>
            <Save className="h-4 w-4" /> Save profile
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <CardHeader title="Change password" icon={Lock} />
        <form onSubmit={savePassword} className="space-y-4">
          <Input
            label="Current password"
            name="currentPassword"
            type="password"
            required
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="New password"
              name="newPassword"
              type="password"
              required
              minLength={6}
              value={pw.newPassword}
              onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
            />
            <Input
              label="Confirm new"
              name="confirmPassword"
              type="password"
              required
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            />
          </div>
          <Button type="submit" variant="ghost" isLoading={savingPw}>
            <Lock className="h-4 w-4" /> Update password
          </Button>
        </form>
      </Card>
    </div>
  );
}
