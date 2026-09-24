"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Card({ children, className, hover, animate = true, ...props }) {
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(hover ? "glass-card-hover" : "glass-card", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, accent = "honey", delay = 0 }) {
  const accents = {
    honey: "from-honey-500/20 to-honey-400/5 text-honey-600 dark:text-honey-400",
    emerald: "from-emerald-500/20 to-emerald-400/5 text-emerald-600 dark:text-emerald-400",
    rose: "from-rose-500/20 to-rose-400/5 text-rose-600 dark:text-rose-400",
    blue: "from-blue-500/20 to-blue-400/5 text-blue-600 dark:text-blue-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className="glass-card-hover relative overflow-hidden p-5"
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accents[accent]} opacity-60`}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="stat-label">{label}</span>
          {Icon && (
            <div className={`rounded-lg bg-gradient-to-br p-2 ${accents[accent]}`}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <p className="money mt-3 text-2xl text-zinc-900 dark:text-white">{value}</p>
      </div>
    </motion.div>
  );
}
