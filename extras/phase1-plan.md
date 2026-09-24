# Phase 1 Plan — Campus Coin (Core Build)

**Status:** In Progress  
**Goal:** All 20 Tier-1 features, MVC backend, rich animated UI. AI (Groq/OpenRouter) deferred to Phase 2.

---

## 1. Repository Structure (3 folders)

```
techwiz/
├── client/                          # Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/              # login, register, forgot/reset password
│   │   │   ├── (dashboard)/         # sidebar shell + all app pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # landing + visual sitemap
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                  # Button, Card, Input, Modal, Badge...
│   │   │   ├── layout/              # Sidebar, Topbar, Breadcrumbs, Logo
│   │   │   ├── dashboard/           # BalanceCard, TopCategory, BudgetRing
│   │   │   ├── transactions/        # TxTable, QuickAddForm, TxRow
│   │   │   ├── charts/              # Recharts wrappers
│   │   │   └── shared/              # EmptyState, Skeleton, ConfirmDialog
│   │   ├── lib/                     # api client, utils, formatters
│   │   ├── hooks/                   # useAuth, useTransactions, useTheme
│   │   ├── store/                   # zustand: auth, ui
│   │   └── types/
│   ├── middleware.ts                # JWT check → /login
│   ├── .env.local
│   └── package.json
│
├── server/                          # Express + MVC
│   ├── src/
│   │   ├── config/                  # db.js, env.js
│   │   ├── models/                  # User, Category, Transaction, Budget,
│   │   │                            # Tip, Bookmark, Insight, Announcement, Notification
│   │   ├── controllers/
│   │   ├── routes/                  # /api/v1/*
│   │   ├── middlewares/             # auth, role, validate, error, rateLimit
│   │   ├── services/                # tipsEngine, aggregations, budgetAlerts
│   │   ├── utils/                   # token, asyncHandler, apiError
│   │   ├── seeds/                   # default categories, admin user
│   │   ├── app.js
│   │   └── server.js
│   ├── .env
│   ├── .env.example
│   └── package.json
│
└── extras/                          # docs
    ├── req.md
    ├── overview.md
    └── phase1-plan.md
```

**Philosophy:** controllers = HTTP glue only; business logic in `services/`; models = schema + helpers; routes = pure wiring; middlewares = cross-cutting.

---

## 2. Tech Stack (locked)

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 14, Tailwind, Framer Motion, Recharts, Zustand, React Hook Form + Zod |
| Backend | Express 4, Mongoose 8, JWT (access + refresh httpOnly), bcryptjs, zod, helmet, cors, rate-limit |
| DB | MongoDB Atlas `/campuscoin` + local mongosh backup |
| AI (Phase 2) | Groq primary, OpenRouter fallback — hooks only in Phase 1 |
| Deploy | Vercel (client) + Render (server) |

---

## 3. Design System (BudgetBee)

| Token | Value |
|-------|-------|
| Primary | Amber `#F59E0B` → gold `#FBBF24` gradient |
| Bg dark | `#0C0A09` / surfaces `#1C1917` |
| Bg light | `#FFFBEB` tint / surfaces `#FFFFFF` |
| Success / danger | Emerald `#10B981` / Rose `#F43F5E` |
| Font | Inter + tabular-nums for money |
| Radius | Cards `xl`, buttons `lg` |
| Elevation | Glass: `backdrop-blur border-amber-500/10` |

**Motion rules (Framer Motion):**
- Page transitions: fade + 8px slide, 200ms
- Card grids: stagger 50ms
- Count-up balance animations
- Chart grow-in on mount
- Buttons: `whileTap={{ scale: 0.97 }}`
- Modals: scale 0.95→1 + backdrop blur
- Skeletons on all loading states

**Component kit first:** Button, Card, Input, Select, Badge, Modal, Toast, Progress, Tabs, EmptyState, Skeleton, StatCard, PageHeader

**Layout:** collapsible sidebar (honeycomb logo), topbar (dark toggle, font-size, notifications), breadcrumbs.

---

## 4. Data Models

```
User        { name, email, passwordHash, role: student|admin,
              academicYear, allowanceBaseline, savingsGoal,
              currency, fontSize, theme,
              resetToken, resetExpires, isActive }

Category    { userId: null|ObjectId, name, type: income|expense,
              icon, color, isDefault }

Transaction { userId, type, amount, categoryId, note, date,
              isRecurring, recurringDay,
              aiSuggested, userCorrectedCategory,
              flags: [duplicate|unusually_large] }

Budget      { userId, categoryId, month: "YYYY-MM", limit }

Tip         { userId, title, body, impactScore,
              status: active|dismissed|pinned }

Bookmark    { userId, refModel, refId, createdAt }

Insight     { userId, month, narrative, flags[], createdAt }

Notification{ userId, type, message, read, createdAt }

Announcement{ title, body, active }
```

