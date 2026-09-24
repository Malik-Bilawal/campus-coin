"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Hexagon, Mail, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/ui";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [devLink, setDevLink] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setDone(true);
      if (res.data?.devResetUrl) setDevLink(res.data.devResetUrl);
      addToast({ type: "success", message: res.message });
    } catch (err) {
      addToast({ type: "error", message: err.message });
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
            <Mail className="absolute h-5 w-5 text-honey-600 dark:text-honey-400" />
          </div>
          <h1 className="text-2xl font-bold">Forgot password?</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Enter your email and we&apos;ll generate a reset link
          </p>
        </div>

        {!done ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              required
              placeholder="you@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" isLoading={loading} className="w-full py-3">
              Send reset link
            </Button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
              If that email exists, a reset link has been generated.
            </div>
            {devLink && (
              <div className="rounded-lg border border-dashed border-zinc-300 p-3 text-left dark:border-zinc-700">
                <p className="mb-1 text-[11px] font-medium text-zinc-400">Dev reset link:</p>
                <a href={devLink} className="break-all text-xs text-honey-600 hover:underline">
                  {devLink}
                </a>
              </div>
            )}
          </div>
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
