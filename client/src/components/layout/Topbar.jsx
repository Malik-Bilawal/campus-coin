"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Menu,
  Moon,
  Sun,
  LogOut,
  Type,
  ChevronDown,
} from "lucide-react";
import { useUIStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";
import { cn } from "@/lib/utils";

export function Topbar({ live }) {
  const router = useRouter();
  const { theme, toggleTheme, fontSize, setFontSize, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const notifs = useNotificationStore((s) => s.items);
  const unread = useNotificationStore((s) => s.unread);
  const loadNotifs = useNotificationStore((s) => s.load);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showFont, setShowFont] = useState(false);

  const fontRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    if (!showFont && !showNotifs && !showUser) return;
    function closeAll() {
      setShowFont(false);
      setShowNotifs(false);
      setShowUser(false);
    }
    function onMouseDown(e) {
      if (showFont && fontRef.current && !fontRef.current.contains(e.target)) setShowFont(false);
      if (showNotifs && notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifs(false);
      if (showUser && userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") closeAll();
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showFont, showNotifs, showUser]);

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 60000);
    return () => clearInterval(interval);
  }, [loadNotifs]);

  // Refresh bell when live WS connects
  useEffect(() => {
    if (live) loadNotifs();
  }, [live, loadNotifs]);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-amber-500/10 bg-white/70 px-4 backdrop-blur-xl dark:bg-zinc-900/70 sm:px-6">
      <button
        onClick={toggleSidebar}
        className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden sm:block">
        <p className="text-xs text-zinc-400">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Live indicator */}
        <span
          title={live ? "Live connected" : "Connecting..."}
          className={`hidden h-2 w-2 rounded-full sm:block ${
            live ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "animate-pulse bg-amber-500"
          }`}
        />

        {/* Font size */}
        <div ref={fontRef} className="relative">
          <button
            onClick={() => {
              setShowFont(!showFont);
              setShowNotifs(false);
              setShowUser(false);
            }}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Font size"
          >
            <Type className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
          </button>
          <AnimatePresence>
            {showFont && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                className="glass-card absolute right-0 top-full mt-2 w-36 p-2 dark:bg-zinc-900"
              >
                {["sm", "md", "lg"].map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setFontSize(size);
                      setShowFont(false);
                    }}
                    className={cn(
                      "block w-full rounded-lg px-3 py-2 text-left text-sm transition",
                      fontSize === size
                        ? "bg-honey-500/15 text-honey-700 dark:text-honey-300"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    )}
                  >
                    {size === "sm" ? "Small" : size === "md" ? "Medium" : "Large"}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggleTheme}
          className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              setShowUser(false);
              setShowFont(false);
            }}
            className="relative rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
              >
                {unread}
              </motion.span>
            )}
          </button>
          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                className="glass-card absolute right-0 top-full mt-2 max-h-96 w-80 max-w-[calc(100vw_-_6.5rem)] overflow-y-auto p-2 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between px-2 py-1.5">
                  <p className="text-sm font-semibold">Notifications</p>
                  {unread > 0 && (
                    <button
                      onClick={async () => {
                        await markAllRead();
                      }}
                      className="text-xs text-honey-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {notifs.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-zinc-400">No notifications</p>
                ) : (
                  notifs.map((n) => (
                    <div
                      key={n._id}
                      className={cn(
                        "rounded-lg px-3 py-2.5 text-xs",
                        !n.read && "bg-honey-500/10"
                      )}
                    >
                      {n.title && (
                        <p className="font-semibold text-zinc-800 dark:text-zinc-100">{n.title}</p>
                      )}
                      <p className={n.title ? "mt-0.5 text-zinc-700 dark:text-zinc-200" : "text-zinc-700 dark:text-zinc-200"}>
                        {n.message}
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-400">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => {
              setShowUser(!showUser);
              setShowNotifs(false);
              setShowFont(false);
            }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-honey-400 to-honey-600 text-sm font-bold text-zinc-900">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                {user?.name}
              </p>
              <p className="text-[10px] capitalize text-zinc-400">{user?.role}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          </button>
          <AnimatePresence>
            {showUser && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                className="glass-card absolute right-0 top-full mt-2 w-48 p-2 dark:bg-zinc-900"
              >
                <button
                  onClick={() => {
                    setShowUser(false);
                    router.push("/profile");
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
