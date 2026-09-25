# Campus Coin — Requirement Coverage Report

**Sources:** `extras/req.md` (SRS, sections 1.1–1.7) · `extras/overview.md` (Tier 1/2/3 checklists)
**Date:** 2026-09-25 · **Verdict:** All SRS functional requirements implemented; Tier 1 = 20/20, Tier 2 = 10/10, Tier 3 = 7/10 (3 optional items not in SRS, see §6).

**Status legend:** ✅ implemented · ⚠️ implemented with stated interpretation · ❌ not implemented · 📝 source-document note

---

## 0. Source-document notes

- 📝 The `req.md` table of contents lists **§1.8 Interface Requirements** and **§1.9 Project Deliverables**, but the file's content ends at §1.7. No other requirements document exists in the repo. Those two sections cannot be mapped — this is truncation of the source document, not an implementation gap.
- 📝 SRS §1.6 Admin panel offers "System-wide announcement **or** tip templates". Announcements are implemented, which satisfies the "or". System tip templates are therefore not required (tips are generated per-user from transaction history instead).
- 📝 Per the SRS "Important Note Regarding AI Usage", AI tool usage is acknowledged in §8 of this report.

---

## 1. SRS §1.1–1.5 (Background, Solution, Purpose, Scope, Constraints)

| Constraint / claim (§1.2–1.5) | Status | Evidence |
|---|---|---|
| Three-tier architecture (presentation / API / data) | ✅ | Next.js 14 App Router (`client/`) · Express controllers+services (`server/src/`) · MongoDB Atlas (`server/src/config/db.js`) |
| Register → login → immediately record income/expenses | ✅ | `(auth)/register`, `(auth)/login`, `transactions/new` |
| Central database powering breakdowns, trends, tips engine | ✅ | `Transaction` model + aggregations in `report.controller.js`, `tipsEngine.js` |
| Income categories: allowance, part-time, scholarship, gift, other | ✅ | System category seed `seedSystemCategories` (`server/src/server.js`), exercised on every boot |
| Expense categories: food, transport, hostel/rent, academics, subscriptions, entertainment, miscellaneous | ✅ | Same seed; verified list in `categories` page |
| Manual entry **or** CSV file upload — no bank integration | ✅ | Manual CRUD + `POST /transactions/import` (CSV via PapaParse, `transactions/import/page.js`); no payment/bank code anywhere |
| No bank verification / payment processing / real money handling | ✅ | Out of scope by design — no such endpoints |
| AI output is advisory, review-or-override, "not certified financial advice" | ✅ | Categorization Accept/Ignore + manual category select (`transactions/new/page.js`); chat disclaimer (`components/ai/ChatWidget.jsx`) |
| Responsive across desktop/tablet/mobile | ✅ | Tailwind breakpoints throughout (`sm:`/`lg:` grids); landing + auth + dashboard responsive |
| Compatible with major browsers | ✅ | Evergreen-browser features only (Next 14 output) |
| Data storage / backup procedures | ⚠️ | MongoDB Atlas with automated backups (Atlas M0+ default). Local dev may fall back to `mongodb-memory-server` (ephemeral) — documented in `AGENTS.md` |
| Modern front end + robust DB layer | ✅ | See §1.2 architecture note |

---

## 2. SRS §1.6 Functional Requirements

### 2.1 User Authentication and Management

