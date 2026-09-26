"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Hexagon,
  ArrowRight,
  Sparkles,
  BarChart3,
  Bot,
  Upload,
  Trophy,
  Quote,
  CheckCircle2,
} from "lucide-react";

const compactFeatures = [
  {
    icon: Bot,
    title: "AI money coach",
    desc: "Category suggestions as you type, a chat widget for \"can I afford…?\", and monthly plain-language insights.",
  },
  {
    icon: BarChart3,
    title: "Reports you can act on",
    desc: "Category donuts, 6-month trends, daily & weekly summaries, and one-click PDF export.",
  },
  {
    icon: Upload,
    title: "CSV import",
    desc: "Drop in a bank or bKash statement and auto-categorize the whole month in one pass.",
  },
  {
    icon: Trophy,
    title: "Streaks & savings goals",
    desc: "Daily logging streaks, goal progress, and confetti when you actually hit the target.",
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

const testimonials = [
  {
    quote:
      "Finally an app that speaks hostel-budget, not corporate finance. The AI tips actually matched my canteen habits.",
    name: "Ayesha R.",
    role: "3rd Year, CSE",
    initials: "AR",
    color: "bg-honey-500/20 text-honey-700 dark:text-honey-300",
  },
  {
    quote:
      "Budget alerts saved me mid-month. I almost blew my transport limit — got a toast and fixed it same day.",
    name: "Tanvir H.",
    role: "2nd Year, BBA",
    initials: "TH",
    color: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  },
  {
    quote:
      "Streaks + confetti sound silly until you've logged 14 days straight and hit your savings goal.",
    name: "Nusrat J.",
    role: "Final Year, Architecture",
    initials: "NJ",
    color: "bg-sky-500/20 text-sky-700 dark:text-sky-300",
  },
];

const gallery = [
  {
    src: "/shots/reports.png",
    url: "campuscoin.app/reports",
    title: "Monthly reports",
    desc: "Category donuts, 6-month trends, and PDF export.",
  },
  {
    src: "/shots/insights.png",
    url: "campuscoin.app/insights",
    title: "AI insights",
    desc: "A plain-language monthly narrative with one clear next step.",
  },
  {
    src: "/shots/import.png",
    url: "campuscoin.app/transactions/import",
    title: "CSV import",
    desc: "Paste a statement, auto-categorize every row in bulk.",
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
      <div className="leading-tight hidden min-[440px]:block">
        <p className="text-sm font-bold">Campus Coin</p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-honey-600 dark:text-honey-400">
          BudgetBee
        </p>
      </div>
    </Link>
  );
}

function BrowserFrame({ src, alt, url, className = "" }) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-zinc-300/70 bg-zinc-100 shadow-glass-lg dark:border-zinc-700/60 dark:bg-zinc-900 ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b border-zinc-200/80 bg-white/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 truncate rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {url}
        </span>
      </div>
      <Image src={src} alt={alt} width={1440} height={900} className="block w-full" />
    </div>
  );
}

