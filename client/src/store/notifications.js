"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

const MAX = 50;

export const useNotificationStore = create((set, get) => ({
  items: [],
  unread: 0,
  loaded: false,
  announcements: [],

  async load() {
    try {
      const res = await api.get("/notifications");
      set({
        items: res.data.notifications || [],
        unread: res.data.unread || 0,
        loaded: true,
      });
    } catch {
      /* keep prior */
    }
  },

  pushLive(n) {
    if (!n) return;
    set((s) => {
      const items = [n, ...s.items.filter((x) => x._id !== n._id)].slice(0, MAX);
      const unread = items.filter((x) => !x.read).length;
      return { items, unread, loaded: true };
    });
  },

  async markAllRead() {
    await api.patch("/notifications/read-all");
    set((s) => ({
      items: s.items.map((x) => ({ ...x, read: true })),
      unread: 0,
    }));
  },

  async loadAnnouncements() {
    try {
      const res = await api.get("/announcements");
      set({ announcements: res.data.announcements || [] });
    } catch {
      /* ignore */
    }
  },
}));
