"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef(function Input(
  { label, error, hint, className, id, trailing, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "input-field",
            trailing && "pr-11",
            error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20",
            className
          )}
          {...props}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-3 flex items-center">{trailing}</span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, children, className, id, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={cn("input-field appearance-none cursor-pointer", error && "border-rose-500", className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, className, id, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn("input-field min-h-[80px] resize-y", error && "border-rose-500", className)}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
});