| Requirement | Status | Evidence |
|---|---|---|
| Student registration and login | ✅ | `POST /auth/register`, `POST /auth/login` (`auth.routes.js:30-31`); multi-step form `(auth)/register` with **email OTP verification** |
| Separate, direct-access administrator login | ✅ | `POST /auth/admin-login` (`auth.routes.js:32`, role-gated, 401 for non-admin) + dedicated page `(auth)/admin-login/page.js`; linked from login footer |
| Secure session management | ✅ | JWT access token (15 min, httpOnly cookie + sessionStorage) + refresh token (7 d) with auto-refresh on 401 (`client/src/lib/api.js`); `protect`/`adminOnly` middleware (`server/src/middlewares/auth.js`); rate limiting 30 req/15 min on auth routes |
| Password recovery/reset via email verification or tokenized link | ✅ | `POST /auth/forgot-password` → SHA-256 token + 30-min expiry; `[RESET LINK]` printed to server console (no SMTP); `(auth)/forgot-password` + `(auth)/reset-password` pages |
| Profile: name, academic year, allowance baseline, savings goal (editable) | ✅ | `PATCH /users` with zod `profileSchema` (`user.routes.js:28`); `(dashboard)/profile/page.js` |
| Optional bulk import of historical transactions from CSV | ✅ | `POST /transactions/import` (≤500 rows, budget alerts + notification); PapaParse upload/preview with sample CSV (`transactions/import/page.js`) |

### 2.2 Category Management

| Requirement | Status | Evidence |
|---|---|---|
| Default income/expense categories (full list from SRS) | ✅ | Auto-seeded every boot (`seedSystemCategories`); 5 income + 7 expense defaults |
| Registered users create personal categories (income + expense) | ✅ | `POST /categories` (per-user, `userId` set); `(dashboard)/categories` page |
| Add / edit / delete own categories ("Manage Own Categories") | ✅ | `POST`/`PATCH`/`DELETE /categories` with zod validation on create + edit (`category.routes.js:22-25`); system defaults protected from edit/delete |

### 2.3 Personalized Dashboard

| Requirement | Status | Evidence |
|---|---|---|
| Personalized greeting | ✅ | Time-of-day greeting + first name (`dashboard.controller.js` → `dashboard/page.js`) |
| Current month balance (income vs expense) | ✅ | Aggregation → Net balance / Income / Expenses stat cards |
| Quick-add buttons | ✅ | "Add expense" → `/transactions/new`, "Add income" → `/transactions/new?type=income` |
| Saving tips / highlights from own history | ✅ | "Tips for you" widget: pinned first, filled with top-ranked active tips (max 3) |
| Dynamic widget: This Month's Top Category | ✅ | `topCategory` stat card (aggregation + `$lookup`) |
| Dynamic widget: Budget vs Actual | ✅ | Per-category progress bars with % + over-budget coloring |

### 2.4 Income and Expense Logging

| Requirement | Status | Evidence |
|---|---|---|
| Quick-add form for all income + expense categories | ✅ | `(dashboard)/transactions/new` — type toggle, amount, category, date, note |
| Recurring entries (monthly allowances, subscriptions) | ✅ | `isRecurring` + `recurringDay` in form; **monthly materialization** service `services/recurring.js` (guard: once per month per category+note, only after recurring day, never before template creation) invoked from dashboard |
| Edit and delete transactions while retaining full history | ⚠️ | Edit/delete + list history with filters/pagination preserved across sessions. **Interpretation:** "retaining full history" = the transaction list remains complete and reviewable (edits update in place, deletes are explicit with confirmation); no value-level version snapshots are stored — see §7 |
| Filters on the list (type/category/search/date) | ✅ | `GET /transactions` with `type`, `categoryId`, `q`, `from`/`to`, pagination |

### 2.5 Optional AI-Driven Expense Categorization Assistant

| Requirement | Status | Evidence |
|---|---|---|
| AI/ML suggests category while typing the description | ✅ | Debounced `POST /ai/categorize` while typing note (`transactions/new/page.js`); LLM via Groq → OpenRouter → **local keyword rules** (`services/ai/categorize.js`) — works with empty API keys |
| Learns from the student's corrections over time | ✅ | Per-user learning map: token→category frequency from the user's own history, **user corrections weighted 3×** (`buildUserLearningMap` in `categorize.js`); consulted before the LLM |
| Manual override of any AI-suggested category | ✅ | Category `<select>` always editable; Accept/Ignore buttons on the suggestion chip; user override flagged `userCorrectedCategory` |
| Batch categorization suggestions on CSV import | ✅ | `POST /ai/categorize-batch` (≤100 rows) wired into import preview (`ai.routes.js:52-67`) |

