"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Hexagon, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CURRENCIES } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const addToast = useUIStore((s) => s.addToast);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    academicYear: "",
    allowanceBaseline: "",
    savingsGoal: "",
    currency: "BDT",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const { confirmPassword, ...payload } = form;
      await register({
        ...payload,
        allowanceBaseline: Number(payload.allowanceBaseline) || 0,
        savingsGoal: Number(payload.savingsGoal) || 0,
      });
      addToast({ type: "success", message: "Account created — welcome to Campus Coin!" });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-honey-500/15 blur-3xl" />
        <div className="absolute -left-32 bottom-1/4 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card relative z-10 w-full max-w-lg p-8 dark:bg-zinc-900/80"
      >
        <div className="mb-6 text-center">
          <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center">
            <Hexagon className="h-14 w-14 fill-honey-500/20 text-honey-500" />
            <span className="absolute text-lg font-bold text-honey-600 dark:text-honey-400">₵</span>
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-500">Start tracking in under a minute</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-600 dark:text-rose-400"
            >
              {error}
            </motion.div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              name="name"
              required
              placeholder="Ayesha Rahman"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              required
              placeholder="you@campus.edu"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-[34px] text-zinc-400 hover:text-zinc-600"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input
              label="Confirm password"
              name="confirmPassword"
              type={showPw ? "text" : "password"}
              required
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Academic year"
              name="academicYear"
              placeholder="e.g. 3rd Year"
              value={form.academicYear}
              onChange={(e) => set("academicYear", e.target.value)}
            />
            <Select
              label="Currency"
              name="currency"
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
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
              placeholder="e.g. 15000"
              value={form.allowanceBaseline}
              onChange={(e) => set("allowanceBaseline", e.target.value)}
            />
            <Input
              label="Savings goal"
              name="savingsGoal"
              type="number"
              min="0"
              placeholder="e.g. 5000"
              value={form.savingsGoal}
              onChange={(e) => set("savingsGoal", e.target.value)}
            />
          </div>

          <Button type="submit" isLoading={loading} className="w-full py-3">
            Create account <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-honey-600 hover:underline dark:text-honey-400">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
