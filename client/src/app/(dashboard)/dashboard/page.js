"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowLeftRight,
  Tag,
  PieChart,
  Lightbulb,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { formatMoney, formatDate } from "@/lib/utils";
import { Card, StatCard, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonList } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { celebrate } from "@/lib/confetti";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await api.get("/dashboard");
      setData(res.data);
      const saved = (res.data.income || 0) - (res.data.expense || 0);
      const goal = Number(user?.savingsGoal) || 0;
      if (goal > 0 && saved >= goal && !sessionStorage.getItem("cc-confetti-goal")) {
        sessionStorage.setItem("cc-confetti-goal", "1");
        celebrate();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-16 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
        <SkeletonList count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 text-center text-sm text-rose-500">{error}</div>
    );
  }

  const currency = user?.currency || "BDT";
  const balance = data?.balance ?? 0;
  const topCat = data?.topCategory;
  const streak = user?.loginStreak || 0;
  const savedThisMonth = (data?.income || 0) - (data?.expense || 0);
  const goalHit =
    user?.savingsGoal > 0 && savedThisMonth >= Number(user.savingsGoal);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${data?.greeting || "Hi"}, ${user?.name?.split(" ")[0] || "there"} 👋`}
        subtitle={
          <>
            Here&apos;s your money snapshot for this month
            {streak > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-honey-500/15 px-2 py-0.5 text-[11px] font-semibold text-honey-700 dark:text-honey-300">
                {streak} day streak 🔥
              </span>
            )}
            {goalHit && (
              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                Goal hit 🎯
              </span>
            )}
          </>
        }
        actions={
          <>
            <Link href="/transactions/new">
              <Button>
                <Plus className="h-4 w-4" /> Add expense
              </Button>
            </Link>
            <Link href="/transactions?type=income">
              <Button variant="ghost">
                <Plus className="h-4 w-4" /> Add income
              </Button>
            </Link>
          </>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Net balance"
          value={formatMoney(balance, currency)}
          icon={Wallet}
          accent={balance >= 0 ? "emerald" : "rose"}
          delay={0}
        />
        <StatCard
          label="Income"
          value={formatMoney(data?.income || 0, currency)}
          icon={TrendingUp}
          accent="emerald"
          delay={0.05}
        />
        <StatCard
          label="Expenses"
          value={formatMoney(data?.expense || 0, currency)}
          icon={TrendingDown}
          accent="rose"
          delay={0.1}
        />
        <StatCard
          label="Top category"
          value={topCat?.category?.name || "—"}
          icon={Tag}
          accent="honey"
          delay={0.15}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent transactions */}
        <Card className="lg:col-span-2 p-5">
          <CardHeader
            title="Recent transactions"
            subtitle="Your latest activity"
            action={
              <Link
                href="/transactions"
                className="text-xs font-medium text-honey-600 hover:underline"
              >
                View all
              </Link>
            }
          />
          {!data?.recentTransactions?.length ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              No transactions yet. Add your first one!
            </p>
          ) : (
            <div className="space-y-2">
              {data.recentTransactions.map((tx, i) => (
                <motion.div
                  key={tx._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      background: `${tx.categoryId?.color || "#F59E0B"}22`,
                      color: tx.categoryId?.color || "#F59E0B",
                    }}
                  >
                    {(tx.categoryId?.name || "?").charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {tx.note || tx.categoryId?.name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {tx.categoryId?.name} · {formatDate(tx.date, "short")}
                    </p>
                  </div>
                  <span
                    className={`money text-sm ${
                      tx.type === "income" ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatMoney(tx.amount, currency)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Budgets + Tips sidebar */}
        <div className="space-y-6">
          <Card className="p-5">
            <CardHeader
              title="Budget vs actual"
              action={
                <Link href="/budgets" className="text-xs text-honey-600 hover:underline">
                  Manage
                </Link>
              }
            />
            {!data?.budgets?.length ? (
              <p className="py-4 text-center text-xs text-zinc-400">
                No budgets set for this month
              </p>
            ) : (
              <div className="space-y-4">
                {data.budgets.slice(0, 4).map((b, i) => (
                  <motion.div
                    key={b._id || i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-700 dark:text-zinc-200">
                        {b.category?.name || "Category"}
                      </span>
                      <span className="tabular-nums text-zinc-500">
                        {formatMoney(b.spent, currency)} / {formatMoney(b.limit, currency)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${b.percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 + i * 0.05 }}
                        className={`h-full rounded-full ${
                          b.percentage >= 100
                            ? "bg-rose-500"
                            : b.percentage >= 80
                              ? "bg-amber-500"
                              : "bg-gradient-to-r from-honey-500 to-honey-400"
                        }`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <CardHeader
              title="Pinned tips"
              action={
                <Link href="/tips" className="text-xs text-honey-600 hover:underline">
                  All tips
                </Link>
              }
            />
            {!data?.pinnedTips?.length ? (
              <div className="py-4 text-center">
                <Lightbulb className="mx-auto mb-2 h-6 w-6 text-honey-500/50" />
                <p className="text-xs text-zinc-400">Pin tips you find useful</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.pinnedTips.map((t, i) => (
                  <div
                    key={t._id || i}
                    className="rounded-lg border border-honey-500/20 bg-honey-500/5 p-3"
                  >
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                      {t.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {t.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/transactions", icon: ArrowLeftRight, label: "All transactions" },
          { href: "/budgets", icon: PieChart, label: "Set a budget" },
          { href: "/reports", icon: TrendingUp, label: "View reports" },
        ].map((a, i) => (
          <Link key={a.href} href={a.href}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="glass-card-hover flex items-center gap-3 p-4"
            >
              <div className="rounded-lg bg-honey-500/15 p-2.5">
                <a.icon className="h-5 w-5 text-honey-600 dark:text-honey-400" />
              </div>
              <span className="text-sm font-medium">{a.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
