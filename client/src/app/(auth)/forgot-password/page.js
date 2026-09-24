"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/ui";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthShell, AuthError, AuthSuccess } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [devLink, setDevLink] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setDone(true);
      if (res.data?.devResetUrl) setDevLink(res.data.devResetUrl);
      addToast({ type: "success", message: res.message });
    } catch (err) {
      setError(err.message);
      addToast({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={done ? "Check your inbox" : "Forgot password?"}
      subtitle={
        done
          ? "If that email exists, a reset link has been generated."
          : "Enter your email and we'll generate a secure reset link."
      }
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-zinc-500 transition hover:text-honey-600 dark:hover:text-honey-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      }
    >
      {!done ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <AuthError message={error} />
          <Input
            label="Email"
            name="email"
            type="email"
            required
            placeholder="you@campus.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <Button type="submit" isLoading={loading} className="w-full py-3">
            <Mail className="h-4 w-4" /> Send reset link
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="flex flex-col items-center py-2 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <AuthSuccess>
              Reset link generated for <span className="font-semibold">{email}</span>
            </AuthSuccess>
          </motion.div>

          {devLink && (
            <div className="rounded-xl border border-dashed border-zinc-300 p-3.5 dark:border-zinc-700">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Dev reset link
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="flex-1 break-all rounded-lg bg-zinc-100 px-2.5 py-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {devLink}
                </code>
                <Button type="button" size="sm" variant="ghost" onClick={() => window.open(devLink, "_blank")}>
                  Open <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setDone(false);
              setDevLink("");
              setEmail("");
            }}
          >
            Try another email
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
