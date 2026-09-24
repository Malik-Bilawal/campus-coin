"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Trash2, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/ui";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState, SkeletonList } from "@/components/ui/EmptyState";

export default function BookmarksPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/bookmarks");
      setBookmarks(res.data.bookmarks);
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    try {
      await api.delete(`/bookmarks/${id}`);
      setBookmarks((b) => b.filter((x) => x._id !== id));
      addToast({ type: "success", message: "Bookmark removed" });
    } catch (e) {
      addToast({ type: "error", message: e.message });
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bookmarks"
        subtitle="Tips and insights you've saved for later"
        breadcrumbs={[{ label: "Bookmarks" }]}
      />

      {loading ? (
        <SkeletonList count={3} />
      ) : bookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks yet"
          description="Save a tip from the Saving Tips page to find it here."
        />
      ) : (
        <div className="space-y-3">
          {bookmarks.map((bm, i) => (
            <motion.div
              key={bm._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card group flex items-start gap-4 p-5"
            >
              <div className="rounded-xl bg-honey-500/15 p-3">
                <Bookmark className="h-5 w-5 text-honey-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{bm.title || "Untitled"}</p>
                  <span className="rounded bg-zinc-500/10 px-1.5 py-0.5 text-[10px] uppercase text-zinc-400">
                    {bm.refModel}
                  </span>
                </div>
                {bm.snippet && (
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {bm.snippet}
                  </p>
                )}
                <p className="mt-2 text-[10px] text-zinc-400">
                  Saved {formatDate(bm.createdAt, "medium")}
                </p>
              </div>
              <button
                onClick={() => remove(bm._id)}
                className="rounded-lg p-2 text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
