# Phase 2 Plan — Campus Coin (AI + Realtime + UI Depth)

**Status:** In Progress  
**Depends on:** Phase 1 core (~82% done)  
**Git:** `techwiz/` repo, commit `5e41ac8` = Phase 1 baseline

---

## Goals

1. **AI everywhere** it adds judge-visible value (Groq primary, OpenRouter fallback)
2. **Live alerts** via WebSocket (notifications/budgets without refresh)
3. **Sidebar v2** — fixed, sectioned, polished
4. **Personalization** — greeting, goals, streak (deeper prefs after core lock)
5. **Admin** — minimal but strong (not bloated)

---

## A. AI (everywhere possible)

| # | Feature | Where AI hits | Backend | Frontend |
|---|---------|---------------|---------|----------|
| A1 | **Live category suggest** | Typing tx note | `POST /ai/categorize` | Badge “AI suggested”, accept/override |
| A2 | **Batch categorize CSV** | Import flow | `POST /ai/categorize-batch` | Preview table with confidence |
| A3 | **Monthly insight narrative** | Reports + Insights | `POST /ai/insight/:month`, `GET /insights` | Insight feed + history |
| A4 | **Chatbot** | Global FAB | `POST /ai/chat` (FAQ + user data tools) | Floating chat, streaming-style UI |
| A5 | **Smarter tips** | Tips refresh | Optional: rewrite tip body via AI | Same tips UI, better copy |
| A6 | **Anomaly flags** | On tx create | Rule first, AI second opinion | Warning badge already in model |

### AI architecture
```
server/src/services/ai/
  provider.js     # Groq → OpenRouter → local rule fallback
  categorize.js   # keyword + LLM prompt
  insight.js      # month stats → narrative
  chat.js         # system prompt + optional spend tools
```
- Env: `GROQ_API_KEY`, `GROQ_MODEL`, `OPENROUTER_API_KEY`
- Every AI path must **degrade to rules** if keys fail (demo-safe)
- Cache: insight per `userId+month` in existing `Insight` model

### Chatbot scope (locked)
- FAQ: budgets, export, categories, streaks
- Personal: “food this month?”, “can I afford 500 more?”, “top category”
- Tools: server-side functions the model can call (read-only aggregates)
- Disclaimer: advisory, not financial advice

---

## B. WebSocket (live)

| Event | Trigger | Client reaction |
|-------|---------|-----------------|
| `notification:new` | budget 80%/100%, admin announcement | toast + bell badge |
| `budget:updated` | after tx that changes % | dashboard/budgets live update |
| `tx:created` (optional) | same session tabs | refresh list |

- Lib: `socket.io` on Express + `socket.io-client` on Next
- Auth: JWT in handshake
- Scope: **live alerts/notifications only** for now (no multi-user chat)
- Add later only if demo needs it

---

## C. Sidebar v2 (fixed — recommended)

**Decision:** Fixed/sticky full-height sidebar on desktop; slide-over drawer on mobile.

### Design
- Section groups: **Overview** · **Money** · **Insights** · **Admin** (if role)
- Honeycomb/hex active indicator + gradient pill
- Streak chip + mini savings-goal ring at bottom
- Collapse to icons (existing) + remember preference
- Smooth width spring animation; mobile hamburger overlay
- Avatar + role at top, logout footer

### Files
- `client/src/components/layout/Sidebar.jsx` (rewrite)
- `Dashboard layout` — ensure `lg:pl-[240px]` content offset when fixed

---

## D. Personalization (after core AI lands)

- Greeting + date-aware copy (exam week? allowance day?)
- Savings goal progress ring (from `user.savingsGoal` vs month save)
- Streak counter chip (model already has `loginStreak`)
- “Because you’re {academicYear}” tip filter
- Font size / theme already done — keep, don’t rebuild

---

## E. Admin (minimal strong)

Keep current pages; tighten only:
- Stats: add 7-day sparkline (tx volume)
- Users: bulk disable not needed — single actions OK
- One “System health” card: AI provider status, Mongo host, uptime
- No extra CRUD beyond existing 4 sections

---

## F. Tier 3 delights (timeboxed)

1. **Confetti** when budget underspent / goal hit  
2. **Forecast** next month line on reports (linear)  
3. **Badges** (“Food Saver”, “Budget Master”) on profile  
Skip voice/OCR/PWA unless time left after deploy.

---

## Build order (Phase 2)

| Day slice | Work |
|-----------|------|
| 2.0 | Plan saved, git ready, AI provider scaffold + env |
| 2.1 | A1 categorize + A3 insights (highest judge impact) |
| 2.2 | A4 chatbot + A2 CSV import |
| 2.3 | B WebSocket live notifications |
| 2.4 | C Sidebar v2 + layout fix |
| 2.5 | D personalization + F delights |
| 2.6 | E admin tighten, smoke, commit, deploy prep |

---

## Success criteria

- [ ] Type “cafe” → Food suggested with badge in &lt;1s (or rules fallback)
- [ ] Open Insights → real narrative for current month, history list works
- [ ] Chatbot answers FAQ + “spent on food” with real numbers
- [ ] Budget 80% hit → toast without refresh (WS)
- [ ] Sidebar fixed, sectioned, mobile drawer works
- [ ] `npm run build` green; Phase 2 commit pushed locally
- [ ] AI keys never required for core CRUD (fallback proven)

---

## Out of scope Phase 2

- Real bank sync, payments, multi-user social features  
- Full redesign of theme (theme locked perfect)  
- Heavy admin analytics suites  

---

## Progress log

| Date | Item | Notes |
|------|------|-------|
| 2026-09-24 | Plan created | Ready to implement |
| 2026-09-24 | AI layer | Groq→OpenRouter→rules; `/ai/status`, categorize, insight, chat |
| 2026-09-24 | WebSocket | socket.io JWT handshake; live toasts + topbar dot |
| 2026-09-24 | Sidebar v2 | Fixed desktop + mobile drawer, sectioned, streak chip |
| 2026-09-24 | Insights page | Narrative + history + stats |
| 2026-09-24 | CSV import | PapaParse + batch AI categorize |
| 2026-09-24 | Live AI suggest | Debounced note → category badge on tx form |
| 2026-09-24 | ChatWidget | Global FAB chat on dashboard shell |
| 2026-09-24 | Fixes | env self-import, dotenv bootstrap, socket/provider paths |
| 2026-09-24 | Auth token | sessionStorage access token for WS after reload |
| 2026-09-24 | Delights | Confetti (safe budgets / goal hit), admin system health |
| 2026-09-24 | Smoke | build 24 routes; API+AI+WS all 200; demo login OK |

### Success criteria

- [x] Type “cafe” → Food suggested with badge (rules or AI &lt;1s debounce)
- [x] Open Insights → real narrative for current month, history list works
- [x] Chatbot answers FAQ + “spent on food” with real numbers
- [x] Budget 80% hit → toast without refresh (WS emit + client handler)
- [x] Sidebar fixed, sectioned, mobile drawer works
- [x] `npm run build` green (24 routes)
- [x] AI keys never required for core CRUD (rules fallback proven on categorize)

### Still open (optional Phase 3 / deploy)

- [ ] Linear forecast line on reports trend chart
- [ ] Profile badges (“Food Saver”, “Budget Master”)
- [ ] Push deploy (Vercel + Render)
- [ ] Deeper prefs (currency display options beyond profile)
