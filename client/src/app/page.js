"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Hexagon, ArrowRight, Sparkles, BarChart3, Wallet, Shield } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Quick Logging",
    desc: "Log income & expenses in seconds with student-friendly categories.",
  },
  {
    icon: BarChart3,
    title: "Smart Reports",
    desc: "Category breakdowns, 6-month trends, daily & weekly summaries.",
  },
  {
    icon: Sparkles,
    title: "Saving Tips",
    desc: "Personalized tips ranked by impact, driven by your own history.",
  },
  {
    icon: Shield,
    title: "Budget Alerts",
    desc: "In-app alerts when a category nears or exceeds its monthly limit.",
  },
];

const sitemap = [
  { label: "Auth", children: ["Login", "Register", "Forgot Password"] },
  { label: "Dashboard", children: ["Overview", "Balance", "Top Category"] },
  { label: "Money", children: ["Transactions", "Budgets", "Categories"] },
  { label: "Insights", children: ["Reports", "Saving Tips", "Bookmarks"] },
  { label: "Account", children: ["Profile", "Notifications"] },
  { label: "Admin", children: ["Stats", "Users", "Announcements"] },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center">
            <Hexagon className="h-9 w-9 fill-honey-500/20 text-honey-500" />
            <span className="absolute text-sm font-bold text-honey-600 dark:text-honey-400">₵</span>
          </div>
          <div>
            <p className="text-sm font-bold">Campus Coin</p>
            <p className="text-[10px] uppercase tracking-widest text-honey-600">BudgetBee</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm">
            Login
          </Link>
          <Link href="/register" className="btn-honey text-sm">
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 text-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-honey-500/20 blur-3xl" />
          <div className="absolute right-1/4 top-40 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-honey-500/30 bg-honey-500/10 px-4 py-1.5 text-xs font-medium text-honey-700 dark:text-honey-300">
            <Sparkles className="h-3.5 w-3.5" /> NextGen BudgetBee · End-to-End Web Solutions
          </span>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Take control of your{" "}
            <span className="bg-gradient-to-r from-honey-500 to-amber-300 bg-clip-text text-transparent">
              student money
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm text-zinc-500 sm:text-base dark:text-zinc-400">
            Log expenses, set budgets, and get plain-language saving tips — built for hostel
            life, canteen runs, and scholarship season.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-honey px-6 py-3 text-base">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn-ghost px-6 py-3 text-base">
              I have an account
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="glass-card p-5"
            >
              <div className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-honey-500/20 to-honey-400/5 p-3">
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

      {/* Visual Sitemap */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold">Explore the app</h2>
          <p className="mt-2 text-sm text-zinc-500">Visual sitemap of every section</p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="glass-card relative overflow-hidden p-6 sm:p-8"
        >
          {/* Root */}
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
                transition={{ delay: i * 0.06 }}
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

      <footer className="border-t border-zinc-200 py-8 text-center text-xs text-zinc-400 dark:border-zinc-800">
        Campus Coin · NextGen BudgetBee · Built for campus financial literacy
      </footer>
    </div>
  );
}
