"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PieChart as PieIcon,
  Download,
  TrendingUp,
  CalendarDays,
  Share2,
  Filter,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { formatMoney, monthKey, monthLabel } from "@/lib/utils";
import { Card, CardHeader, StatCard } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SkeletonList, EmptyState } from "@/components/ui/EmptyState";

const COLORS = ["#F59E0B", "#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#06B6D4", "#EF4444", "#64748B"];

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const currency = user?.currency || "BDT";

  const [month, setMonth] = useState(monthKey());
  const [catData, setCatData] = useState(null);
  const [trend, setTrend] = useState([]);
  const [dailyWeekly, setDailyWeekly] = useState({ daily: [], weekly: [] });
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "", type: "", categoryId: "" });
  const [filtered, setFiltered] = useState(null);
  const [filtering, setFiltering] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cat, tr, dw, fc] = await Promise.all([
        api.get(`/reports/category?month=${month}`),
        api.get("/reports/trend"),
        api.get("/reports/daily-weekly"),
        api.get("/reports/forecast"),
      ]);
      setCatData(cat.data);
      setTrend(tr.data.trend);
      setDailyWeekly(dw.data);
      setForecast(fc.data);
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }, [month, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data.categories)).catch(() => {});
  }, []);

  async function applyFilters() {
    setFiltering(true);
    try {
      const qs = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) qs.set(k, v);
      });
      const res = await api.get(`/reports/filtered?${qs.toString()}`);
      setFiltered(res.data);
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setFiltering(false);
    }
  }

  function clearFilters() {
    setFilters({ from: "", to: "", type: "", categoryId: "" });
    setFiltered(null);
  }

  function shareReport() {
    const email = shareEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addToast({ type: "error", message: "Enter a valid email" });
      return;
    }
    // Demo build: no mail server — log the share request and confirm in UI
    console.log(`[share] monthly report ${month} queued for ${email}`);
    addToast({ type: "success", message: `Report share queued for ${email}` });
    setShareOpen(false);
    setShareEmail("");
  }

  async function exportPDF() {
    setExporting(true);
    try {
      const el = document.getElementById("report-root");
      if (!el) return;
      const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "mm", a4: true });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const imgW = pw - 10;
      const imgH = (canvas.height * imgW) / canvas.width;
      pdf.addImage(img, "PNG", 5, 5, imgW, Math.min(imgH, ph - 10));
      pdf.save(`campus-coin-report-${month}.pdf`);
      addToast({ type: "success", message: "PDF exported" });
    } catch (e) {
      addToast({ type: "error", message: "Export failed: " + e.message });
    } finally {
      setExporting(false);
    }
  }

  const pieRows = (catData?.rows || [])
    .filter((r) => r.total > 0)
    .map((r, i) => ({
      name: r.name || "Other",
      value: r.total,
      color: r.color || COLORS[i % COLORS.length],
      count: r.count,
    }));

  const daily = (dailyWeekly.daily || []).map((d) => ({
    day: d.date.slice(5),
    total: d.total,
  }));

  const weekly = (dailyWeekly.weekly || []).map((w) => ({
    week: `W${w.week}`,
    total: w.total,
    count: w.count,
  }));

  const trendData = trend.map((t) => ({
    month: t.month,
    income: t.income,
    expense: t.expense,
  }));

  // dashed projection: link last actual expense to the forecast point
  if (forecast?.projectedExpense != null && trendData.length) {
    trendData[trendData.length - 1].forecast = trendData[trendData.length - 1].expense;
    trendData.push({
      month: forecast.forecastMonth,
      income: null,
      expense: null,
      forecast: forecast.projectedExpense,
    });
  }

  const filteredIncome = filtered?.totals?.find((t) => t._id === "income")?.total || 0;
  const filteredExpense = filtered?.totals?.find((t) => t._id === "expense")?.total || 0;

  return (
    <div className="space-y-6" id="report-root">
      <PageHeader
        title="Monthly reports"
        subtitle="Category breakdown, trends, and daily summaries"
        breadcrumbs={[{ label: "Reports" }]}
        actions={
          <>
            <Select
              className="w-auto"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {[...Array(6)].map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const k = monthKey(d);
                return (
                  <option key={k} value={k}>
                    {monthLabel(k)}
                  </option>
                );
              })}
            </Select>
            <Button onClick={exportPDF} isLoading={exporting}>
              <Download className="h-4 w-4" /> Export PDF
            </Button>
            <Button variant="ghost" onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" /> Share by email
            </Button>
          </>
        }
      />

      {loading ? (
        <SkeletonList count={4} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total spent"
              value={formatMoney(catData?.totalExpense || 0, currency)}
              icon={PieIcon}
              accent="rose"
            />
            <StatCard
              label="Categories used"
              value={String(pieRows.length)}
              icon={CalendarDays}
              accent="honey"
            />
            <StatCard
              label="Avg / category"
              value={formatMoney(
                pieRows.length ? (catData?.totalExpense || 0) / pieRows.length : 0,
                currency
              )}
              icon={TrendingUp}
              accent="blue"
            />
            <StatCard
              label={`Projected ${forecast?.forecastMonth || "next month"}`}
              value={formatMoney(forecast?.projectedExpense || 0, currency)}
              icon={TrendingUp}
              accent="emerald"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pie */}
            <Card className="p-5">
              <CardHeader title="Spending by category" subtitle={monthLabel(month)} />
              {pieRows.length === 0 ? (
                <EmptyState title="No expenses this month" description="Log expenses to see the breakdown." />
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieRows}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                        animationDuration={800}
                      >
                        {pieRows.map((entry, index) => (
                          <Cell key={index} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, n) => [formatMoney(v, currency), n]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* 6-month trend */}
            <Card className="p-5">
              <CardHeader title="Income vs expense" subtitle="Last 6 months" />
              {trendData.length === 0 ? (
                <EmptyState title="Not enough history" description="Log over multiple months to see trends." />
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => formatMoney(v, currency)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                        animationDuration={900}
                      />
                      <Line
                        type="monotone"
                        dataKey="expense"
                        stroke="#F43F5E"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                        animationDuration={900}
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#F43F5E"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        dot={{ r: 4, fill: "#F43F5E" }}
                        name="Projected"
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Daily + weekly bars */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <CardHeader title="Daily spending" subtitle="Current month" />
              {daily.length === 0 ? (
                <EmptyState title="No daily data" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={daily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.3} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => formatMoney(v, currency)} />
                      <Bar dataKey="total" fill="#F59E0B" radius={[6, 6, 0, 0]} animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <CardHeader title="Weekly spending" subtitle="Current month by ISO week" />
              {weekly.length === 0 ? (
                <EmptyState title="No weekly data" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.3} />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => formatMoney(v, currency)} />
                      <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Custom filters -> /reports/filtered */}
          <Card className="p-5">
            <CardHeader
              title="Custom range report"
              subtitle="Filter by date range, type, and category"
              action={
                filtered && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    Clear
                  </button>
                )
              }
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Input
                label="From"
                name="filterFrom"
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
              <Input
                label="To"
                name="filterTo"
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
              <Select
                label="Type"
                name="filterType"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All types</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Select>
              <Select
                label="Category"
                name="filterCategory"
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <div className="flex items-end">
                <Button onClick={applyFilters} isLoading={filtering} className="w-full">
                  <Filter className="h-4 w-4" /> Apply
                </Button>
              </div>
            </div>

            {filtered && (
              <div className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Income</p>
                    <p className="money text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(filteredIncome, currency)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-rose-500/10 p-3 text-center">
                    <p className="text-xs text-rose-500">Expense</p>
                    <p className="money text-lg font-semibold text-rose-500">
                      {formatMoney(filteredExpense, currency)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-honey-500/10 p-3 text-center">
                    <p className="text-xs text-honey-600 dark:text-honey-400">Transactions</p>
                    <p className="text-lg font-semibold text-honey-600 dark:text-honey-400">
                      {filtered.transactions?.length || 0}
                    </p>
                  </div>
                </div>
                {!filtered.transactions?.length ? (
                  <EmptyState title="No transactions match these filters" />
                ) : (
                  <div className="space-y-1.5">
                    {filtered.transactions.slice(0, 8).map((tx) => (
                      <div
                        key={tx._id}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50"
                      >
                        <span className="truncate text-zinc-700 dark:text-zinc-200">
                          {tx.note || tx.categoryId?.name}
                          <span className="ml-2 text-xs text-zinc-400">
                            {tx.categoryId?.name}
                          </span>
                        </span>
                        <span
                          className={`money shrink-0 text-sm ${
                            tx.type === "income" ? "text-emerald-500" : "text-rose-500"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {formatMoney(tx.amount, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Category list table */}
          {pieRows.length > 0 && (
            <Card className="p-5">
              <CardHeader title="Category details" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-400 dark:border-zinc-700">
                      <th className="pb-2 pr-4">Category</th>
                      <th className="pb-2 pr-4">Entries</th>
                      <th className="pb-2 pr-4">Amount</th>
                      <th className="pb-2">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pieRows.map((r, i) => (
                      <motion.tr
                        key={r.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-zinc-100 dark:border-zinc-800/60"
                      >
                        <td className="py-2.5 pr-4">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: r.color }}
                            />
                            {r.name}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{r.count}</td>
                        <td className="money py-2.5 pr-4">{formatMoney(r.value, currency)}</td>
                        <td className="py-2.5 tabular-nums">
                          {catData?.totalExpense
                            ? Math.round((r.value / catData.totalExpense) * 100)
                            : 0}
                          %
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share report by email">
        <div className="space-y-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            We&apos;ll send a summary of the <strong>{monthLabel(month)}</strong> report
            (charts, category breakdown, and totals).
          </p>
          <Input
            label="Recipient email"
            name="recipientEmail"
            type="email"
            placeholder="friend@university.edu"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShareOpen(false)}>
              Cancel
            </Button>
            <Button onClick={shareReport}>
              <Share2 className="h-4 w-4" /> Send
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
