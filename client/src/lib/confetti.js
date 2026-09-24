"use client";

import confetti from "canvas-confetti";

const HONEY = ["#F59E0B", "#FBBF24", "#FDE68A", "#10B981", "#3B82F6"];

export function celebrate(opts = {}) {
  if (typeof window === "undefined") return;
  const {
    particleCount = 120,
    spread = 70,
    origin = { y: 0.7 },
    colors = HONEY,
    scalar = 1,
  } = opts;

  confetti({
    particleCount,
    spread,
    origin,
    colors,
    scalar,
    disableForReducedMotion: true,
  });
}

export function celebrateBig() {
  celebrate({ particleCount: 160, spread: 100, origin: { y: 0.6 }, scalar: 1.1 });
  setTimeout(() => {
    celebrate({ particleCount: 80, spread: 120, origin: { y: 0.5 } });
  }, 250);
}
