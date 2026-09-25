"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Hexagon, Sparkles, TrendingUp, Wallet, BarChart3, Shield } from "lucide-react";

const brandFeatures = [
  { icon: Wallet, text: "Log expenses in seconds" },
  { icon: BarChart3, text: "Budgets, reports & streaks" },
  { icon: Sparkles, text: "AI insights that actually help" },
  { icon: Shield, text: "Email OTP verification" },
];

function BrandLogo({ size = "md" }) {
  const box = size === "lg" ? "h-14 w-14" : "h-9 w-9";
  const glyph = size === "lg" ? "text-xl" : "text-sm";
  return (
    <Link href="/" className="group inline-flex items-center gap-3">
      <div className={`relative flex ${box} items-center justify-center transition-transform group-hover:scale-105`}>
        <Hexagon className="h-full w-full fill-honey-500/20 text-honey-500" />
        <span className={`absolute font-bold text-honey-600 dark:text-honey-400 ${glyph}`}>₵</span>
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold">Campus Coin</p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-honey-600 dark:text-honey-400">
          BudgetBee
        </p>
      </div>
    </Link>
  );
}

function FloatingCard({ className, delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`absolute rounded-2xl border border-white/10 bg-white/10 p-4 shadow-glass backdrop-blur-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function AuthShell({ children, title, subtitle, footer, showBack = true, wide = false, maxWidth = "max-w-md" }) {
  const width = wide ? "max-w-lg" : maxWidth;
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr] xl:grid-cols-2">
        {/* Brand / visual panel */}
        <aside className="relative hidden overflow-hidden bg-zinc-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-40 -top-36 h-[30rem] w-[30rem] rounded-full bg-honey-500/20 blur-[110px]" />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(245,158,11,0.9) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
                maskImage: "radial-gradient(ellipse at 30% 40%, black, transparent 70%)",
              }}
            />
          </div>

          <div className="relative z-10">
            <BrandLogo />
          </div>

          <div className="relative z-10 max-w-lg">
            <motion.span
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-honey-500/30 bg-honey-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-honey-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Free forever for students
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.5 }}
              className="text-3xl font-extrabold leading-[1.15] tracking-tight xl:text-[2.6rem]"
            >
              Master campus money, one{" "}
              <span className="text-honey-400">smart habit</span>{" "}
              at a time.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.5 }}
              className="mt-5 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base"
            >
              Built for hostel life, canteen runs, and scholarship season. Track, budget, and get
              plain-language saving tips powered by AI.
            </motion.p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {brandFeatures.map((f, i) => (
                <motion.div
                  key={f.text}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 + i * 0.07, duration: 0.4 }}
                  className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm transition hover:border-honey-500/30 hover:bg-white/[0.09]"
                >
                  <div className="mt-0.5 rounded-xl bg-gradient-to-br from-honey-500/25 to-honey-500/5 p-2">
                    <f.icon className="h-4 w-4 text-honey-400" />
                  </div>
                  <p className="text-xs leading-snug text-zinc-300">{f.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute right-8 top-1/2 hidden h-56 w-64 -translate-y-1/2 xl:block">
            <FloatingCard className="right-0 top-4 w-52" delay={0.4}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider text-zinc-400">This month</p>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <p className="mt-1.5 text-xl font-bold text-white">৳12,450</p>
              <div className="mt-3 flex h-12 items-end gap-1">
                {[40, 55, 35, 70, 50, 85, 65].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 4 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.55 + i * 0.06, duration: 0.4 }}
                    className="w-full rounded-t-sm bg-gradient-to-t from-honey-600 to-honey-400"
                  />
                ))}
              </div>
            </FloatingCard>
            <FloatingCard className="bottom-8 left-0 w-48" delay={0.55}>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400">AI insight</p>
                  <p className="text-xs font-medium text-white">Cut snacks 15% → save ৳800</p>
                </div>
              </div>
            </FloatingCard>
          </div>

          <p className="relative z-10 text-xs text-zinc-600">
            © {new Date().getFullYear()} Campus Coin · Built for campus financial literacy
          </p>
        </aside>

        {/* Form panel */}
        <main className="relative flex flex-col">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-honey-500/10 blur-3xl" />
          </div>

          <div className="relative z-10 flex items-center justify-between border-b border-zinc-200/60 px-6 py-5 dark:border-zinc-800/60 lg:hidden">
            <BrandLogo />
            <Link href="/" className="text-xs font-medium text-zinc-500 hover:text-honey-600">
              Home
            </Link>
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:py-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className={`w-full ${width}`}
            >
              {showBack && (
                <Link
                  href="/"
                  className="mb-6 hidden items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-honey-600 lg:inline-flex"
                >
                  ← Back to home
                </Link>
              )}

              {/* Form top / header */}
              <div className="mb-7">
                <h1 className="text-[1.7rem] font-extrabold leading-tight tracking-tight sm:text-3xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
                )}
              </div>

              <div className="glass-card relative overflow-hidden p-6 shadow-glass sm:p-8 dark:bg-zinc-900/70">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-honey-500/50 to-transparent" />
                {children}
              </div>

              {footer && (
                <div className="mt-6 text-center text-sm text-zinc-500">{footer}</div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function AuthError({ message }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-600 dark:text-rose-400"
      role="alert"
    >
      {message}
    </motion.div>
  );
}

export function AuthSuccess({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400"
    >
      {children}
    </motion.div>
  );
}

export function StepDots({ total, current }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current
                ? "w-8 bg-honey-500"
                : i < current
                  ? "w-4 bg-honey-500/50"
                  : "w-4 bg-zinc-300 dark:bg-zinc-700"
            }`}
          />
          {i < total - 1 && <span className="h-px w-2 bg-zinc-300 dark:bg-zinc-700" />}
        </div>
      ))}
    </div>
  );
}
