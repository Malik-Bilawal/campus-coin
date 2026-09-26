"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { useNotificationStore } from "@/store/notifications";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5000";

let socket = null;

const TOAST_TYPES = {
  budget_alert: "warning",
  budget: "info",
  category: "success",
  import: "success",
  announcement: "info",
  achievement: "success",
  transaction: "info",
  info: "info",
};

export function useSocket() {
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      setConnected(false);
      return;
    }

    if (!socket) {
      socket = io(WS_URL, {
        auth: { token: "" },
        withCredentials: true,
        autoConnect: false,
        extraHeaders: { "ngrok-skip-browser-warning": "1" },
      });
    }

    const token =
      useAuthStore.getState().accessToken ||
      (typeof window !== "undefined" && sessionStorage.getItem("accessToken")) ||
      "";

    socket.auth = { token };
    if (!socket.connected) socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onNotify = (n) => {
      useNotificationStore.getState().pushLive(n);
      addToast({
        type: TOAST_TYPES[n?.type] || "info",
        title: n?.title || "Live alert",
        message: n?.message,
      });
    };
    const onAnnouncement = () => {
      useNotificationStore.getState().loadAnnouncements();
    };
    const onBudget = () => {
      /* optional page-level listeners can subscribe via `on` */
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("notification:new", onNotify);
    socket.on("announcement:new", onAnnouncement);
    socket.on("budget:updated", onBudget);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("notification:new", onNotify);
      socket.off("announcement:new", onAnnouncement);
      socket.off("budget:updated", onBudget);
    };
  }, [user, addToast]);

  function on(event, cb) {
    if (!socket) return () => {};
    socket.on(event, cb);
    return () => socket.off(event, cb);
  }

  return { connected, on, socket: () => socket };
}
