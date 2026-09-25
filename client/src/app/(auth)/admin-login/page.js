"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthShell, AuthError } from "@/components/auth/AuthShell";

export default function AdminLoginPage() {
  const router = useRouter();
  const adminLogin = useAuthStore((s) => s.adminLogin);
  const addToast = useUIStore((s) => s.addToast);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await adminLogin(form.email, form.password);
      addToast({ type: "success", message: `Welcome, ${user.name}` });
      router.push("/admin");
    } catch (err) {
      setError(err.message || "Admin sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Admin access"
      subtitle="Sign in to the Campus Coin administration console."
      footer={
        <>
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-rose-500" />
          Staff accounts only ·{" "}
          <Link
            href="/login"
            className="font-medium text-honey-600 hover:underline dark:text-honey-400"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthError message={error} />

        <Input
          label="Admin email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="admin@campuscoin.app"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <Input
          label="Password"
          name="password"
          type={showPw ? "text" : "password"}
          autoComplete="current-password"
          required
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
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

        <motion.div whileTap={{ scale: 0.99 }}>
          <Button type="submit" isLoading={loading} className="w-full py-3">
            Sign in as admin <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </form>

      <p className="mt-5 text-center text-[11px] text-zinc-400">
        Student?{" "}
        <Link
          href="/login"
          className="font-medium text-honey-600 hover:underline dark:text-honey-400"
        >
          Use the regular sign-in
        </Link>
      </p>
    </AuthShell>
  );
}
