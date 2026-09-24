"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Button({
  children,
  variant = "honey",
  size = "md",
  className,
  isLoading,
  ...props
}) {
  const variants = {
    honey: "btn-honey",
    ghost: "btn-ghost",
    danger:
      "inline-flex items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-rose-600 active:scale-[0.97] disabled:opacity-50",
    success:
      "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-emerald-600 active:scale-[0.97] disabled:opacity-50",
    link: "text-sm font-medium text-honey-600 hover:text-honey-700 underline-offset-4 hover:underline dark:text-honey-400",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "h-10 w-10 p-0",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      className={cn(variants[variant], sizes[size], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </motion.button>
  );
}