function FeatureRow({ eyebrow, title, desc, bullets, shot, alt, url, reversed = false }) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
      <motion.div {...fadeUp} className={reversed ? "lg:order-2" : ""}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-honey-600 dark:text-honey-400">
          {eyebrow}
        </p>
        <h3 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{desc}</p>
        <ul className="mt-5 space-y-2.5">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2.5 text-sm text-zinc-600 dark:text-zinc-300"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              {b}
            </li>
          ))}
        </ul>
      </motion.div>
      <motion.div
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.1 }}
        className={reversed ? "lg:order-1" : ""}
      >
        <BrowserFrame src={shot} alt={alt} url={url} />
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
              Screens
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/login" className="btn-ghost whitespace-nowrap text-sm">
              Sign in
            </Link>
            <Link href="/register" className="btn-honey whitespace-nowrap text-sm">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-honey-500/10 blur-[110px]" />
          <div
            className="absolute inset-0 opacity-[0.05] dark:opacity-[0.07]"
            style={{
              backgroundImage: "radial-gradient(rgba(245,158,11,0.9) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
            }}
          />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-14 lg:grid-cols-2 lg:gap-10 lg:pt-20">
          <div className="text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-honey-500/35 bg-honey-500/12 px-4 py-1.5 text-xs font-semibold tracking-wide text-honey-700 dark:text-honey-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Free forever for students
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.55 }}
              className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.4rem] lg:leading-[1.07]"
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
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> No card required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Setup in under a minute
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Works on any device
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 8 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.25 }}
            style={{ transformPerspective: 1000 }}
            className="relative mx-auto w-full max-w-xl"
          >
            <div
              className="absolute -inset-4 rounded-3xl bg-honey-500/10 blur-3xl"
              aria-hidden
            />
            <BrowserFrame
              src="/shots/dashboard.png"
              alt="Campus Coin dashboard showing net balance, budgets and recent transactions"
              url="campuscoin.app/dashboard"
              className="relative"
            />
          </motion.div>
        </div>

        {/* Product facts strip */}
        <div className="border-y border-zinc-200 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2.5 px-6 py-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>BDT-first tracking</span>
            <span className="hidden text-zinc-300 sm:block dark:text-zinc-700">•</span>
            <span>Realtime budget alerts</span>
            <span className="hidden text-zinc-300 sm:block dark:text-zinc-700">•</span>
            <span>PDF report exports</span>
            <span className="hidden text-zinc-300 sm:block dark:text-zinc-700">•</span>
            <span>100% free for students</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <motion.div {...fadeUp} className="mb-12 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-honey-600 dark:text-honey-400">
            Features
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            Built for the way students actually spend
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Everything you need to track, plan, and understand your money — no finance degree
            required.
          </p>
        </motion.div>

        <div className="space-y-16">
          <motion.div {...fadeUp}>
            <FeatureRow
              eyebrow="Transactions"
              title="Log money in seconds"
              desc="Income or expense in two taps. Pick a category — AI suggests one as you type — add a note, and you're done. Everything stays editable and searchable."
              bullets={[
                "AI category suggestions while you type",
                "Search, filter, edit and delete anytime",
                "Recurring-friendly manual entry",
              ]}
              shot="/shots/transactions.png"
              alt="Transactions list with search and filters"
              url="campuscoin.app/transactions"
            />
          </motion.div>

          <motion.div {...fadeUp}>
            <FeatureRow
              reversed
              eyebrow="Budgets"
              title="Budgets that warn you before the money's gone"
              desc="Set a monthly limit per category. Campus Coin tracks as you spend and pushes a live alert the moment you're close — so the correction happens mid-month, not after."
              bullets={[
                "Per-category monthly limits",
                "Live alerts over WebSocket, the second you cross the line",
                "Budget vs actual on every dashboard",
              ]}
              shot="/shots/budgets.png"
              alt="Budget goals with progress bars"
              url="campuscoin.app/budgets"
            />
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {compactFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: (i % 2) * 0.08 }}
                className="glass-card-hover group flex gap-4 p-5"
              >
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-honey-500/20 to-honey-400/5 transition-transform group-hover:scale-105">
                  <f.icon className="h-5 w-5 text-honey-600 dark:text-honey-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
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
              Ask &ldquo;can I afford…?&rdquo; and get an answer grounded in your actual numbers.
              If the AI provider ever has a bad day, smart local rules keep the insights flowing —
              the coach never goes dark.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Live category suggestions as you type a transaction",
                "Monthly insights: top category, burn rate, one concrete action",
                "Chat widget for \"can I afford…?\" style questions",
                "Auto-categorize imported statements in bulk",
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
                  <Quote className="h-4 w-4 text-zinc-500" />
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
                <figcaption className="mt-5 flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${t.color}`}
                  >
                    {t.initials}
                  </span>
                  <span className="text-xs">
                    <span className="block font-semibold text-zinc-800 dark:text-zinc-100">
                      {t.name}
                    </span>
                    <span className="text-zinc-400">{t.role}</span>
                  </span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* Screens gallery */}
      <section id="sitemap" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <motion.div {...fadeUp} className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-honey-600 dark:text-honey-400">
            Product tour
          </p>
          <h2 className="text-3xl font-bold tracking-tight">Real screens from the working app</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Every view below is the live product — no mockups.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {gallery.map((g, i) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
            >
              <BrowserFrame src={g.src} alt={g.title} url={g.url} />
              <div className="mt-3 px-1">
                <p className="text-sm font-semibold">{g.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {g.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
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

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              The student budget tracker built around hostel budgets, canteen runs, and
              scholarship season — not corporate finance.
            </p>
          </div>
          <nav aria-label="Product">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Product
            </p>
            <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <li>
                <a href="#features" className="transition hover:text-honey-600">
                  Features
                </a>
              </li>
              <li>
                <a href="#how" className="transition hover:text-honey-600">
                  How it works
                </a>
              </li>
              <li>
                <a href="#ai" className="transition hover:text-honey-600">
                  AI coach
                </a>
              </li>
              <li>
                <a href="#sitemap" className="transition hover:text-honey-600">
                  Screens
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Account">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Account
            </p>
            <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <li>
                <Link href="/login" className="transition hover:text-honey-600">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/register" className="transition hover:text-honey-600">
                  Create account
                </Link>
              </li>
              <li>
                <Link href="/forgot-password" className="transition hover:text-honey-600">
                  Forgot password
                </Link>
              </li>
              <li>
                <Link href="/admin-login" className="transition hover:text-honey-600">
                  Admin sign in
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-zinc-400 sm:flex-row">
            <p>
              © {new Date().getFullYear()} Campus Coin · Built for campus financial literacy By Rylen
            </p>
            <p>No credit card · Free for students · BDT ready</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