**Indexes:** `Transaction { userId+date }`, `{ userId+categoryId+date }`, `Category { userId+type }`

---

## 5. API Surface (`/api/v1`)

| Prefix | Endpoints |
|--------|-----------|
| `/auth` | register, login, logout, refresh, forgot-password, reset-password/:token, me |
| `/users` | GET/PATCH profile, password, prefs |
| `/categories` | CRUD + defaults |
| `/transactions` | CRUD + filters |
| `/budgets` | CRUD + progress |
| `/dashboard` | summary aggregations |
| `/reports` | category, 6-month, daily/weekly, filtered |
| `/tips` | generate/rank, pin/dismiss |
| `/bookmarks` | CRUD |
| `/insights` | history (Phase 2 fills) |
| `/notifications` | GET, PATCH read |
| `/admin` | stats, users, categories, announcements |

**Budget alert:** on tx create → spend ≥80%/100% → Notification + toast in response.

---

## 6. Core Feature Build Order (all 20)

- [x] **Step 0 — Scaffold:** create-next-app, express structure, deps, tailwind tokens, Atlas wired, health-check
- [x] **Step 1 — Auth & profile (#1–5):** register, login, JWT refresh, forgot/reset, profile, protected routes
- [x] **Step 2 — Categories & tx (#6–8):** seeds, custom CRUD, quick-add, recurring, filters
- [x] **Step 3 — Dashboard (#9):** balance, income vs expense, top category, budget vs actual, quick-add, greeting, tips widget
- [x] **Step 4 — Budgets & alerts (#12–13):** limits, animated progress, toasts + bell
- [x] **Step 5 — Reports & export (#10–11):** pie/bar/line, daily/weekly, filters, PDF/image export
- [x] **Step 6 — Tips & bookmarks (#14–15):** rule-based ranking, pin/dismiss, bookmarks page
- [x] **Step 7 — Admin (#16):** stats, user management, default categories, announcements
- [x] **Step 8 — UX polish (#17–20):** dark/light, font-size, breadcrumbs, landing sitemap, responsive, skeletons, empty states
- [ ] **Step 9 — Verify & deploy:** test matrix, seed demo, .gitignore, deploy, smoke test

---

## 7. Phase 2+ (out of scope now)

AI categorization/insights, CSV import, forecast, duplicate detection, recently-viewed, insight history, confetti, streaks, voice input, chatbot.  
**Hooks ready:** `aiSuggested`, `Insight` model, `flags`.

---

## 8. Conventions

- 2-space indent, ES modules (server), double quotes (client)
- Money: Number + 2-decimal display
- Dates: UTC store, local month for reports
- API: `{ success, data | error, message }`
- All controllers `asyncHandler` + `ApiError`
- One commit per step
- **Never commit** `atlas-credentials.env`

---

## Progress Log

| Date | Step | Notes |
|------|------|-------|
| 2026-09-24 | Plan saved | Phase 1 approved |
| 2026-09-24 | Step 0 Scaffold | client (Next 14) + server (Express MVC) created; deps installed; Atlas + local Mongo dual-connect |
| 2026-09-24 | Step 1 Auth | register/login/logout/refresh/forgot/reset/profile — API 200 verified |
| 2026-09-24 | Step 2 Categories + Tx | seeds (12 defaults), CRUD, filters, recurring flag — smoke tested |
| 2026-09-24 | Step 3 Dashboard | aggregations (balance, top cat, budgets, trend, recent) — verified |
| 2026-09-24 | Step 4 Budgets | upsert/progress/alert service — created via API |
| 2026-09-24 | Step 5 Reports | category/trend/daily-weekly/filtered — all 200 |
| 2026-09-24 | Step 6 Tips + bookmarks | tips engine + pin/dismiss + bookmarks — refresh 200 |
| 2026-09-24 | Step 7 Admin | stats/users/default cats/announcements — admin login 200 |
| 2026-09-24 | Step 8 UX polish | dark/light, font-size, breadcrumbs, landing sitemap, glass UI, Framer Motion — all pages in build |
| 2026-09-24 | Build check | `next build` — 22 routes OK |
| 2026-09-24 | Live smoke | API :5000 + client :3000 running; demo/admin login OK |

### Known environment notes
- Local `mongod` running on `127.0.0.1:27017` (binary from mongodb-memory-server cache, data `D:\mongodb-data`)
- Atlas URI in `.env` — network to `:27017` is flaky; dual-connect prefers local, falls back to Atlas then memory
- Google Fonts blocked on this network — using local Geist font
- Demo: `demo@campuscoin.app / Demo@123` · Admin: `admin@campuscoin.app / Admin@123`
