"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Hexagon,
  ArrowRight,
  Sparkles,
  BarChart3,
  Wallet,
  Bot,
  Bell,
  Target,
  Trophy,
  Upload,
  Moon,
  Quote,
  CheckCircle2,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Quick logging",
    desc: "Income & expenses in seconds with student-friendly categories and live AI auto-tag.",
  },
  {
    icon: Target,
    title: "Budgets that bite",
    desc: "Per-category monthly limits with in-app alerts before you overspend.",
  },
  {
    icon: Bot,
    title: "AI money coach",
    desc: "Categorize, chat, and get monthly plain-language insights — with rule-based fallback.",
  },
  {
    icon: BarChart3,
    title: "Smart reports",
    desc: "Donut breakdowns, 6-month trends, daily & weekly summaries, PDF export.",
  },
  {
    icon: Upload,
    title: "CSV import",
    desc: "Bulk-import bank or e-wallet statements and sort them in one pass.",
  },
  {
    icon: Trophy,
    title: "Streaks & goals",
    desc: "Log every day, hit savings goals, and celebrate with confetti moments.",
  },
  {
    icon: Bell,
    title: "Live toasts",
    desc: "WebSocket-powered notifications that land the moment something happens.",
  },
  {
    icon: Moon,
    title: "Built for night owls",
    desc: "Dark mode by default, glass UI, and adjustable font sizes for late-night study.",
  },
];

const steps = [
  {
    n: "01",
    title: "Create your account",
    desc: "Two-step signup with your allowance, currency, and savings goal.",
  },
  {
    n: "02",
    title: "Log money in seconds",
    desc: "Add income or expenses — AI suggests the category as you type.",
  },
  {
    n: "03",
    title: "Budget & get coached",
    desc: "Set limits, watch streaks, and let the AI coach surface savings wins.",
  },
];

const sitemap = [
  { label: "Auth", children: ["Login", "Register", "Forgot / Reset"] },
  { label: "Dashboard", children: ["Overview", "Balance", "Streak", "Live dot"] },
  { label: "Money", children: ["Transactions", "Budgets", "Categories", "CSV import"] },
  { label: "Insights", children: ["Reports", "AI Insights", "Tips", "Bookmarks"] },
  { label: "Account", children: ["Profile", "Notifications", "Dark mode"] },
  { label: "Admin", children: ["Stats", "Users", "Announcements", "Health"] },
];

