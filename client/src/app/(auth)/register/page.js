"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CURRENCIES } from "@/lib/utils";
import { api } from "@/lib/api";
import { AuthShell, AuthError, StepDots } from "@/components/auth/AuthShell";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { celebrate } from "@/lib/confetti";

const steps = [
  { title: "Create your account", subtitle: "Step 1 of 3 · Your identity" },
  { title: "Verify your email", subtitle: "Step 2 of 3 · One-time code" },
  { title: "Money profile", subtitle: "Step 3 of 3 · Optional, improves tips" },
];

function OtpBoxes({ value, onChange }) {
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function moveTo(i) {
    refs.current[Math.max(0, Math.min(i, 5))]?.focus();
  }

  // Digits always fill contiguously (no holes), so the string form stays valid.
  function place(i, digits) {
    const start = Math.min(i, value.length);
    const arr = value.split("");
    while (arr.length < 6) arr.push("");
    for (let k = 0; k < digits.length && start + k < 6; k++) arr[start + k] = digits[k];
    onChange(arr.join("").slice(0, 6));
    return Math.min(start + digits.length, 6);
  }

  function onKeyDown(i, e) {
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      moveTo(place(i, e.key));
    } else if (e.key === "Backspace") {
      e.preventDefault();
      if (value[i]) {
        onChange(value.slice(0, i));
        moveTo(i);
      } else if (i > 0) {
        onChange(value.slice(0, i - 1));
        moveTo(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveTo(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      moveTo(i + 1);
    }
  }

  function onPaste(i, e) {
    e.preventDefault();
    const raw = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (raw) moveTo(place(i, raw));
  }

  // Catches browser/keyboard autofill (bypasses keydown).
  function onInput(i, e) {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 1) {
      onChange(raw.slice(0, 6));
      moveTo(Math.min(raw.length, 5));
    } else if (raw.length === 1) {
      moveTo(place(i, raw));
    }
  }

  function onFocus(i, e) {
    if (i > value.length) {
      moveTo(value.length);
      return;
    }
    e.target.select();
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={value[i] || ""}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={(e) => onPaste(i, e)}
          onInput={(e) => onInput(i, e)}
          onFocus={(e) => onFocus(i, e)}
          className="h-12 w-10 rounded-xl border border-zinc-200 bg-white text-center text-lg font-bold tabular-nums text-zinc-900 outline-none transition focus:border-honey-500 focus:ring-2 focus:ring-honey-500/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 sm:h-14 sm:w-12"
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

function RegisterForm() {
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
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const resendTimer = useRef(null);

  useEffect(() => () => clearInterval(resendTimer.current), []);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function requestOtp(e) {
    e?.preventDefault?.();
    setError("");
    if (!form.name.trim()) return setError("Please enter your name");
    if (!form.email.trim()) return setError("Please enter your email");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    try {
      const res = await api.post("/auth/request-otp", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        academicYear: form.academicYear,
        allowanceBaseline: Number(form.allowanceBaseline) || 0,
        savingsGoal: Number(form.savingsGoal) || 0,
        currency: form.currency,
      });
      setDevOtp(res.data?.devOtp || "");
      setOtp("");
      setStep(1);
      setResendIn(30);
      if (resendTimer.current) clearInterval(resendTimer.current);
      resendTimer.current = setInterval(() => {
        setResendIn((s) => {
          if (s <= 1) {
            clearInterval(resendTimer.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      addToast({ type: "success", message: res.message || "Code sent" });
    } catch (err) {
      setError(err.message || "Could not send code");
    } finally {
      setLoading(false);
    }
  }

  async function confirmOtp(e) {
    e.preventDefault();
    setError("");
    const code = otp.replace(/\D/g, "");
    if (code.length !== 6) return setError("Enter the 6-digit code");
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email: form.email.trim(), otp: code });
      setStep(2);
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        email: form.email.trim(),
        otp: otp.replace(/\D/g, ""),
        academicYear: form.academicYear.trim(),
        allowanceBaseline: Number(form.allowanceBaseline) || 0,
        savingsGoal: Number(form.savingsGoal) || 0,
        currency: form.currency,
      });
      celebrate({ particleCount: 80, origin: { y: 0.6 } });
      addToast({ type: "success", message: "Account created — welcome to Campus Coin!" });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
      setStep(1);
    } finally {
      setLoading(false);
    }
  }

  const meta = steps[step];

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
      <StepDots total={3} current={step} />

      <AnimatePresence mode="wait">
        <motion.form
          key={step}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          onSubmit={step === 0 ? requestOtp : step === 1 ? confirmOtp : onSubmit}
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

              <div>
                <Input
                  label="Password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Create a password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
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
                Send verification code <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="rounded-xl border border-honey-500/20 bg-honey-500/5 p-4 text-center">
                <MailCheck className="mx-auto mb-2 h-8 w-8 text-honey-500" />
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  We sent a 6-digit code to
                </p>
                <p className="mt-0.5 text-sm font-semibold">{form.email}</p>
                {devOtp && (
                  <p className="mt-3 rounded-lg border border-dashed border-zinc-300 px-3 py-2 font-mono text-xs text-zinc-500 dark:border-zinc-700">
                    Dev code: <span className="font-bold text-honey-600">{devOtp}</span>
                  </p>
                )}
              </div>

              <OtpBoxes value={otp} onChange={setOtp} />

              <Button type="submit" isLoading={loading} className="w-full py-3" disabled={otp.replace(/\D/g, "").length !== 6}>
                Verify email <ShieldCheck className="h-4 w-4" />
              </Button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="inline-flex items-center gap-1 text-zinc-500 hover:text-honey-600"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Edit details
                </button>
                <button
                  type="button"
                  disabled={resendIn > 0 || loading}
                  onClick={requestOtp}
                  className="text-honey-600 disabled:opacity-50 dark:text-honey-400"
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="rounded-xl border border-honey-500/20 bg-honey-500/5 p-3.5 text-xs text-zinc-500 dark:text-zinc-400">
                Email verified ✓ — these settings personalize budgets and tips.
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
                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-1">
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

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
