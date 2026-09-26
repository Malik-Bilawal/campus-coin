import { env } from "../../config/env.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OR_URL = "https://openrouter.ai/api/v1/chat/completions";

async function chatGroq(messages, opts = {}) {
  if (!env.GROQ_API_KEY) throw new Error("No Groq key");
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 800,
      response_format: opts.json ? { type: "json_object" } : undefined,
    }),
    signal: AbortSignal.timeout(opts.timeoutMs || 12000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function chatOpenRouter(messages, opts = {}) {
  if (!env.OPENROUTER_API_KEY) throw new Error("No OpenRouter key");
  const res = await fetch(OR_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL || "anthropic/claude-3.5-haiku",
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 800,
    }),
    signal: AbortSignal.timeout(opts.timeoutMs || 15000),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Try Groq → OpenRouter → throw for caller to fall back to rules.
 */
export async function llmChat(messages, opts = {}) {
  try {
    const content = await chatGroq(messages, opts);
    if (content) return { provider: "groq", content };
  } catch (e) {
    console.warn("[AI] Groq failed:", e.message.slice(0, 120));
  }
  try {
    const content = await chatOpenRouter(messages, opts);
    if (content) return { provider: "openrouter", content };
  } catch (e) {
    console.warn("[AI] OpenRouter failed:", e.message.slice(0, 120));
  }
  throw new Error("All AI providers unavailable");
}

export function parseJsonLoose(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Chat bubbles and insight cards render plain text — strip anything markdown-ish
 * so users never see raw **, #, ` or link syntax.
 */
export function stripMarkdown(text) {
  if (!text) return text;
  return String(text)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links -> label
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1") // code
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/__(.+?)__/g, "$1") // bold
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/^\s{0,3}[-*+]\s+/gm, "• ") // list dashes -> bullet
    .replace(/^\s{0,3}\d+\.\s+/gm, "• "); // numbered -> bullet
}

export function aiStatus() {
  return {
    groq: !!env.GROQ_API_KEY,
    openrouter: !!env.OPENROUTER_API_KEY,
    primary: env.GROQ_API_KEY ? "groq" : env.OPENROUTER_API_KEY ? "openrouter" : "rules-only",
  };
}
