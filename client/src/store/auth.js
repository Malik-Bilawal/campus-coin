"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  async init() {
    if (get().initialized) return;
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data.user, loading: false, initialized: true });
    } catch {
      try {
        const res = await api.post("/auth/refresh");
        set({ user: res.data.user, loading: false, initialized: true });
      } catch {
        set({ user: null, loading: false, initialized: true });
      }
    }
  },

  async login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    set({ user: res.data.user });
    return res.data.user;
  },

  async register(payload) {
    const res = await api.post("/auth/register", payload);
    set({ user: res.data.user });
    return res.data.user;
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      set({ user: null });
    }
  },

  setUser(user) {
    set({ user });
  },

  updateUser(partial) {
    set((s) => ({ user: s.user ? { ...s.user, ...partial } : null }));
  },
}));