const testimonials = [
  {
    quote:
      "Finally an app that speaks hostel-budget, not corporate finance. The AI tips actually matched my canteen habits.",
    name: "Ayesha R.",
    role: "3rd Year, CSE",
  },
  {
    quote:
      "Budget alerts saved me mid-month. I almost blew my transport limit — got a toast and fixed it same day.",
    name: "Tanvir H.",
    role: "2nd Year, BBA",
  },
  {
    quote:
      "Streaks + confetti sound silly until you've logged 14 days straight and hit your savings goal.",
    name: "Nusrat J.",
    role: "Final Year, Architecture",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <div className="relative flex h-9 w-9 items-center justify-center transition-transform group-hover:scale-105">
        <Hexagon className="h-9 w-9 fill-honey-500/20 text-honey-500" />
        <span className="absolute text-sm font-bold text-honey-600 dark:text-honey-400">₵</span>
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

function MockDashboard() {
  const bars = [42, 58, 36, 72, 48, 88, 64];
  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* glow */}
      <div className="absolute -inset-4 rounded-3xl bg-honey-500/10 blur-3xl" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.25 }}
        style={{ transformPerspective: 1000 }}
        className="relative rounded-2xl border border-honey-500/20 bg-zinc-900/90 p-5 shadow-glass-lg backdrop-blur-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">This month</p>
            <p className="text-2xl font-bold text-white">
              ৳12,450<span className="ml-2 text-xs font-medium text-emerald-400">↓ 8% vs last</span>
            </p>
          </div>
          <div className="rounded-lg bg-honey-500/15 px-2.5 py-1.5 text-[10px] font-semibold text-honey-400">
            On track
          </div>
        </div>

        <div className="mb-4 flex h-24 items-end gap-1.5">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 4 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.45, ease: "easeOut" }}
              className="flex-1 rounded-t-md bg-gradient-to-t from-honey-600/80 to-honey-400"
            />
          ))}
        </div>

        <div className="space-y-2">
          {[
            { label: "Food & canteen", pct: 72, color: "bg-honey-500" },
            { label: "Transport", pct: 45, color: "bg-sky-500" },
            { label: "Books", pct: 30, color: "bg-emerald-500" },
          ].map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex justify-between text-[10px] text-zinc-400">
                <span>{row.label}</span>
                <span>{row.pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${row.pct}%` }}
                  transition={{ delay: 0.8, duration: 0.7, ease: "easeOut" }}
                  className={`h-full rounded-full ${row.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* floating chips */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 0.45 }}
        className="absolute -left-6 top-10 hidden rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-md sm:block dark:bg-zinc-900/80"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-honey-400" />
          <div>
            <p className="text-[9px] text-zinc-400">AI insight</p>
            <p className="text-[11px] font-medium text-white">Cut snacks 15% → save ৳800</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1, duration: 0.45 }}
        className="absolute -right-4 bottom-8 hidden rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-md sm:block dark:bg-zinc-900/80"
      >
        <div className="flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5 text-amber-400" />
          <div>
            <p className="text-[9px] text-zinc-400">Streak</p>
            <p className="text-[11px] font-medium text-white">14 days and counting</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200/60 bg-zinc-50/80 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="hidden items-center gap-7 text-sm text-zinc-500 md:flex">
            <a href="#features" className="transition hover:text-honey-600">
              Features
            </a>
            <a href="#how" className="transition hover:text-honey-600">
              How it works
            </a>
            <a href="#ai" className="transition hover:text-honey-600">
              AI coach
            </a>
            <a href="#sitemap" className="transition hover:text-honey-600">
              Sitemap
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">
              Sign in
            </Link>
            <Link href="/register" className="btn-honey text-sm">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-honey-500/12 blur-[110px]" />
          <div
            className="absolute inset-0 opacity-[0.05] dark:opacity-[0.07]"
            style={{
              backgroundImage: "radial-gradient(rgba(245,158,11,0.9) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
            }}
          />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 pt-16 lg:grid-cols-2 lg:gap-10 lg:pt-24">
          <div className="text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-honey-500/35 bg-honey-500/12 px-4 py-1.5 text-xs font-semibold tracking-wide text-honey-700 dark:text-honey-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              New · AI money coach built in
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.55 }}
              className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.06]"
            >
              Take control of your{" "}
              <span className="text-honey-600 dark:text-honey-400">student money</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.55 }}
              className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-zinc-500 sm:text-base lg:mx-0 dark:text-zinc-400"
            >
              Log expenses in seconds, set per-category budgets, and get plain-language saving
              tips — built for hostel life, canteen runs, and scholarship season.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.55 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <Link href="/register" className="btn-honey px-6 py-3 text-base shadow-honey">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-ghost px-6 py-3 text-base">
                Try the demo
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-400 lg:justify-start"
            >
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Free forever for students
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Setup takes under a minute
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Works on any device
              </span>
            </motion.div>
          </div>

          <MockDashboard />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <motion.div {...fadeUp} className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-honey-600 dark:text-honey-400">
            Features
          </p>
          <h2 className="text-3xl font-bold tracking-tight">Everything a student budget needs</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
            Full CRUD, real-time alerts, AI assist, and admin tooling — all in one clean workspace.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: (i % 4) * 0.07 }}
              className="glass-card-hover group p-5"
            >
              <div className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-honey-500/20 to-honey-400/5 p-3 transition-transform group-hover:scale-105">
                <f.icon className="h-5 w-5 text-honey-600 dark:text-honey-400" />
              </div>
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how"
        className="relative scroll-mt-20 border-y border-zinc-200 bg-white/50 py-20 dark:border-zinc-800 dark:bg-zinc-900/30"
      >
        <div className="mx-auto max-w-6xl px-6">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-honey-600 dark:text-honey-400">
              How it works
            </p>
            <h2 className="text-3xl font-bold tracking-tight">Up and running in 3 steps</h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className="relative glass-card p-6"
              >
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-honey-500 to-honey-400 text-sm font-extrabold text-zinc-900 shadow-honey">
                  {s.n}
                </span>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {s.desc}
                </p>
                {i < steps.length - 1 && (
                  <div className="absolute -right-3 top-1/2 hidden h-px w-6 bg-honey-500/40 md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI showcase */}
      <section id="ai" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div {...fadeUp}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-honey-600 dark:text-honey-400">
              AI coach
            </p>
            <h2 className="text-3xl font-bold tracking-tight">
              An AI that explains money like a friend
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Groq primary with OpenRouter fallback — and every feature degrades to smart local
              rules, so the coach keeps working even when an AI provider is down.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Live category suggestions as you type a transaction",
                "Monthly insights: top category, burn rate, one concrete action",
                "Chat widget for \"can I afford…?\" style questions",
                "Batch-categorize imported CSV rows in one call",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-zinc-600 dark:text-zinc-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/register" className="btn-honey mt-8 inline-flex px-5 py-2.5">
              Try the AI coach <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.12 }}
            className="glass-card relative overflow-hidden p-6"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-honey-500/15 blur-3xl" />
            <div className="relative space-y-3">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800">
                  <Users className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-2.5 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  Can I afford a new phone this month?
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-honey-500 to-honey-400 px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-honey">
                  You&apos;ve spent 68% of your budget with 12 days left. Delaying the phone by
                  one month and redirecting ৳1,200 from dining gets you there without going red.
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-honey-500/20">
                  <Bot className="h-4 w-4 text-honey-600 dark:text-honey-400" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-zinc-200 bg-white/50 py-20 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div {...fadeUp} className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-honey-600 dark:text-honey-400">
              Testimonials
            </p>
            <h2 className="text-3xl font-bold tracking-tight">Why students stick with it</h2>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.figure
                key={t.name}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="glass-card flex flex-col p-6"
              >
                <Quote className="mb-3 h-5 w-5 text-honey-500/60" />
                <blockquote className="flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-xs">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-100">{t.name}</span>
                  <span className="text-zinc-400"> · {t.role}</span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* Visual sitemap */}
      <section id="sitemap" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <motion.div {...fadeUp} className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-honey-600 dark:text-honey-400">
            Product tour
          </p>
          <h2 className="text-3xl font-bold tracking-tight">Explore the app</h2>
          <p className="mt-2 text-sm text-zinc-500">Visual sitemap of every screen</p>
        </motion.div>

        <motion.div {...fadeUp} className="glass-card relative overflow-hidden p-6 sm:p-8">
          <div className="mb-6 flex justify-center">
            <div className="rounded-xl bg-gradient-to-r from-honey-500 to-honey-400 px-5 py-2.5 text-sm font-bold text-zinc-900 shadow-honey">
              Campus Coin
            </div>
          </div>
          <div className="mb-4 flex justify-center">
            <div className="h-4 w-px bg-honey-500/40" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {sitemap.map((node, i) => (
              <motion.div
                key={node.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="rounded-xl border border-honey-500/20 bg-white/50 p-4 dark:bg-zinc-900/50"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-honey-500" />
                  <p className="text-xs font-bold uppercase tracking-wider text-honey-600 dark:text-honey-400">
                    {node.label}
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {node.children.map((c) => (
                    <li
                      key={c}
                      className="rounded-md bg-zinc-100/80 px-2.5 py-1.5 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-zinc-200 dark:border-zinc-800">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-honey-500/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready when you are
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
              Free for students — create an account in under a minute, or explore the demo first.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="btn-honey px-7 py-3 text-base">
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-ghost px-7 py-3 text-base">
                Sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-10 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo />
          <p className="text-center text-xs text-zinc-400">
            © {new Date().getFullYear()} Campus Coin · Built for campus financial literacy
          </p>
        </div>
      </footer>
    </div>
  );
}
