"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Receipt, Tags, Activity, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/ui";
import { formatMoney } from "@/lib/utils";
import { Card, StatCard, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonList } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function AdminPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/admin/stats"), api.get("/admin/announcements")])
      .then(([s, a]) => {
        setStats(s.data.stats);
        setAnnouncements(a.data.announcements);
      })
      .catch((e) => addToast({ type: "error", message: e.message }))
      .finally(() => setLoading(false));
  }, [addToast]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-12 w-48" />
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin panel"
        subtitle="System overview and management"
        breadcrumbs={[{ label: "Admin" }]}
        actions={
          <>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                Users <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/categories">
              <Button variant="ghost" size="sm">
                Categories <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/announcements">
              <Button size="sm">Announcements</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={stats?.users ?? 0} icon={Users} accent="honey" delay={0} />
        <StatCard label="Transactions" value={stats?.transactions ?? 0} icon={Receipt} accent="blue" delay={0.05} />
        <StatCard label="Default categories" value={stats?.categories ?? 0} icon={Tags} accent="emerald" delay={0.1} />
        <StatCard label="Active (7d)" value={stats?.activeUsers ?? 0} icon={Activity} accent="rose" delay={0.15} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader title="Most used categories" subtitle="By transaction count" />
          {!stats?.topCategories?.length ? (
            <p className="py-6 text-center text-sm text-zinc-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topCategories.map((c, i) => (
                <motion.div
                  key={c._id || i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-honey-500/15 text-xs font-bold text-honey-600">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{c.name || "Unknown"}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{c.count} tx</p>
                    <p className="text-xs text-zinc-400 tabular-nums">{formatMoney(c.total)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <CardHeader title="Recent announcements" />
          {!announcements.length ? (
            <p className="py-6 text-center text-sm text-zinc-400">
              No announcements. Create one from the Announcements page.
            </p>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 5).map((a) => (
                <div
                  key={a._id}
                  className={`rounded-lg border p-3 ${
                    a.active
                      ? "border-honey-500/30 bg-honey-500/5"
                      : "border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-700 dark:bg-zinc-800/50"
                  }`}
                >
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{a.body}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
