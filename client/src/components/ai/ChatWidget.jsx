"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, Bot, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const WELCOME = {
  role: "assistant",
  content:
    "Hi! I'm BudgetBee 🐝 — your personal finance advisor.\n\nAsk me things like:\n• Should I buy a phone for 25000 this month?\n• How much can I spend today?\n• Am I on track for my savings goal?\n• Where did my money go?",
};

const CHIPS = [
  "Should I buy a phone for 25000 this month?",
  "How much can I spend today?",
  "Where did my money go?",
  "Am I on track for my goal?",
];

function storageKey(userId) {
  return `cc-chat-${userId}`;
}

function loadMessages(userId) {
  if (typeof window === "undefined" || !userId) return [WELCOME];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [WELCOME];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    /* ignore */
  }
  return [WELCOME];
}

function saveMessages(userId, msgs) {
  if (typeof window === "undefined" || !userId) return;
  try {
    const trimmed = msgs.slice(-80);
    localStorage.setItem(storageKey(userId), JSON.stringify(trimmed));
  } catch {
    /* quota */
  }
}

export function ChatWidget() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef(null);
  const userId = user?.id || user?._id;

  useEffect(() => {
    if (!userId) return;
    setMessages(loadMessages(userId));
    setHydrated(true);
  }, [userId]);

  useEffect(() => {
    if (hydrated && userId) saveMessages(userId, messages);
  }, [messages, hydrated, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!user) return null;

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        message: text,
        history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages([
        ...next,
        { role: "assistant", content: res.data.reply, source: res.data.source },
      ]);
    } catch (err) {
      setMessages([
        ...next,
        { role: "assistant", content: err.message || "Something went wrong — try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    const fresh = [WELCOME];
    setMessages(fresh);
    if (userId) saveMessages(userId, fresh);
  }

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring" }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-honey-400 to-honey-600 text-zinc-900 shadow-honey hover:brightness-110"
        aria-label="Open chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span key="c" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
              <MessageCircle className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="glass-card fixed bottom-24 right-4 z-[80] flex h-[480px] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden shadow-glass-lg dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3 border-b border-amber-500/10 bg-gradient-to-r from-honey-500/15 to-transparent px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-honey-500 text-zinc-900">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">BudgetBee</p>
                <p className="text-[10px] text-zinc-400">Personal finance advisor · local history</p>
              </div>
              <button
                type="button"
                onClick={clearChat}
                title="Clear chat"
                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-rose-500 dark:hover:bg-zinc-800"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <Sparkles className="h-4 w-4 text-honey-500" />
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-2xl rounded-br-md bg-honey-500 px-3.5 py-2.5 text-sm text-zinc-900"
                        : "max-w-[85%] rounded-2xl rounded-bl-md bg-zinc-100 px-3.5 py-2.5 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                    }
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.source && (
                      <p className="mt-1 text-[9px] uppercase tracking-wider opacity-50">{m.source}</p>
                    )}
                  </div>
                </motion.div>
              ))}
              {messages.length <= 1 && !loading && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CHIPS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setInput(c)}
                      className="rounded-full border border-honey-500/30 bg-honey-500/10 px-2.5 py-1 text-[11px] text-honey-700 transition hover:bg-honey-500/20 dark:text-honey-300"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              {loading && (
                <div className="flex gap-1.5 px-2">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
                      className="h-2 w-2 rounded-full bg-honey-500"
                    />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={send} className="flex gap-2 border-t border-amber-500/10 p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Should I buy… / How much left today?"
                className="input-field flex-1"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-honey px-3"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            <p className="border-t border-amber-500/10 bg-zinc-50/60 px-4 py-1.5 text-center text-[9px] leading-relaxed text-zinc-400 dark:bg-zinc-950/40">
              BudgetBee is an automated assistant for learning purposes only — not certified
              financial advice.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
