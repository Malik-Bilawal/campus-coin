"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Hexagon, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/ui";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const addToast = useUIStore((s) => s.addToast);

  const [form, setForm] = useState({
    token: params.get("token") || "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        token: form.token,
        password: form.password,
      });
      setDone(true);
      addToast({ type: "success", message: res.message });
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 dark:bg-zinc-900/80"
      >
        <div className="mb-6 text-center">
          <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center">
            <Hexagon className="h-14 w-14 fill-honey-500/20 text-honey-500" />
            <span className="absolute text-lg font-bold text-honey-600">₵</span>
          </div>
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="mt-1 text-sm text-zinc-500">Choose a new password</p>
        </div>

        {done ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Password updated! Redirecting to login...
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-600">
                {error}
              </div>
            )}
            {!params.get("token") && (
              <Input
                label="Reset token"
                name="token"
                required
                placeholder="Paste token from email/link"
                value={form.token}
                onChange={(e) => setForm({ ...form, token: e.target.value })}
              />
            )}
            <Input
              label="New password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Input
              label="Confirm password"
              name="confirmPassword"
              type="password"
              required
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
            <Button type="submit" isLoading={loading} className="w-full py-3">
              Update password
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-honey-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
