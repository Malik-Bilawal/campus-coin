"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/ui";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthShell, AuthError } from "@/components/auth/AuthShell";
import { PasswordStrength } from "@/components/auth/PasswordStrength";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const addToast = useUIStore((s) => s.addToast);

  const [form, setForm] = useState({
    token: params.get("token") || "",
    password: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
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
      setTimeout(() => router.push("/login"), 2200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You'll be redirected to login in a moment.">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex flex-col items-center py-6 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Your password was reset successfully.
          </p>
          <Link href="/login" className="btn-honey mt-6 px-6 py-2.5">
            Go to login
          </Link>
        </motion.div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Choose a new password for your account."
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-zinc-500 transition hover:text-honey-600 dark:hover:text-honey-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthError message={error} />

        {!params.get("token") && (
          <>
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
              No reset token in the URL — paste the token from your email below.
            </div>
            <Input
              label="Reset token"
              name="token"
              required
              placeholder="Paste token from email/link"
              value={form.token}
              onChange={(e) => set("token", e.target.value)}
            />
          </>
        )}

        <div>
          <Input
            label="New password"
            name="password"
            type={showPw ? "text" : "password"}
            required
            minLength={6}
            placeholder="Create a new password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            autoFocus
            trailing={
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <PasswordStrength password={form.password} />
        </div>

        <Input
          label="Confirm password"
          name="confirmPassword"
          type={showPw ? "text" : "password"}
          required
          placeholder="Repeat password"
          value={form.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
          error={
            form.confirmPassword && form.password !== form.confirmPassword
              ? "Passwords do not match"
              : undefined
          }
        />

        <Button type="submit" isLoading={loading} className="w-full py-3">
          <KeyRound className="h-4 w-4" /> Update password
        </Button>

        <p className="rounded-xl border border-zinc-200 bg-zinc-100/70 p-3 text-xs text-zinc-500 dark:border-zinc-700/60 dark:bg-zinc-800/40 dark:text-zinc-400">
          Tip: use a passphrase of 3–4 unrelated words — stronger and easier to remember.
        </p>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
