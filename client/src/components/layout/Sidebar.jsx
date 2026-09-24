"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  BarChart3,
  Tags,
  Lightbulb,
  Bookmark,
  User,
  Shield,
  ChevronLeft,
  Hexagon,
} from "lucide-react";
import { useUIStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const studentNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: PieChart },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/tips", label: "Saving Tips", icon: Lightbulb },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: User },
];

const adminExtra = [
  { href: "/admin", label: "Admin Panel", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);

  const nav = user?.role === "admin" ? [...studentNav.slice(0, 7), ...adminExtra, studentNav[7]] : studentNav;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 72 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-amber-500/10 bg-white/80 backdrop-blur-xl dark:bg-zinc-900/80",
          sidebarOpen ? "lg:relative" : "lg:relative",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-amber-500/10 px-4">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Hexagon className="h-9 w-9 fill-honey-500/20 text-honey-500" />
            </motion.div>
            <span className="absolute text-sm font-bold text-honey-600 dark:text-honey-400">₵</span>
          </div>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-bold text-zinc-900 dark:text-white">Campus Coin</p>
              <p className="text-[10px] uppercase tracking-widest text-honey-600 dark:text-honey-400">
                BudgetBee
              </p>
            </motion.div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-gradient-to-r from-honey-500/15 to-honey-400/5 text-honey-700 dark:text-honey-300"
                    : "text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-honey-500"
                  />
                )}
                <item.icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110",
                    active && "text-honey-500"
                  )}
                  style={{ width: 18, height: 18 }}
                />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse */}
        <button
          onClick={toggleSidebar}
          className="m-3 hidden items-center justify-center gap-2 rounded-xl border border-zinc-200 py-2 text-xs text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 lg:flex"
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")}
          />
          {sidebarOpen && "Collapse"}
        </button>
      </motion.aside>
    </>
  );
}
