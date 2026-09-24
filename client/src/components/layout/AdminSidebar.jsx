"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Tags,
  Megaphone,
  ChevronLeft,
  Hexagon,
  Shield,
  ArrowLeft,
  Activity,
} from "lucide-react";
import { useUIStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const sections = [
  {
    label: "Admin",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/categories", label: "Categories", icon: Tags },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar, theme } = useUIStore();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const isActive = (href) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");

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
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-rose-500/15 bg-white/90 backdrop-blur-xl dark:bg-zinc-950/90",
          sidebarOpen ? "translate-x-0 shadow-glass" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-rose-500/15 px-4">
          <Link href="/admin" className="relative flex h-10 w-10 shrink-0 items-center justify-center">
            <Hexagon className="h-10 w-10 fill-rose-500/20 text-rose-500" />
            <Shield className="absolute h-4 w-4 text-rose-600 dark:text-rose-400" />
          </Link>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Admin Panel
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-500">
                Campus Coin
              </p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
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
                        if (typeof window !== "undefined" && window.innerWidth < 1024 && sidebarOpen) {
                          toggleSidebar();
                        }
                      }}
                      className={cn(
                        "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-gradient-to-r from-rose-500/20 via-rose-500/10 to-transparent text-rose-800 dark:text-rose-200"
                          : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                      )}
                    >
                      {active && (
                        <span
                          aria-hidden
                          className="absolute inset-y-0 left-0 my-auto h-6 w-[3px] rounded-r-full bg-gradient-to-b from-rose-400 to-rose-600"
                        />
                      )}
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                          active
                            ? "bg-rose-500 text-white"
                            : "bg-zinc-100 group-hover:bg-rose-500/15 group-hover:text-rose-600 dark:bg-zinc-900 dark:group-hover:bg-rose-500/10"
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

          {sidebarOpen && (
            <div className="rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-transparent p-3">
              <div className="flex items-center gap-2 text-xs">
                <Activity className="h-3.5 w-3.5 text-rose-500" />
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">Admin mode</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                Student modules are hidden here. Manage users, categories & announcements only.
              </p>
            </div>
          )}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-rose-500/15 p-3">
          <Link
            href="/dashboard"
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 py-2.5 text-xs font-medium text-zinc-500 transition hover:border-honey-500/40 hover:bg-honey-500/10 hover:text-honey-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-honey-300",
              !sidebarOpen && "px-0"
            )}
            title="Back to student app"
          >
            <ArrowLeft className="h-4 w-4" />
            {sidebarOpen && "Student app"}
          </Link>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 py-2.5 text-xs font-medium text-zinc-500 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-rose-300",
              !sidebarOpen && "px-0"
            )}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
            {sidebarOpen && "Collapse"}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            className={cn(
              "group flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 px-3 py-2.5 text-sm font-semibold text-rose-600 transition-all hover:border-rose-500/50 hover:bg-rose-500/15 dark:text-rose-400",
              sidebarOpen ? "justify-start" : "px-0"
            )}
          >
            Logout
          </button>
        </div>
      </motion.aside>
    </>
  );
}
