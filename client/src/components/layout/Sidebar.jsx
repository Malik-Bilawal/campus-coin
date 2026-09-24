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
  Sparkles,
  Upload,
  Target,
  LogOut,
} from "lucide-react";
import { useUIStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const sections = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/budgets", label: "Budgets", icon: PieChart },
      { href: "/categories", label: "Categories", icon: Tags },
      { href: "/transactions/import", label: "CSV Import", icon: Upload },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/tips", label: "Saving Tips", icon: Lightbulb },
      { href: "/insights", label: "AI Insights", icon: Sparkles },
      { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/profile", label: "Profile", icon: User }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar, theme } = useUIStore();
  const { user, logout } = useAuthStore();

  const isAdmin = user?.role === "admin";
  const nav = isAdmin
    ? [
        ...sections.slice(0, 3),
        {
          label: "System",
          items: [{ href: "/admin", label: "Admin Panel", icon: Shield }],
        },
        sections[3],
      ]
    : sections;

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
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
        animate={{ width: sidebarOpen ? 260 : 76 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-amber-500/10 bg-white/90 backdrop-blur-xl dark:bg-zinc-950/90",
          sidebarOpen ? "translate-x-0 shadow-glass" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-amber-500/10 px-4">
          <Link href="/dashboard" className="relative flex h-10 w-10 shrink-0 items-center justify-center">
            <motion.div
              animate={{ rotate: theme === "dark" ? 0 : 360 }}
              transition={{ duration: 3, repeat: theme === "dark" ? Infinity : 0, ease: "linear" }}
            >
              <Hexagon className="h-10 w-10 fill-honey-500/25 text-honey-500 drop-shadow" />
            </motion.div>
            <span className="absolute text-base font-black text-honey-600 dark:text-honey-400">₵</span>
          </Link>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Campus Coin
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-honey-600 dark:text-honey-400">
                BudgetBee
              </p>
            </motion.div>
          )}
        </div>

        {/* Nav sections */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {nav.map((section) => (
            <div key={section.label}>
              {sidebarOpen && (
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        if (window.innerWidth < 1024 && sidebarOpen) toggleSidebar();
                      }}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-gradient-to-r from-honey-500/20 via-honey-500/10 to-transparent text-honey-800 dark:text-honey-200"
                          : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-hex"
                          className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-honey-400 to-honey-600 shadow-honey"
                          transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                        />
                      )}
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                          active
                            ? "bg-honey-500 text-zinc-900 shadow-honey"
                            : "bg-zinc-100 group-hover:bg-honey-500/15 group-hover:text-honey-600 dark:bg-zinc-900 dark:group-hover:bg-honey-500/10"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Streak + goal chip */}
        {sidebarOpen && user && (
          <div className="mx-3 mb-2 rounded-xl border border-honey-500/20 bg-gradient-to-br from-honey-500/10 to-transparent p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">Streak</span>
              <span className="font-bold text-honey-600 dark:text-honey-400">
                {user.loginStreak || 0} 🔥
              </span>
            </div>
            {user.savingsGoal > 0 && (
              <div className="mt-2">
                <div className="mb-1 flex justify-between text-[10px] text-zinc-500">
                  <span>Savings goal</span>
                  <span>{user.currency} {user.savingsGoal}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-honey-500 to-amber-300" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-amber-500/10 p-3">
          <button
            onClick={toggleSidebar}
            className="mb-2 hidden w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 py-2 text-xs text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 lg:flex"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
            {sidebarOpen && "Collapse"}
          </button>
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-500 transition hover:bg-rose-500/10",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && "Logout"}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
