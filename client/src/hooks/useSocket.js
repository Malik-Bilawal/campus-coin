"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5000";

let socket = null;

export function useSocket() {
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const [connected, setConnected] = useState(false);
  const handlers = useRef(new Set());

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
      });
    }

    // token from cookie is httpOnly — pass via handshake if we have access token in memory
    // auth store may only have user; use refresh-free approach: send cookie-based not supported by socket.io easily
    // We store accessToken on login in memory via auth store if present
    const token =
      useAuthStore.getState().accessToken ||
      (typeof window !== "undefined" && sessionStorage.getItem("accessToken")) ||
      "";

    socket.auth = { token };
    if (!socket.connected) socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onNotify = (n) => {
      addToast({
        type: n.type === "budget_alert" ? "warning" : "info",
        message: n.message,
        title: "Live alert",
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("notification:new", onNotify);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("notification:new", onNotify);
    };
  }, [user, addToast]);

  function on(event, cb) {
    if (!socket) return () => {};
    socket.on(event, cb);
    return () => socket.off(event, cb);
  }

  return { connected, on, socket: () => socket };
}
