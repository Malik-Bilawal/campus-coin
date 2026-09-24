"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, ArrowLeft, User, Target, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CURRENCIES } from "@/lib/utils";
import { AuthShell, AuthError, StepDots } from "@/components/auth/AuthShell";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { celebrate } from "@/lib/confetti";

const stepMeta = [
  { title: "Create your account", subtitle: "Step 1 of 2 · Your identity", icon: User },
  { title: "Money profile", subtitle: "Step 2 of 2 · Optional, improves tips", icon: Target },
];

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const addToast = useUIStore((s) => s.addToast);

  const [step, setStep] = useState(0);
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

  function goNext(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Please enter your name");
    if (!form.email.trim()) return setError("Please enter your email");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    setStep(1);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await register({
        ...payload,
        allowanceBaseline: Number(payload.allowanceBaseline) || 0,
        savingsGoal: Number(payload.savingsGoal) || 0,
      });
      celebrate({ particleCount: 80, origin: { y: 0.6 } });
      addToast({ type: "success", message: "Account created — welcome to Campus Coin!" });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
      setStep(0);
    } finally {
      setLoading(false);
    }
  }

  const meta = stepMeta[step];

  return (
    <AuthShell
      wide
      title={meta.title}
      subtitle={meta.subtitle}
      footer={
        <>
          Already registered?{" "}
          <Link
            href="/login"
            className="font-medium text-honey-600 hover:underline dark:text-honey-400"
          >
            Sign in
          </Link>
        </>
      }
    >
      <StepDots total={2} current={step} />

      <AnimatePresence mode="wait">
        <motion.form
          key={step}
          initial={{ opacity: 0, x: step === 1 ? 32 : -32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: step === 1 ? -32 : 32 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          onSubmit={step === 0 ? goNext : onSubmit}
          className="space-y-4"
        >
          <AuthError message={error} />

          {step === 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  name="name"
                  required
                  placeholder="Ayesha Rahman"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  autoFocus
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

              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Create a password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-3 top-[34px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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

              <Button type="submit" className="w-full py-3">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="rounded-xl border border-honey-500/20 bg-honey-500/5 p-3.5 text-xs text-zinc-500 dark:text-zinc-400">
                These help us personalize budgets and tips. You can change them later in Profile.
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Academic year"
                  name="academicYear"
                  placeholder="e.g. 3rd Year"
                  value={form.academicYear}
                  onChange={(e) => set("academicYear", e.target.value)}
                  autoFocus
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

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="ghost" onClick={() => setStep(0)} className="flex-1">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="submit" isLoading={loading} className="flex-[2] py-3">
                  Create account <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </motion.form>
      </AnimatePresence>
    </AuthShell>
  );
}
