"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  loading: true,
  initialized: false,

  async init() {
    if (get().initialized) return;
    const stored =
      typeof window !== "undefined" ? sessionStorage.getItem("accessToken") : null;
    try {
      const res = await api.get("/auth/me");
      let accessToken = res.data.accessToken || stored;
      if (!accessToken) {
        try {
          const r = await api.post("/auth/refresh");
          accessToken = r.data.accessToken;
        } catch {
          /* keep null — socket will retry after login */
        }
      }
      if (accessToken && typeof window !== "undefined") {
        sessionStorage.setItem("accessToken", accessToken);
      }
      set({
        user: res.data.user,
        accessToken,
        loading: false,
        initialized: true,
      });
    } catch {
      try {
        const res = await api.post("/auth/refresh");
        if (res.data.accessToken && typeof window !== "undefined") {
          sessionStorage.setItem("accessToken", res.data.accessToken);
        }
        set({
          user: res.data.user,
          accessToken: res.data.accessToken,
          loading: false,
          initialized: true,
        });
      } catch {
        set({ user: null, loading: false, initialized: true });
      }
    }
  },

  async login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    set({ user: res.data.user, accessToken: res.data.accessToken });
    if (res.data.accessToken && typeof window !== "undefined") {
      sessionStorage.setItem("accessToken", res.data.accessToken);
    }
    return res.data.user;
  },

  async register(payload) {
    const res = await api.post("/auth/register", payload);
    set({ user: res.data.user, accessToken: res.data.accessToken });
    if (res.data.accessToken && typeof window !== "undefined") {
      sessionStorage.setItem("accessToken", res.data.accessToken);
    }
    return res.data.user;
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      if (typeof window !== "undefined") sessionStorage.removeItem("accessToken");
      set({ user: null, accessToken: null });
    }
  },

  setUser(user) {
    set({ user });
  },

  updateUser(partial) {
    set((s) => ({ user: s.user ? { ...s.user, ...partial } : null }));
  },
}));
