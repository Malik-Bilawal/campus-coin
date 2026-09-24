"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, Bot } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export function ChatWidget() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm BudgetBee 🐝 — ask me about your spending, budgets, or how features work.",
    },
  ]);
  const bottomRef = useRef(null);

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

  return (
    <>
      {/* FAB */}
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
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-amber-500/10 bg-gradient-to-r from-honey-500/15 to-transparent px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-honey-500 text-zinc-900">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">BudgetBee</p>
                <p className="text-[10px] text-zinc-400">AI assistant · advisory only</p>
              </div>
              <Sparkles className="h-4 w-4 text-honey-500" />
            </div>

            {/* Messages */}
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

            {/* Input */}
            <form onSubmit={send} className="flex gap-2 border-t border-amber-500/10 p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your spending..."
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
