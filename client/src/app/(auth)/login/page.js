"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Zap } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthShell, AuthError } from "@/components/auth/AuthShell";

const DEMOS = [
  { label: "Student demo", email: "demo@campuscoin.app", password: "Demo@123" },
  { label: "Admin demo", email: "admin@campuscoin.app", password: "Admin@123" },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const addToast = useUIStore((s) => s.addToast);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function fillDemo(demo) {
    setError("");
    setForm({ email: demo.email, password: demo.password });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      addToast({ type: "success", message: `Welcome back, ${user.name}!` });
      const next = params.get("next");
      router.push(next || (user.role === "admin" ? "/admin" : "/dashboard"));
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue tracking your campus money."
      footer={
        <>
          New here?{" "}
          <Link
            href="/register"
            className="font-medium text-honey-600 hover:underline dark:text-honey-400"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthError message={error} />

        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@campus.edu"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <div className="relative">
          <Input
            label="Password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute right-3 top-[34px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-end text-xs">
          <Link
            href="/forgot-password"
            className="text-honey-600 hover:underline dark:text-honey-400"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" isLoading={loading} className="w-full py-3">
          Sign in <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="mt-6 border-t border-zinc-200 pt-5 dark:border-zinc-700/60">
        <div className="mb-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          <Zap className="h-3 w-3 text-honey-500" /> Quick demo access
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DEMOS.map((d) => (
            <motion.button
              key={d.email}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => fillDemo(d)}
              className="rounded-lg border border-dashed border-zinc-300 px-2 py-2.5 text-[11px] font-medium text-zinc-500 transition hover:border-honey-500/50 hover:bg-honey-500/5 hover:text-honey-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-honey-400"
            >
              {d.label}
              <span className="mt-0.5 block truncate font-mono text-[9px] text-zinc-400 dark:text-zinc-500">
                {d.email}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
