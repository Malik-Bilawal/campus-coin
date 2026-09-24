"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X } from "lucide-react";
import { useNotificationStore } from "@/store/notifications";

export function AnnouncementBanner() {
  const announcements = useNotificationStore((s) => s.announcements);
  const loadAnnouncements = useNotificationStore((s) => s.loadAnnouncements);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  if (!announcements.length) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {announcements.slice(0, 3).map((a) => (
          <motion.div
            key={a._id}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card flex items-start gap-3 border-honey-500/20 p-4"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-honey-500/15">
              <Megaphone className="h-4 w-4 text-honey-600" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">{a.title}</p>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">{a.body}</p>
            </div>
            <button
              onClick={() => {
                const next = announcements.filter((x) => x._id !== a._id);
                useNotificationStore.setState({ announcements: next });
              }}
              aria-label="Dismiss announcement"
              className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
