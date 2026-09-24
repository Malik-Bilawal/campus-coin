"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Pin, PinOff, X, RefreshCw, Bookmark } from "lucide-react";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState, SkeletonList } from "@/components/ui/EmptyState";

export default function TipsPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("active");

  async function load(f = filter) {
    setLoading(true);
    try {
      const query = f === "all" ? "" : `?status=${f}`;
      const res = await api.get(`/tips${query}`);
      setTips(res.data.tips);
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(filter);
  }, [filter]);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await api.post("/tips/refresh");
      setTips(res.data.tips);
      addToast({
        type: "success",
        message: `Generated ${res.data.generated} tips from your history`,
      });
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setRefreshing(false);
    }
  }

  async function setStatus(id, status) {
    try {
      await api.patch(`/tips/${id}/status`, { status });
      load();
    } catch (e) {
      addToast({ type: "error", message: e.message });
    }
  }

  async function bookmark(tip) {
    try {
      const res = await api.post("/bookmarks", { refModel: "Tip", refId: tip._id });
      addToast({
        type: "success",
        message: res.data.removed ? "Bookmark removed" : "Bookmarked!",
      });
    } catch (e) {
      addToast({ type: "error", message: e.message });
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Saving tips"
        subtitle="Ranked by potential savings impact from your own history"
        breadcrumbs={[{ label: "Saving Tips" }]}
        actions={
          <Button onClick={refresh} isLoading={refreshing}>
            <RefreshCw className="h-4 w-4" /> Refresh tips
          </Button>
        }
      />

      <div className="flex gap-2">
        {["active", "pinned", "dismissed", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium capitalize transition",
              filter === f
                ? "bg-honey-500 text-zinc-900 shadow-honey"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : tips.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No tips yet"
          description="Hit Refresh to generate personalized tips from your transactions."
          action={
            <Button onClick={refresh} isLoading={refreshing}>
              <RefreshCw className="h-4 w-4" /> Generate tips
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip, i) => (
            <motion.div
              key={tip._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "glass-card group relative overflow-hidden p-5",
                tip.status === "pinned" && "border-honey-500/40 shadow-honey",
                tip.status === "dismissed" && "opacity-50"
              )}
            >
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-honey-500/10 blur-2xl" />

              <div className="relative mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-honey-500/15 p-2">
                    <Lightbulb className="h-4 w-4 text-honey-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{tip.title}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                      impact {tip.impactScore}
                    </p>
                  </div>
                </div>
              </div>

              <p className="relative mb-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {tip.body}
              </p>

              <div className="relative flex flex-wrap gap-1.5">
                {tip.status !== "pinned" && (
                  <button
                    onClick={() => setStatus(tip._id, "pinned")}
                    className="inline-flex items-center gap-1 rounded-lg bg-honey-500/10 px-2.5 py-1.5 text-[11px] font-medium text-honey-700 transition hover:bg-honey-500/20 dark:text-honey-300"
                  >
                    <Pin className="h-3 w-3" /> Pin
                  </button>
                )}
                {tip.status === "pinned" && (
                  <button
                    onClick={() => setStatus(tip._id, "active")}
                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-500/10 px-2.5 py-1.5 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-500/20"
                  >
                    <PinOff className="h-3 w-3" /> Unpin
                  </button>
                )}
                <button
                  onClick={() => bookmark(tip)}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-[11px] font-medium text-blue-600 transition hover:bg-blue-500/20 dark:text-blue-400"
                >
                  <Bookmark className="h-3 w-3" /> Save
                </button>
                {tip.status !== "dismissed" && (
                  <button
                    onClick={() => setStatus(tip._id, "dismissed")}
                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-500/10 px-2.5 py-1.5 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-500/20"
                  >
                    <X className="h-3 w-3" /> Dismiss
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
