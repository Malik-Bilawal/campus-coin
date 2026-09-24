"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Toaster } from "@/components/ui/Toaster";
import { ChatWidget } from "@/components/ai/ChatWidget";
import { useSocket } from "@/hooks/useSocket";
import { SkeletonList } from "@/components/ui/EmptyState";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, initialized, init } = useAuthStore();
  const { connected } = useSocket();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    if (!initialized) init();
  }, [initialized, init]);

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [initialized, loading, user, router, pathname]);

  useEffect(() => {
    if (initialized && !loading && user && isAdminArea && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [initialized, loading, user, isAdminArea, router]);

  if (!initialized || loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-full max-w-md space-y-4 p-6">
          <div className="skeleton mx-auto h-10 w-48" />
          <SkeletonList count={3} />
        </div>
      </div>
    );
  }

  if (isAdminArea && user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Redirecting…</p>
      </div>
    );
  }

  const padClass = sidebarOpen ? "lg:pl-[260px]" : "lg:pl-[76px]";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {isAdminArea ? <AdminSidebar /> : <Sidebar />}
      <div className={`flex min-h-screen flex-col transition-[padding] duration-300 ${padClass}`}>
        <Topbar live={connected} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div key={pathname} className="page-enter mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
      {!isAdminArea && <ChatWidget />}
    </div>
  );
}
