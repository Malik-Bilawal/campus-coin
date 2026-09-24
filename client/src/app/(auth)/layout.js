"use client";

import { motion } from "framer-motion";
import { redirect } from "next/navigation";

export default function AuthLayout({ children }) {
  return <div className="min-h-screen">{children}</div>;
}
