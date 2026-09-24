"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

function scorePassword(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const levels = [
  { label: "Too short", color: "bg-rose-500", text: "text-rose-500" },
  { label: "Weak", color: "bg-rose-500", text: "text-rose-500" },
  { label: "Okay", color: "bg-amber-500", text: "text-amber-500" },
  { label: "Good", color: "bg-honey-500", text: "text-honey-600" },
  { label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" },
];

export function PasswordStrength({ password }) {
  const score = scorePassword(password);
  const level = levels[score];
  const checks = useMemo(
    () => [
      { ok: password.length >= 6, label: "6+ characters" },
      { ok: password.length >= 10, label: "10+ characters" },
      { ok: /[A-Z]/.test(password) && /[a-z]/.test(password), label: "Mixed case" },
      { ok: /\d/.test(password), label: "Number" },
    ],
    [password]
  );

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-1.5 flex-1 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                i < score ? level.color : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>
        <span className={`text-[10px] font-medium ${level.text}`}>{level.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {checks.map((c) => (
          <div
            key={c.label}
            className={`flex items-center gap-1 text-[10px] ${
              c.ok ? "text-emerald-500" : "text-zinc-400"
            }`}
          >
            {c.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}
