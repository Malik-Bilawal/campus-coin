"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  History,
  AlertTriangle,
  Lightbulb,
  Bookmark,
} from "lucide-react";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/ui";
import { monthKey, monthLabel } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { SkeletonList, EmptyState } from "@/components/ui/EmptyState";

export default function InsightsPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [month, setMonth] = useState(monthKey());
  const [insight, setInsight] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [togglingBm, setTogglingBm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ins, hist, st, bms] = await Promise.all([
        api.post(`/ai/insight/${month}`).catch(() => ({ data: { insight: null } })),
        api.get("/ai/insights"),
        api.get(`/ai/insight-stats/${month}`),
        api.get("/bookmarks").catch(() => ({ data: { bookmarks: [] } })),
      ]);
      setInsight(ins.data?.insight || null);
      setHistory(hist.data?.insights || []);
      setStats(st.data?.stats || null);
      setBookmarks(bms.data?.bookmarks || []);
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }, [month, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const bookmarked =
    !!insight &&
    bookmarks.some(
      (b) => b.refModel === "Insight" && String(b.refId) === String(insight._id)
    );

  async function toggleBookmark() {
    if (!insight || togglingBm) return;
    setTogglingBm(true);
    try {
      const res = await api.post("/bookmarks", { refModel: "Insight", refId: insight._id });
      const removed = !!res.data?.removed;
      setBookmarks((prev) =>
        removed
          ? prev.filter((b) => !(b.refModel === "Insight" && String(b.refId) === String(insight._id)))
          : [
              ...prev,
              {
                refModel: "Insight",
                refId: insight._id,
                title: `Insight ${insight.month}`,
                snippet: (insight.narrative || "").slice(0, 120),
              },
            ]
      );
      addToast({
        type: "success",
        message: removed ? "Bookmark removed" : "Insight bookmarked",
      });
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setTogglingBm(false);
    }
  }

  async function regenerate() {
    setGenerating(true);
    try {
      const res = await api.post(`/ai/insight/${month}?force=true`);
      setInsight(res.data.insight);
      addToast({ type: "success", message: "Insight regenerated" });
      const hist = await api.get("/ai/insights");
      setHistory(hist.data.insights);
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setGenerating(false);
    }
  }

  const months = [...Array(6)].map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return monthKey(d);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI monthly insights"
        subtitle="Plain-language narrative of your spending patterns"
        breadcrumbs={[{ label: "Insights" }]}
        actions={
          <>
            <Select className="w-auto" value={month} onChange={(e) => setMonth(e.target.value)}>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </Select>
            <Button onClick={regenerate} isLoading={generating}>
              <RefreshCw className="h-4 w-4" /> Regenerate
            </Button>
          </>
        }
      />

      {loading ? (
        <SkeletonList count={3} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="relative overflow-hidden p-6 lg:col-span-2">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-honey-500/20 blur-3xl" />
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-honey-500/15 p-2">
                <Sparkles className="h-5 w-5 text-honey-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold">{monthLabel(month)} insight</h2>
                <p className="text-[11px] text-zinc-400">
                  provider: {insight?.meta?.provider || (insight ? "cached" : "—")}
                </p>
              </div>
              {insight && (
                <button
                  onClick={toggleBookmark}
                  disabled={togglingBm}
                  title={bookmarked ? "Remove bookmark" : "Bookmark this insight"}
                  className={`ml-auto rounded-lg p-2 transition ${
                    bookmarked
                      ? "bg-honey-500/20 text-honey-600 dark:text-honey-400"
                      : "text-zinc-400 hover:bg-zinc-100 hover:text-honey-500 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Bookmark
                    className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`}
                  />
                </button>
              )}
            </div>
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
              {insight?.narrative || "No insight yet — click Regenerate."}
            </p>
            {insight?.advice && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-3">
                <div className="rounded-lg bg-emerald-500/15 p-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Next step
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-emerald-700 dark:text-emerald-300">
                    {insight.advice}
                  </p>
                </div>
              </div>
            )}
            {insight?.flags?.length > 0 && (
              <div className="mt-5 space-y-2">
                {insight.flags.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300"
                  >
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <CardHeader title="Month snapshot" />
            {stats ? (
              <div className="space-y-3 text-sm">
                <Row label="Income" value={stats.income} />
                <Row label="Expense" value={stats.expense} />
                <Row
                  label="Net"
                  value={stats.saved}
                  accent={stats.saved >= 0 ? "text-emerald-500" : "text-rose-500"}
                />
                <div className="pt-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Top categories
                  </p>
                  {stats.byCategory.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex justify-between py-1 text-xs">
                      <span>{c.name}</span>
                      <span className="tabular-nums">{c.total.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No data</p>
            )}
          </Card>
        </div>
      )}

      <Card className="p-5">
        <CardHeader
          title="Insight history"
          subtitle="Past months"
          action={<History className="h-4 w-4 text-zinc-400" />}
        />
        {history.length === 0 ? (
          <EmptyState title="No history yet" description="Generate insights over multiple months." />
        ) : (
          <div className="space-y-3">
            {history.map((h, i) => (
              <motion.details
                key={h._id || i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group rounded-xl border border-zinc-200 p-4 open:border-honey-500/40 dark:border-zinc-800"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
                  <span className="flex items-center justify-between">
                    {monthLabel(h.month)}
                    <span className="text-xs font-normal text-zinc-400 group-open:hidden">expand</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {h.narrative}
                </p>
                {h.advice && (
                  <p className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                    {h.advice}
                  </p>
                )}
                {h.flags?.length > 0 && (
                  <ul className="mt-2 list-inside list-disc text-xs text-amber-600">
                    {h.flags.map((f, fi) => (
                      <li key={fi}>{f}</li>
                    ))}
                  </ul>
                )}
              </motion.details>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value, accent = "" }) {
  return (
    <div className="flex justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
      <span className="text-zinc-500">{label}</span>
      <span className={`money ${accent}`}>{Number(value).toFixed(0)}</span>
    </div>
  );
}
