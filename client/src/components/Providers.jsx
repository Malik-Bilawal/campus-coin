"use client";

import { createContext, useContext, useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { useUIStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";

const AppContext = createContext(null);

export function Providers({ children }) {
  const { theme, fontSize, setTheme, setFontSize } = useUIStore();
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.remove("font-sm", "font-md", "font-lg");
    root.classList.add(`font-${fontSize}`);
  }, [theme, fontSize]);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <AppContext.Provider value={{ theme, fontSize, setTheme, setFontSize }}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