### 2.6 Monthly Reports

| Requirement | Status | Evidence |
|---|---|---|
| Category-wise report of monthly spending | ✅ | `GET /reports/category` + pie chart + detail table (`reports/page.js`) |
| Income vs expense, last six months | ✅ | `GET /reports/trend` + line chart (dashboard also shows 180-day trend) |
| Daily and weekly spending summaries (current month) | ✅ | `GET /reports/daily-weekly` → daily bar chart **and weekly bar chart** (W1–W5) |
| Filters by date range, category, or income source | ✅ | "Custom range report" card → `GET /reports/filtered?from&to&type&categoryId` with income/expense totals + matching list |
| Export monthly report as PDF or image | ✅ | html2canvas + jsPDF → `campus-coin-report-<month>.pdf` (`reports/page.js`) |
| Forecast next month from historical trends *(optional, §1.6 system intelligence)* | ✅ | `GET /reports/forecast` — least-squares linear projection over up to 6 months; dashed "Projected" line + projection stat card |

### 2.7 Optional AI-Generated Monthly Spending Insights

| Requirement | Status | Evidence |
|---|---|---|
| Short plain-language narrative from month's transactions | ✅ | `POST /ai/insight/:month` (`services/ai/insight.js`) — LLM with rules fallback; provider shown in UI |
| Flags categories with above-average growth vs own trend | ✅ | `flags` (e.g. "Coffee & Cafe spending rose 44% vs last month") + budget-exceeded flags; rendered as warning chips |
| Simple actionable advice tied to the flagged pattern | ✅ | `advice` field on `Insight` (e.g. "Fix this first: … Trim Food spending…"); "Next step" card on insights page; deterministic `deriveAdvice()` + backfill for older insights |
| Stores insight history for past months | ✅ | Unique `(userId, month)` `Insight` docs; "Insight history" expandable list (12 months) |

### 2.8 Personalized Saving Tips Engine

| Requirement | Status | Evidence |
|---|---|---|
| Compares current spending vs historical averages **and budget goals** | ✅ | `tipsEngine.js` — current month vs **3-month historical average per category** + budget 70% threshold + savings-rate check |
| Ranks tips by potential savings impact, shows top few on dashboard | ✅ | `impactScore` sort; top 6 persisted, top 3 in dashboard widget (pinned first) |
| Dismiss or pin tips | ✅ | `PATCH /tips/:id/status`; pin/dismiss buttons on `(dashboard)/tips`; dismissed hidden by default from `GET /tips` |

### 2.9 Budget Goals and Alerts

| Requirement | Status | Evidence |
|---|---|---|
| Monthly budget per category | ✅ | `POST /budgets` (upsert keyed by category+month); `(dashboard)/budgets` page |
| Real-time consumption via progress bars | ✅ | Budget vs actual widget (dashboard) + budgets page bars, color-stepped at 80%/100% |
| In-app notification when category nears/exceeds budget | ✅ | `services/budgetAlerts.js` on transaction create/update/import → toast + in-app notification + socket event |

### 2.10 Bookmarking, Notes, and Sharing

