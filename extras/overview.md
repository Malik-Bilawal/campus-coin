TIER 1: CORE FEATURES (Must Implement — Non-Negotiable)
These are directly from the SRS. If you miss these, you lose points. Build these first.

#	Feature	Backend	Frontend	Priority
1	User Registration (name, email, password, academic year, savings goal)	✅ Express + bcrypt + JWT	✅ Form + validation	P0
2	User Login (student + separate admin login)	✅ JWT + role check	✅ Form + error states	P0
3	Secure Session Management	✅ JWT middleware	✅ Protected routes	P0
4	Password Recovery/Reset	✅ Token generation (fake email)	✅ Forgot password page	P0
5	User Profile (editable: name, academic year, allowance baseline, savings goal)	✅ CRUD	✅ Profile page	P0
6	Category Management (default income/expense + custom CRUD)	✅ CRUD + seed defaults	✅ Category page	P0
7	Transaction CRUD (add, edit, delete, list)	✅ CRUD + filters	✅ Quick-add form + list	P0
8	Recurring Transactions (checkbox that copies monthly)	✅ Flag in DB	✅ Toggle in form	P0
9	Dashboard (balance, income vs expense, quick-add, top category, budget vs actual)	✅ Aggregation pipeline	✅ Cards + widgets	P0
10	Monthly Reports (category-wise, 6-month trend, daily/weekly summaries, filters)	✅ Aggregation + date filters	✅ Report page + charts	P0
11	Export Report as PDF/Image	✅ (client-side)	✅ html2canvas / jsPDF	P0
12	Budget Goals (per category, monthly)	✅ CRUD	✅ Budget page + progress bars	P0
13	Budget Alerts (in-app notification when near/exceeds)	✅ Logic on transaction add	✅ Toast/badge	P0
14	Saving Tips Engine (compare current vs historical, rank by impact)	✅ Rule-based logic	✅ Dashboard widget	P0
15	Bookmarking (tips, insights)	✅ CRUD	✅ Bookmark button + page	P0
16	Admin Panel (manage default categories, users, announcements, stats)	✅ Admin-only routes	✅ Admin dashboard	P0
17	Dark Mode + Font-Size Toggle	❌	✅ CSS variables + localStorage	P0
18	Breadcrumbs	❌	✅ Component	P0
19	Sitemap on Homepage	❌	✅ Visual tree	P0
20	Responsive Design	❌	✅ Tailwind breakpoints	P0
Total: 20 core features. This alone is a complete project.

TIER 2: WOW FEATURES (Good to Have — Differentiators)
These make you stand out. Build these after Tier 1 is solid.

#	Feature	Backend	Frontend	Impact
21	AI Expense Categorization (keyword matching: "cafe" → Food)	✅ Simple rules	✅ "AI suggested" badge	🔥 High
22	AI Monthly Insights (rule-based narrative: "Food rose 40%")	✅ Template strings	✅ Insight feed	🔥 High
23	CSV Import (PapaParse, batch categorization)	✅ Bulk insert	✅ Upload + preview	🔥 High
24	Forecast Next Month (simple linear projection)	✅ Math	✅ Chart line	⚡ Medium
25	Duplicate/Large Transaction Detection	✅ Flag logic	✅ Warning badge	⚡ Medium
26	Recently Viewed/Edited Transactions	✅ Session tracking	✅ Sidebar list	⚡ Medium
27	Pin/Dismiss Tips	✅ Update flag	✅ UI toggle	⚡ Medium
28	Insight History (past months' summaries)	✅ Store + list	✅ History page	⚡ Medium
29	PDF Export of Savings Summary	✅ (client-side)	✅ jsPDF	⚡ Medium
30	Share via Email (fake, just show success)	✅ Console log	✅ Button + toast	⚡ Medium
Total: 10 wow features. Pick 6-8 of these.

TIER 3: EXTRA WOW FEATURES (If Time Allows Only)
These are luxury. Only build if Tier 1 + Tier 2 are done and tested.

#	Feature	Impact
31	AI Chatbot (hardcoded FAQ matcher)	🌟 Very High
32	Animated Charts (Chart.js transitions)	🌟 High
33	Confetti on Budget Goal Achieved	🌟 High (delight)
34	Streak Counter ("5 days logging streak!")	🌟 Medium
35	Dark/Light Auto-Switch by Time	🌟 Low
36	PWA (installable app)	🌟 Medium
37	Voice Input for Transactions (Web Speech API)	🌟 High (wow factor)
38	Receipt OCR (Tesseract.js)	🌟 Very High (but risky)
39	Multi-Currency Support	🌟 Low
40	Gamification Badges ("Food Saver", "Budget Master")	🌟 Medium