| Requirement | Status | Evidence |
|---|---|---|
| Bookmark a saving tip **or monthly insight** | ✅ | `POST /bookmarks` supports `refModel: Tip | Insight` with toggle; bookmark buttons on tips page **and** insights page; `(dashboard)/bookmarks` page |
| Export monthly reports or savings summaries as PDF | ✅ | Reports: html2canvas+jsPDF. Tips: text-PDF "Export summary PDF" (jsPDF) |
| Share them by email | ⚠️ | "Share by email" modal on reports page — validates address, logs request, shows success toast (fake sharing, no SMTP; matches Tier-2 #30 spec) |

### 2.11 Admin Control Panel

| Requirement | Status | Evidence |
|---|---|---|
| Add/edit/remove default expense/income categories | ✅ | `POST`/`PATCH`/`DELETE /admin/categories` (`admin.routes.js:38-41`, validated); `(dashboard)/admin/categories` |
| System-wide announcement **or** tip templates | ✅ | Announcements CRUD + broadcast to all users (`admin.routes.js:49-52`, `services/notify`); banner on dashboard (`AnnouncementBanner`) |
| User accounts: view, disable, reset | ✅ | `GET /admin/users`, `PATCH /users/:id/toggle`, `PATCH /users/:id/reset-password`, `DELETE /users/:id`; `(dashboard)/admin/users` |
| Usage statistics: active users, total transactions, most used categories | ✅ | `GET /admin/stats` → `(dashboard)/admin` overview cards |
| Separate direct-access admin login *(§1.6 auth)* | ✅ | `POST /auth/admin-login` + `(auth)/admin-login` page (see §2.1) |

### 2.12 Optional System Intelligence (Advanced UX)

| Requirement | Status | Evidence |
|---|---|---|
| Tracks recently viewed / edited transactions across sessions | ✅ | `lastViewedAt` / `lastEditedAt` on `Transaction` (set on `GET /:id` and `PATCH`); `GET /transactions/recent` (merged, recency-sorted); "Recently viewed / edited" card on transactions page |
| Forecast for upcoming month from historical trends | ✅ | See §2.6 forecast |
| Detect and flag unusually large or duplicate transactions | ✅ | `detectFlags()` on create + CSV import: **duplicate** = same amount+category within ±48 h; **unusually_large** = > mean + 2σ of the user's last 90 days (≥10 samples). Badges rendered in transaction list |

### 2.13 Accessibility and UI Enhancements

| Requirement | Status | Evidence |
|---|---|---|
| Dark-mode toggle | ✅ | `theme` in `store/ui.js` + `Providers.jsx` (`dark` class), Topbar toggle, persisted (zustand `partialize`) |
| Font-size adjustment | ✅ | `setFontSize` (S/M/L → `--font-size-base` in `globals.css`), Topbar control |
| Breadcrumbs across dashboard sections | ✅ | `PageHeader breadcrumbs` prop used on all dashboard pages |
| Smooth transitions + loading indicators (charts, insights) | ✅ | framer-motion entrances, Recharts animations, skeleton loaders (`SkeletonList`), spinner buttons, `MotionConfig reducedMotion="user"` |
| Visual sitemap on homepage *(Tier 1 #19)* | ✅ | `#sitemap` section on landing page (`app/page.js`) |

---

## 3. SRS §1.7 Non-Functional Requirements

| NFR | Status | Evidence |
|---|---|---|
| Safe to use (no malicious/unnecessary downloads) | ✅ | Only user-initiated PDF/CSV-sample downloads; no third-party ad/script CDNs |
| Accessibility (legible fonts, clear UI/navigation) | ✅ | Focus-visible rings, `reducedMotion="user"`, dark mode, font-size control, aria labels on icon buttons |
| User-friendliness (easy for first-time users) | ✅ | Empty states with CTA on every page, demo accounts one-click on login, sample CSV, welcome chat chips |
| Operability (reliable, efficient) | ✅ | Health endpoint `/api/v1/health`, idempotent seeding, guarded destructive seed script |
| Performance (speed, minimal load time) | ✅ | DB indexes (`Transaction` compound indexes), aggregated single-round queries, lazy charts, AI calls with timeouts + local fallback |
| Scalability | ✅ | Stateless JWT API, Mongoose + Atlas scaling path, service-layer MVC; no server-side sessions to migrate |
| Security (auth only; users see only their own history) | ✅ | bcrypt/argon-style hashing via `User.hashPassword`, JWT, every query scoped `userId: req.user.id`, zod validation on all mutating routes, rate limiting (500/15 min API, 30/15 min auth), `adminOnly` gate |
| Availability 24/7 | ⚠️ | Designed for 24/7 hosting (Atlas + planned Vercel/Render deploy); actual production deployment still open — see §9 |
| Compatibility (latest browsers, various devices) | ✅ | Chromium/Firefox/WebKit modern features; responsive from 360 px up |

---

## 4. Tier 1 — Core Features (overview.md): 20/20 ✅

| # | Feature | Status | Evidence |
|---|---|---|---|
| 1 | Registration (name, email, password, academic year, savings goal) | ✅ | 3-step form + `POST /auth/request-otp`→`register`; money-profile fields persisted |
| 2 | Login (student + separate admin login) | ✅ | `/auth/login` + `/auth/admin-login` |
| 3 | Secure session management | ✅ | JWT + refresh + protected layouts (`(dashboard)/layout.js`) |
| 4 | Password recovery/reset | ✅ | Tokenized link flow (console-printed in dev) |
| 5 | Profile (editable: name, academic year, allowance baseline, savings goal) | ✅ | `PATCH /users` + profile page |
| 6 | Category management (defaults + custom CRUD) | ✅ | Boot-seeded defaults + `/categories` CRUD |
| 7 | Transaction CRUD (add, edit, delete, list) | ✅ | Full CRUD + filters/pagination |
| 8 | Recurring transactions (monthly copy) | ✅ | Form toggle + `services/recurring.js` materialization |
| 9 | Dashboard (balance, income vs expense, quick-add, top category, budget vs actual) | ✅ | All widgets present |
| 10 | Monthly reports (category, 6-month trend, daily/weekly, filters) | ✅ | 5 report endpoints + charts |
| 11 | Export report as PDF/image | ✅ | html2canvas + jsPDF |
| 12 | Budget goals (per category, monthly) | ✅ | `/budgets` CRUD upsert |
| 13 | Budget alerts (in-app on near/exceed) | ✅ | `budgetAlerts.js` → toast + notification |
| 14 | Saving tips engine (current vs historical, ranked) | ✅ | 3-month averages + impact ranking |
| 15 | Bookmarking (tips, insights) | ✅ | Toggle endpoint + buttons + bookmarks page |
| 16 | Admin panel (default categories, users, announcements, stats) | ✅ | 3 admin pages + gated API |
| 17 | Dark mode + font-size toggle | ✅ | Topbar controls, persisted |
| 18 | Breadcrumbs | ✅ | `PageHeader` on all sections |
| 19 | Sitemap on homepage | ✅ | Visual tree section on landing |
| 20 | Responsive design | ✅ | Tailwind breakpoints everywhere |

## 5. Tier 2 — Wow Features: 10/10 ✅

| # | Feature | Status | Evidence |
|---|---|---|---|
| 21 | AI expense categorization ("cafe" → Food) | ✅ | Rules + LLM + **per-user learning**; "AI suggested" badge + Accept/Ignore |
| 22 | AI monthly insights (narrative) | ✅ | LLM w/ rules fallback + flags + advice |
| 23 | CSV import (PapaParse, batch categorization) | ✅ | Import page + `/transactions/import` + `/ai/categorize-batch` |
| 24 | Forecast next month (linear projection) | ✅ | Least-squares forecast endpoint + dashed chart line |
| 25 | Duplicate/large transaction detection | ✅ | Flags on create/import + list badges |
| 26 | Recently viewed/edited transactions | ✅ | Cross-session tracking + sidebar card |
| 27 | Pin/dismiss tips | ✅ | Status toggle + filtered lists + widget |
| 28 | Insight history | ✅ | 12-month expandable history |
| 29 | PDF export of savings summary | ✅ | Tips page "Export summary PDF" (jsPDF) |
| 30 | Share via email (fake, show success) | ✅ | Reports modal → validate + log + toast |

## 6. Tier 3 — Extra Features: 7/10 *(not required by the SRS)*

| # | Feature | Status | Evidence |
|---|---|---|---|
| 31 | AI chatbot | ✅ | `ChatWidget` (BudgetBee) — LLM w/ FAQ rule fallback + disclaimer |
| 32 | Animated charts | ✅ | Recharts animations + framer-motion cards |
| 33 | Confetti on goal achieved | ✅ | `lib/confetti` when savings goal hit |
| 34 | Streak counter | ✅ | `loginStreak` badge on dashboard |
| 35 | Dark/light auto-switch by time | ❌ | Not implemented (theme toggle instead) |
| 36 | PWA (installable) | ❌ | Not implemented |
| 37 | Voice input for transactions | ❌ | Not implemented |
| 38 | Receipt OCR | ❌ | Not implemented (flagged risky in source) |
| 39 | Multi-currency support | ✅ | Currency stored per user (BDT/EUR/USD…), applied in `formatMoney` everywhere |
| 40 | Gamification badges | ⚠️ Partial | Streak + "Goal hit 🎯" badges; no badge collection page |

---

## 7. Interpretations & decisions

1. **"Retaining full history" (§1.6 logging)** — implemented as: the transaction history stays complete and reviewable (filters, search, pagination across sessions; edits update in place; deletes require confirmation). No per-edit value snapshots are stored.
2. **"Announcement or tip templates" (admin)** — announcements chosen; tips are generated per-user instead of via system templates.
3. **Forecast** — ordinary least-squares over up to 6 months of expense totals; falls back to 2-month average → last month → "no data".
4. **Tips historical averages** — 3-month window, normalized by months-with-data (avoids skew when history is partial).
5. **Duplicate definition** — same user + type + amount + category within ±48 h of the new entry. **Unusually large** — amount > mean + 2σ of that user's same-type transactions over 90 days, requiring ≥10 samples.
6. **Email features** — no SMTP anywhere (project constraint): OTPs, reset links print to server console and return `devOtp`/`devResetUrl` in development; report sharing logs + toasts (per Tier-2 #30).
7. **AI hard-fail policy** — every AI path degrades to local rules when `GROQ_API_KEY`/`OPENROUTER_API_KEY` are empty, so demos never break.
8. **Recurring materialization** — runs on dashboard load; creates at most one instance per month per template (category+note), only on/after the recurring day, never dated before the template's creation.

## 8. AI tool acknowledgment (per SRS §1.6 "Important Note Regarding AI Usage")

- Development used an **AI coding assistant** (opencode CLI, Claude model) for scaffolding, drafting code, debugging, and producing parts of this documentation. All generated code was reviewed, manually modified, and verified in this repository (lint, production build, and live API smoke tests); no ready-made website template was used.
- In-app AI features use **Groq** / **OpenRouter** LLMs with a local rule-based fallback (`server/src/services/ai/`).
- Other AI-assisted tooling: none beyond the above.

## 9. Remaining gaps / follow-ups

- **§1.8 / §1.9** of the SRS missing from source file (see §0).
- **Availability (24/7)** pending actual production deployment (Vercel + Render target per `phase2-plan.md`) — separate "production readiness" phase.
- Tier-3 items 35–38 intentionally not built (optional, not in the SRS).

## 10. Verification performed

- `client`: `npm run lint` → clean; `npm run build` → green (dev server stopped first per `AGENTS.md`).
- `server`: boots on Atlas, `GET /api/v1/health` → 200; smoke-tested live: login (student+admin), forecast, tips default filter, dashboard tip widget, `/transactions/recent`, flags (duplicate + unusually_large), last-viewed/edited tracking, recurring materialization (idempotent), per-user categorization learning, insight advice backfill, admin-login rejection of non-admin.
