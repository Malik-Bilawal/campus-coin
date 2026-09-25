#!/usr/bin/env python3
"""
Campus Coin end-to-end test suite (browser + API).

Prereqs:
  - client dev server on http://localhost:3000   (cd client && npm run dev)
  - server on http://localhost:5000              (cd server && npm run dev)
      health check: GET http://localhost:5000/api/v1/health -> 200
  - python + playwright:  pip install playwright requests && playwright install chromium

Run:
  python e2e/run_e2e.py                  # headless, full suite
  python e2e/run_e2e.py --headed         # watch the browser
  python e2e/run_e2e.py --only public,login   # run selected phases

Phases:
  public       landing sitemap, auth guard redirect, wrong-password rejection
  login        demo student login + dashboard overview (greeting, stat cards, tips)
  addincome    Add income -> prefilled new-transaction page, AI suggestion
               ignore/accept cycle, save + toast + redirect
  transactions search filter, edit flow, recently-viewed card, delete dialog
  budgets      create budget (Miscellaneous, unused by seed), progress card, delete
  categories   create "E2E Temp Cat", delete via confirm dialog
  reports      charts render, custom date-range filter, share-modal email
               validation, PDF export download
  insights     narrative + "Next step" advice, regenerate, bookmark toggle
  tips         refresh (generate), pin/unpin + filters, summary PDF download
  import       CSV upload -> parse -> auto-categorize -> import
  profile      savings goal save/persist/restore
  bookmarks    insight bookmark listed + removed
  prefs        dark-mode toggle + font-size control (both restored)
  chat         BudgetBee open, disclaimer visible, send + assistant reply
  admin        logout, admin-login (bad + good), stats, user search,
               announcement CRUD, default categories page
  register     full 3-step UI registration (wrong OTP first), logout, guard
  api          health, 401 without token, forecast/recent shapes,
               cross-user isolation (404)
  cleanup      delete test transactions, delete registered test user

Notes:
  - Auth endpoints are rate limited (30 req / 15 min). A full run uses ~10
    auth calls; avoid running 3+ times inside 15 minutes.
  - Tips refresh regenerates demo tips (statuses reset to active) — intentional,
    reseed with `npm run seed:reset` if you want pristine demo data back.
  - On step failure a full-page screenshot lands in e2e/artifacts/.
  - Exit code 0 = every step passed.
"""

from __future__ import annotations

import argparse
import contextlib
import os
import re
import sys

# Windows console defaults to cp1252 and chokes on ৳ (BDT) in failure text.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
import tempfile
import time
from datetime import date

import requests

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("playwright is not installed -> pip install playwright && playwright install chromium")
    sys.exit(2)

BASE = "http://localhost:3000"
API = "http://localhost:5000/api/v1"
HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.join(HERE, "artifacts")

DEMO_EMAIL = "demo@campuscoin.app"
DEMO_PW = "Demo@123"
ADMIN_EMAIL = "admin@campuscoin.app"
ADMIN_PW = "Admin@123"

RESULTS: list[dict] = []
PAGE_ERRORS: list[str] = []


def short(e: BaseException, limit: int = 220) -> str:
    msg = f"{type(e).__name__}: {e}"
    msg = " ".join(msg.split())
    return msg[:limit] + ("..." if len(msg) > limit else "")


def rec(phase: str, name: str, ok: bool, secs: float, err: str = "") -> None:
    RESULTS.append({"phase": phase, "name": name, "ok": ok, "secs": secs, "err": err})
    mark = "PASS" if ok else "FAIL"
    tail = f"  ({secs:.1f}s)" if ok and secs >= 1 else ""
    if err:
        tail = f"  -> {err}"
    print(f"  [{mark}] {name}{tail}", flush=True)


class Ctx:
    def __init__(self, page, state: dict):
        self.page = page
        self.state = state
        self.phase = "?"

    @contextlib.contextmanager
    def step(self, name: str):
        t0 = time.time()
        try:
            yield
        except Exception as e:  # noqa: BLE001 - record + abort phase
            self.shot(name)
            rec(self.phase, name, False, time.time() - t0, short(e))
            raise
        else:
            rec(self.phase, name, True, time.time() - t0)

    def shot(self, name: str) -> None:
        try:
            os.makedirs(ART, exist_ok=True)
            safe = re.sub(r"[^A-Za-z0-9_-]+", "_", f"{self.phase}_{name}")[:80]
            self.page.screenshot(path=os.path.join(ART, f"{safe}.png"), full_page=True)
        except Exception:
            pass


# ---------------------------------------------------------------- helpers ---


def wait_visible(locator, timeout: int = 15000):
    locator.first.wait_for(state="visible", timeout=timeout)
    return locator.first


def hydrate(page, timeout: int = 20000):
    """Wait until React hydration finished (Providers adds html.font-* in useEffect)."""
    page.wait_for_function(
        "() => /font-(sm|md|lg)/.test(document.documentElement.className)",
        timeout=timeout,
    )


def goto(page, path: str):
    page.goto(BASE + path, wait_until='domcontentloaded')
    hydrate(page)


def wait_gone(locator, timeout: int = 15000):
    locator.first.wait_for(state="hidden", timeout=timeout)


def toast(page, text, timeout: int = 12000):
    """Wait for a toast (or any text) containing `text`."""
    return wait_visible(page.get_by_text(text, exact=False), timeout=timeout)


def toast_re(page, pattern, timeout: int = 12000):
    return wait_visible(page.get_by_text(re.compile(pattern)), timeout=timeout)


def poll(desc: str, fn, cond, timeout_ms: int = 15000, interval_ms: int = 250):
    end = time.time() + timeout_ms / 1000
    last = None
    while time.time() < end:
        try:
            last = fn()
            if cond(last):
                return last
        except Exception:  # noqa: BLE001
            pass
        time.sleep(interval_ms / 1000)
    raise AssertionError(f"timeout waiting for {desc} (last={last!r})")


def fill_otp(page, code: str) -> None:
    """OTP boxes are maxLength=1 inputs; fill one digit at a time."""
    for i, ch in enumerate(code):
        page.get_by_label(f"OTP digit {i + 1}").fill(ch)


def modal(page):
    """The currently-open Modal wrapper (div.fixed.inset-0)."""
    return page.locator("div.fixed.inset-0").last


def confirm_btn(page, label: str):
    return modal(page).get_by_role("button", name=label, exact=True)


def api(method: str, path: str, token: str | None = None, **kw):
    headers = kw.pop("headers", {})
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return requests.request(method, API + path, headers=headers, timeout=30, **kw)


# ----------------------------------------------------------------- phases ---


def ph_public(c: Ctx):
    p, c.phase = c.page, "public"

    with c.step("landing renders + sitemap section"):
        goto(p, "/")
        wait_visible(p.get_by_text("Campus Coin", exact=False))
        wait_visible(p.locator("#sitemap"))
        p.locator("#sitemap").scroll_into_view_if_needed()
        assert p.locator("#sitemap").is_visible()

    with c.step("Sign in link navigates to /login"):
        p.get_by_role("link", name="Sign in").first.click()
        p.wait_for_url("**/login**", timeout=15000)
        wait_visible(p.get_by_label("Email"))

    with c.step("unauthenticated /dashboard redirects to /login"):
        goto(p, "/dashboard")
        p.wait_for_url("**/login**", timeout=15000)
        hydrate(p)

    with c.step("wrong password shows auth error"):
        p.get_by_label("Email").fill(DEMO_EMAIL)
        p.get_by_label("Password", exact=True).fill("WrongPass999")
        p.get_by_role("button", name=re.compile("^Sign in")).click()
        wait_visible(p.get_by_text("Invalid email or password"))


def ph_login(c: Ctx):
    p = c.page
    c.phase = "login"

    with c.step("demo student login reaches /dashboard"):
        goto(p, "/login")
        wait_visible(p.get_by_label("Email"))
        p.get_by_label("Email").fill(DEMO_EMAIL)
        p.get_by_label("Password", exact=True).fill(DEMO_PW)
        p.get_by_role("button", name=re.compile("^Sign in")).click()
        p.wait_for_url("**/dashboard", timeout=20000)

    with c.step("access token stored in sessionStorage"):
        token = p.evaluate("() => sessionStorage.getItem('accessToken')")
        assert token, "accessToken missing from sessionStorage"
        c.state["demo_token"] = token

    with c.step("dashboard overview renders"):
        wait_visible(p.locator(".stat-label"), timeout=30000)
        wait_visible(p.get_by_text(re.compile(r"(Hi|Good [A-Za-z]+), Demo\b")), timeout=30000)
        labels = [t.strip().lower() for t in p.locator(".stat-label").all_inner_texts()]
        for want in ("net balance", "income", "expenses", "top category"):
            assert want in labels, f"missing stat card {want!r} in {labels}"
        wait_visible(p.get_by_text("Tips for you"))
        wait_visible(p.get_by_text("Recent transactions"))
        wait_visible(p.get_by_role("button", name="Add income"))


def ph_addincome(c: Ctx):
    p = c.page
    c.phase = "addincome"

    with c.step("Add income opens prefilled new-transaction page"):
        p.get_by_role("button", name="Add income").click()
        p.wait_for_url("**/transactions/new*type=income*", timeout=15000)
        wait_visible(p.get_by_text("New transaction"))

    with c.step("income category preselected"):
        sel = p.get_by_label("Category")
        wait_visible(sel)
        val = poll("income category selected", lambda: sel.input_value(), lambda v: bool(v))
        label = sel.locator(f'option[value="{val}"]').inner_text().strip()
        income_names = {"Allowance", "Part-time Job", "Scholarship", "Gift", "Other Income"}
        assert label in income_names or label, f"unexpected category {label!r}"

    with c.step("AI suggestion appears for note"):
        p.get_by_label("Amount").fill("777")
        p.get_by_label("Note (optional)").fill("e2e scholarship grant")
        chip = p.get_by_text(re.compile(r"^(AI suggested:|Rules suggest:)"))
        wait_visible(chip, timeout=25000)

    with c.step("Ignore hides suggestion, retype restores it"):
        p.get_by_role("button", name="Ignore").click()
        wait_gone(chip, timeout=10000)
        p.get_by_label("Note (optional)").fill("e2e scholarship grant x")
        wait_visible(chip, timeout=25000)

    with c.step("Accept marks suggestion accepted"):
        p.get_by_role("button", name=re.compile("^(Accept|Apply)$")).click()
        wait_visible(p.get_by_role("button", name=re.compile("^Accepted")))

    with c.step("save redirects to list with success toast"):
        p.get_by_role("button", name="Save transaction").click()
        toast(p, "Transaction added")
        p.wait_for_url("**/transactions", timeout=15000)


def ph_transactions(c: Ctx):
    p = c.page
    c.phase = "transactions"
    note = "e2e scholarship grant"

    with c.step("created transaction listed with amount"):
        goto(p, "/transactions")
        row = p.locator("div.glass-card.group", has_text=note).first
        wait_visible(row)
        assert "777" in row.inner_text(), "row does not show 777"

    with c.step("search filter narrows + clears"):
        search = p.get_by_placeholder("Search notes...")
        search.fill("e2e scholarship")
        wait_visible(p.locator("div.glass-card.group", has_text=note))
        search.fill("zzzqqq-nothing")
        wait_visible(p.get_by_text("No transactions found"))
        search.fill("")
        wait_visible(p.locator("div.glass-card.group", has_text=note))

    with c.step("edit transaction updates amount"):
        row = p.locator("div.glass-card.group", has_text=note).first
        row.locator("a[href*='/edit']").click()
        p.wait_for_url(re.compile(r"/transactions/.+/edit"), timeout=15000)
        wait_visible(p.get_by_text("Edit transaction"))
        p.get_by_label("Amount").fill("888")
        p.get_by_role("button", name="Update transaction").click()
        toast(p, "Transaction updated")
        p.wait_for_url("**/transactions", timeout=15000)
        row = p.locator("div.glass-card.group", has_text=note).first
        wait_visible(row)
        poll("row shows 888", lambda: row.inner_text(), lambda t: "888" in t,
             timeout_ms=8000)

    with c.step("recently-viewed card shows entry with edited badge"):
        heading = wait_visible(p.get_by_text("Recently viewed / edited", exact=True))
        card = heading.locator("xpath=ancestor::div[contains(@class,'glass-card')][1]")
        chip = card.locator("a[href*='/edit']", has_text=note)
        wait_visible(chip)
        assert "edited" in chip.inner_text().lower(), "chip missing 'edited' badge"

    with c.step("delete via confirm dialog"):
        row = p.locator("div.glass-card.group", has_text=note).first
        wait_visible(row)
        row.locator("button").first.click(force=True)
        wait_visible(p.get_by_text("Delete transaction?"))
        confirm_btn(p, "Delete").click()
        toast(p, "Transaction deleted")
        assert p.locator("div.glass-card.group", has_text=note).count() == 0


def ph_budgets(c: Ctx):
    p = c.page
    c.phase = "budgets"

    with c.step("create budget on unused category"):
        goto(p, "/budgets")
        wait_visible(p.get_by_role("button", name="New budget"))
        p.get_by_role("button", name="New budget").click()
        wait_visible(p.get_by_text("Monthly limit", exact=False))
        p.get_by_label("Expense category").select_option(label="Miscellaneous")
        p.get_by_label(re.compile("Monthly limit")).fill("500")
        p.get_by_role("button", name="Save budget").click()
        toast(p, "Budget saved")
        time.sleep(1.5)  # confetti overlay

    with c.step("budget card shows limit"):
        card = p.locator("div.glass-card-hover", has_text="Miscellaneous").first
        wait_visible(card)
        assert "500" in card.inner_text(), "budget card does not show limit"

    with c.step("delete budget via confirm dialog"):
        card = p.locator("div.glass-card-hover", has_text="Miscellaneous").first
        card.hover()
        card.locator("button").first.click(force=True)
        wait_visible(p.get_by_text("Remove budget?"))
        confirm_btn(p, "Remove").click()
        toast(p, "Budget removed")
        assert p.locator("div.glass-card-hover", has_text="Miscellaneous").count() == 0


def ph_categories(c: Ctx):
    p = c.page
    c.phase = "categories"

    with c.step("create user category"):
        goto(p, "/categories")
        unique_name = f"E2E Temp Cat {int(time.time())}"
        p.get_by_role("button", name="New category").click()
        wait_visible(p.get_by_text("New category", exact=False))
        p.get_by_label("Name").fill(unique_name)
        p.get_by_role("button", name="Create", exact=True).click()
        toast(p, "Category created")
        wait_visible(p.get_by_text(unique_name))

    with c.step("search + source filter narrow the list"):
        s = p.get_by_placeholder("Search categories...")
        s.fill("E2E Temp")
        wait_visible(p.locator("div.group", has_text="E2E Temp Cat"))
        # AnimatePresence keeps exiting cards mounted briefly -> poll instead of instant count
        poll("search filters out defaults", lambda: p.locator("div.group", has_text="default").count(), lambda n: n == 0)
        s.fill("")
        p.get_by_role("button", name="Default", exact=True).click()
        wait_gone(p.locator("div.group", has_text="E2E Temp Cat"))
        assert p.locator("div.group", has_text="default").count() >= 1, "Default filter shows no defaults"
        p.get_by_role("button", name="All", exact=True).click()
        wait_visible(p.locator("div.group", has_text="E2E Temp Cat"))

    with c.step("delete user category via confirm dialog"):
        card = p.locator("div.group", has_text="E2E Temp Cat").first
        wait_visible(card)
        buttons = card.locator("button")
        poll("category card buttons", lambda: buttons.count(), lambda n: n >= 2)
        wait_gone(p.get_by_text("Category created", exact=False), timeout=6000)
        card.hover()
        buttons.nth(1).click()
        wait_visible(p.get_by_text("Delete category?"))
        confirm_btn(p, "Delete").click()
        toast(p, "Category deleted")
        assert p.locator("div.group", has_text="E2E Temp Cat").count() == 0


def ph_reports(c: Ctx):
    p = c.page
    c.phase = "reports"

    with c.step("charts render (recharts svgs present)"):
        goto(p, "/reports")
        wait_visible(p.get_by_text("Monthly reports"))
        poll(
            "recharts svg",
            lambda: p.locator("svg.recharts-surface").count(),
            lambda n: n >= 1,
            timeout_ms=20000,
        )
        wait_visible(p.get_by_text(re.compile(r"^Projected")))
        wait_visible(p.get_by_text("Spending by category"))

    with c.step("custom date-range filter returns results"):
        today = date.today()
        p.get_by_label("From").fill(today.replace(day=1).isoformat())
        p.get_by_label("To").fill(today.isoformat())
        p.get_by_role("button", name=re.compile("^Apply$")).click()
        wait_visible(p.get_by_text("Transactions", exact=True), timeout=20000)

    with c.step("share modal validates email then accepts"):
        p.get_by_role("button", name="Share by email").click()
        wait_visible(p.get_by_text("Share report by email"))
        p.get_by_label("Recipient email").fill("not-an-email")
        p.get_by_role("button", name="Send", exact=True).click()
        toast(p, "Enter a valid email")
        p.get_by_label("Recipient email").fill("friend@university.edu")
        p.get_by_role("button", name="Send", exact=True).click()
        toast(p, "Report share queued for friend@university.edu")
        wait_gone(p.get_by_text("Share report by email"))

    with c.step("PDF export downloads"):
        with p.expect_download(timeout=90000) as dl:
            p.get_by_role("button", name="Export PDF").click()
        name = dl.value.suggested_filename
        assert name.startswith("campus-coin-report-") and name.endswith(".pdf"), name
        toast(p, "PDF exported")


def ph_insights(c: Ctx):
    p = c.page
    c.phase = "insights"

    with c.step("narrative + Next step advice rendered"):
        goto(p, "/insights")
        wait_visible(p.get_by_text("AI monthly insights"))
        wait_visible(p.get_by_text("Next step"), timeout=30000)

    with c.step("regenerate produces insight"):
        p.get_by_role("button", name="Regenerate").click()
        toast(p, "Insight regenerated", timeout=90000)
        wait_visible(p.get_by_text("Next step"), timeout=30000)

    with c.step("bookmark toggle"):
        p.get_by_title("Bookmark this insight").click()
        toast(p, "Insight bookmarked")
        wait_visible(p.get_by_title("Remove bookmark"))


def ph_tips(c: Ctx):
    p = c.page
    c.phase = "tips"

    with c.step("refresh generates tips"):
        goto(p, "/tips")
        wait_visible(p.get_by_text("Saving tips"))
        p.get_by_role("button", name="Refresh tips").click()
        toast_re(p, r"Generated \d+ tips", timeout=90000)
        has_cards = p.locator("text=impact ").count() > 0
        has_empty = p.get_by_text("No tips yet").count() > 0
        assert has_cards or has_empty, "neither tip cards nor empty state shown"

    with c.step("pin/unpin + pinned filter"):
        if p.get_by_role("button", name="Pin", exact=True).count() == 0:
            raise AssertionError("no active tip available to pin")
        p.get_by_role("button", name="Pin", exact=True).first.click()
        # pinned tips leave the default "active" filter -> switch to see Unpin
        p.get_by_role("button", name="pinned", exact=True).click()
        wait_visible(p.get_by_role("button", name="Unpin", exact=True))
        wait_visible(p.locator("text=impact ").first)
        p.get_by_role("button", name="Unpin", exact=True).first.click()
        wait_gone(p.get_by_role("button", name="Unpin", exact=True), timeout=10000)
        p.get_by_role("button", name="active", exact=True).click()
        wait_visible(p.get_by_role("button", name="Pin", exact=True).first)

    with c.step("summary PDF downloads"):
        with p.expect_download(timeout=60000) as dl:
            p.get_by_role("button", name="Export summary PDF").click()
        assert dl.value.suggested_filename.endswith(".pdf"), dl.value.suggested_filename
        toast(p, "Tips summary PDF exported")


def ph_import(c: Ctx):
    p = c.page
    c.phase = "import"

    with c.step("CSV upload parses rows"):
        today = date.today().isoformat()
        csv = (
            "date,note,amount\n"
            f"{today},e2e import alpha,-35\n"
            f"{today},e2e import beta,-40\n"
        )
        fd, path = tempfile.mkstemp(suffix=".csv", prefix="e2e_")
        with os.fdopen(fd, "w") as f:
            f.write(csv)
        c.state["csv_path"] = path
        goto(p, "/transactions/import")
        wait_visible(p.get_by_text("Drop CSV or click to browse"))
        p.locator('input[type="file"]').set_input_files(path)
        toast(p, "Parsed 2 rows")

    with c.step("auto-categorize assigns categories"):
        p.get_by_role("button", name="Auto-categorize").click()
        toast(p, "AI categorization complete", timeout=60000)
        btn = p.get_by_role("button", name=re.compile(r"^Import \d+ rows$"))
        wait_visible(btn, timeout=15000)
        n = int(re.search(r"Import (\d+) rows", btn.inner_text()).group(1))
        assert n >= 1, "no rows categorized"
        c.state["imported_rows"] = n

    with c.step("import creates transactions"):
        btn.click()
        wait_visible(p.get_by_text(re.compile(r"Imported \d+ transactions")), timeout=30000)


def ph_profile(c: Ctx):
    p = c.page
    c.phase = "profile"

    with c.step("savings goal saves and persists"):
        goto(p, "/profile")
        goal = p.get_by_label("Savings goal")
        wait_visible(goal)
        original = poll("original goal", lambda: goal.input_value(), lambda v: v is not None)
        c.state["original_goal"] = original
        goal.fill("4321")
        # guard: a late auth init can re-run useEffect([user]) and wipe the
        # field between fill and submit — make sure the value sticks first
        poll("goal fill sticks", lambda: goal.input_value(), lambda v: v == "4321")
        p.get_by_role("button", name="Save profile").click()
        toast(p, "Profile updated")
        p.reload(); hydrate(p)
        goal = p.get_by_label("Savings goal")
        wait_visible(goal)
        poll("saved goal", lambda: goal.input_value(), lambda v: v == "4321")

    with c.step("restore original savings goal"):
        p.get_by_label("Savings goal").fill(c.state["original_goal"])
        p.get_by_role("button", name="Save profile").click()
        toast(p, "Profile updated")
        p.reload(); hydrate(p)
        goal = p.get_by_label("Savings goal")
        wait_visible(goal)
        poll("restored goal", lambda: goal.input_value(),
             lambda v: v == c.state["original_goal"])


def ph_bookmarks(c: Ctx):
    p = c.page
    c.phase = "bookmarks"

    with c.step("bookmarks page lists saved insight"):
        goto(p, "/bookmarks")
        badge = p.locator("span", has_text=re.compile(r"^Insight$")).first
        wait_visible(badge, timeout=15000)

    with c.step("remove bookmark"):
        card = badge.locator(
            "xpath=ancestor::div[contains(@class,'glass-card')][1]"
        )
        card.locator("button").first.click(force=True)
        toast(p, "Bookmark removed")
        assert p.locator("span", has_text=re.compile(r"^Insight$")).count() == 0


def ph_prefs(c: Ctx):
    p = c.page
    c.phase = "prefs"
    goto(p, "/dashboard")
    wait_visible(p.get_by_text("Recent transactions"))
    initial_cls = p.evaluate("() => document.documentElement.className")

    with c.step("dark mode toggles and restores"):
        p.get_by_title("Toggle theme").click()
        poll("dark class flip",
             lambda: "dark" in p.evaluate("() => document.documentElement.className"),
             lambda d: d != ("dark" in initial_cls))
        p.get_by_title("Toggle theme").click()
        poll("dark class restore",
             lambda: "dark" in p.evaluate("() => document.documentElement.className"),
             lambda d: d == ("dark" in initial_cls))

    with c.step("font size control works and restores"):
        initial_font = ("font-sm" if "font-sm" in initial_cls else
                        "font-lg" if "font-lg" in initial_cls else "font-md")
        p.get_by_title("Font size").click()
        p.get_by_role("button", name="Large", exact=True).click()
        poll("font-lg applied",
             lambda: "font-lg" in p.evaluate("() => document.documentElement.className"),
             lambda ok: ok)
        p.get_by_title("Font size").click()
        label = {"font-sm": "Small", "font-md": "Medium", "font-lg": "Large"}[initial_font]
        p.get_by_role("button", name=label, exact=True).click()
        poll("font restored",
             lambda: initial_font in p.evaluate("() => document.documentElement.className"),
             lambda ok: ok)


def ph_chat(c: Ctx):
    p = c.page
    c.phase = "chat"

    with c.step("chat opens with disclaimer"):
        p.locator('[aria-label="Open chat"]').click()
        wait_visible(p.get_by_text("automated assistant for learning purposes"))

    with c.step("assistant replies to message"):
        panel = p.locator("div.fixed.bottom-24")
        wait_visible(panel)
        bubbles = panel.locator("div.justify-start, div.justify-end")
        before = bubbles.count()
        panel.get_by_placeholder(re.compile("Should I buy")).fill(
            "How much can I spend today?"
        )
        panel.locator('[aria-label="Send"]').click()
        poll("assistant reply", lambda: bubbles.count(),
             lambda n: n >= before + 2, timeout_ms=90000)

    with c.step("chat closes"):
        p.locator('[aria-label="Open chat"]').click()
        wait_gone(p.locator("div.fixed.bottom-24"))


def ph_admin(c: Ctx):
    p = c.page
    c.phase = "admin"

    with c.step("logout returns to /login"):
        p.locator("header").get_by_role("button").last.click()
        p.locator("div.top-full").get_by_role("button", name="Logout").click()
        p.wait_for_url("**/login", timeout=15000)

    with c.step("Admin sign in link routes to /admin-login"):
        p.get_by_role("link", name="Admin sign in").click()
        p.wait_for_url("**/admin-login", timeout=15000)
        wait_visible(p.get_by_label("Admin email"))

    with c.step("student credentials rejected on admin login"):
        p.get_by_label("Admin email").fill(DEMO_EMAIL)
        p.get_by_label("Password", exact=True).fill(DEMO_PW)
        p.get_by_role("button", name=re.compile("^Sign in|^Log in|^Admin")).click()
        wait_visible(p.get_by_text("Invalid email or password"))

    with c.step("admin login reaches /admin panel"):
        p.get_by_label("Admin email").fill(ADMIN_EMAIL)
        p.get_by_label("Password", exact=True).fill(ADMIN_PW)
        p.get_by_role("button", name=re.compile("^Sign in|^Log in|^Admin")).click()
        p.wait_for_url("**/admin", timeout=20000)
        wait_visible(p.get_by_text("Admin panel"))
        wait_visible(p.get_by_text("Total users"))
        token = p.evaluate("() => sessionStorage.getItem('accessToken')")
        assert token, "admin token missing"
        c.state["admin_token"] = token

    with c.step("user search finds demo account"):
        goto(p, "/admin/users")
        p.get_by_placeholder("Search by name or email...").fill(DEMO_EMAIL)
        wait_visible(p.get_by_text(DEMO_EMAIL), timeout=15000)

    with c.step("announcement create + delete"):
        title = f"E2E temp announcement {int(time.time())}"
        goto(p, "/admin/announcements")
        wait_visible(p.get_by_text("Announcements"))
        new_btn = p.get_by_role("button", name="New announcement")
        try:
            new_btn.click(timeout=10000)
        except Exception as e:  # noqa: BLE001 - capture page state for diagnosis
            main = (p.locator("main").inner_text()[:300].replace("\n", " | ")
                    if p.locator("main").count() else "NO <main>")
            raise AssertionError(
                f"New announcement click failed: {short(e)} | url={p.url} | main={main}"
            ) from e
        wait_visible(p.get_by_text("New announcement", exact=False))
        p.get_by_label("Title").fill(title)
        p.get_by_label("Body").fill("Created by the E2E suite.")
        p.get_by_role("button", name="Save", exact=True).click()
        toast(p, "Announcement created")
        card = p.locator("div.glass-card.group", has_text=title).first
        wait_visible(card)
        buttons = card.locator("button")
        poll("announcement card buttons", lambda: buttons.count(), lambda n: n >= 3,
             timeout_ms=8000)
        wait_gone(p.get_by_text("Announcement created", exact=False), timeout=6000)
        card.hover()
        buttons.nth(2).click()
        wait_visible(p.get_by_text("Delete announcement?"))
        confirm_btn(p, "Delete").click()
        toast(p, "Deleted")
        poll("announcement removed",
             lambda: p.locator("div.glass-card.group", has_text=title).count(),
             lambda n: n == 0)

    with c.step("default categories page loads"):
        goto(p, "/admin/categories")
        wait_visible(p.get_by_text("Default categories"))


def ph_register(c: Ctx):
    p = c.page
    c.phase = "register"
    ts = int(time.time())
    email = f"e2e-{ts}@campuscoin.app"
    c.state["e2e_email"] = email

    with c.step("logout admin before registering"):
        p.locator("header").get_by_role("button").last.click()
        p.locator("div.top-full").get_by_role("button", name="Logout").click()
        p.wait_for_url("**/login", timeout=15000)

    with c.step("step 1 submits identity"):
        goto(p, "/register")
        wait_visible(p.get_by_text("Step 1 of 3"))
        p.get_by_label("Full name").fill("E2E Tester")
        p.get_by_label("Email").fill(email)
        p.get_by_label("Password", exact=True).fill("E2ePass!123")
        p.get_by_label("Confirm password").fill("E2ePass!123")
        p.get_by_role("button", name="Send verification code").click()
        wait_visible(p.get_by_label("OTP digit 1"), timeout=30000)
        code_el = wait_visible(p.get_by_text(re.compile(r"Dev code:\s*\d{6}")), timeout=15000)
        code = re.search(r"\d{6}", code_el.inner_text()).group(0)
        c.state["otp"] = code

    with c.step("OTP boxes auto-advance while typing"):
        p.get_by_label("OTP digit 1").click()
        p.keyboard.type("246801", delay=40)
        vals = [p.get_by_label(f"OTP digit {i + 1}").input_value() for i in range(6)]
        assert vals == list("246801"), f"typed digits did not flow across boxes: {vals}"
        p.get_by_label("OTP digit 1").click()
        p.keyboard.press("Backspace")  # clears whole string (box 1 is filled)
        cleared = [p.get_by_label(f"OTP digit {i + 1}").input_value() for i in range(6)]
        assert cleared == [""] * 6, f"boxes not cleared before OTP verify: {cleared}"

    with c.step("wrong OTP rejected with attempt warning"):
        wrong = str((int(code[0]) + 5) % 10) + code[1:]
        fill_otp(p, wrong)
        p.get_by_role("button", name="Verify email").click()
        wait_visible(p.get_by_text(re.compile("Invalid verification code")))

    with c.step("correct OTP advances to money profile"):
        fill_otp(p, code)
        p.get_by_role("button", name="Verify email").click()
        wait_visible(p.get_by_text("Email verified"), timeout=20000)
        wait_visible(p.get_by_label("Academic year"))
        p.get_by_label("Academic year").fill("4th Year")
        p.get_by_label("Monthly allowance").fill("15000")
        p.get_by_label("Savings goal").fill("5000")
        p.get_by_role("button", name="Create account").click()
        p.wait_for_url("**/dashboard", timeout=25000)
        toast(p, "Account created", timeout=15000)
        time.sleep(1.5)  # confetti overlay
        wait_visible(p.get_by_text(re.compile(r"(Hi|Good [A-Za-z]+), E2E\b")))

    with c.step("capture test-user token + id"):
        token = p.evaluate("() => sessionStorage.getItem('accessToken')")
        assert token, "e2e user token missing"
        me = p.evaluate(
            """async () => {
                const r = await fetch('http://localhost:5000/api/v1/auth/me',
                    { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('accessToken') } });
                return r.json();
            }"""
        )
        user = (me.get("data") or {}).get("user") or {}
        uid = user.get("id") or user.get("_id")
        assert uid, f"no user id in /auth/me: {me}"
        c.state["e2e_token"] = token
        c.state["e2e_uid"] = uid

    with c.step("logout then guard blocks /dashboard"):
        p.locator("header").get_by_role("button").last.click()
        p.locator("div.top-full").get_by_role("button", name="Logout").click()
        p.wait_for_url("**/login", timeout=15000)
        goto(p, "/dashboard")
        # guard appends ?next=... so match with a regex, not a bare glob
        p.wait_for_url(re.compile(r"/login(\?|$)"), timeout=15000)


def ph_api(c: Ctx):
    c.phase = "api"
    st = c.state

    with c.step("health endpoint returns 200"):
        r = requests.get(API + "/health", timeout=15)
        assert r.status_code == 200, f"status={r.status_code}"

    with c.step("protected route returns 401 without token"):
        r = api("GET", "/transactions")
        assert r.status_code == 401, f"status={r.status_code}"

    with c.step("forecast returns linear trend points"):
        r = api("GET", "/reports/forecast", token=st.get("demo_token"))
        assert r.status_code == 200, f"status={r.status_code}"
        data = r.json().get("data") or {}
        series = data.get("series") or []
        assert len(series) >= 2, f"series too short: {series}"
        assert all("month" in pt and "total" in pt for pt in series), series
        assert data.get("method") == "linear_trend", f"method={data.get('method')!r}"
        assert isinstance(data.get("projectedExpense"), (int, float)), data
        assert data["projectedExpense"] >= 0, data
        assert re.fullmatch(r"\d{4}-\d{2}", data.get("forecastMonth") or ""), data

    with c.step("recent transactions endpoint works"):
        r = api("GET", "/transactions/recent", token=st.get("demo_token"))
        assert r.status_code == 200, f"status={r.status_code}"
        assert isinstance((r.json().get("data") or {}).get("transactions"), list)

    with c.step("cross-user access to demo transaction -> 404"):
        e2e_tok = st.get("e2e_token")
        if not e2e_tok:
            print("    e2e token missing (register incomplete) - skipping isolation check",
                  flush=True)
            return
        r = api("GET", "/transactions?limit=1", token=st.get("demo_token"))
        assert r.status_code == 200, f"status={r.status_code}"
        txs = (r.json().get("data") or {}).get("transactions") or []
        assert txs, "demo has no transactions"
        demo_tx = txs[0].get("id") or txs[0].get("_id")
        r2 = api("GET", f"/transactions/{demo_tx}", token=e2e_tok)
        assert r2.status_code == 404, f"expected 404 got {r2.status_code}"


def ph_cleanup(c: Ctx):
    c.phase = "cleanup"
    st = c.state

    with c.step("delete test transactions (q=e2e)"):
        tok = st.get("demo_token")
        r = api("GET", "/transactions?q=e2e&limit=50", token=tok)
        assert r.status_code == 200, f"status={r.status_code}"
        txs = (r.json().get("data") or {}).get("transactions") or []
        for tx in txs:
            tid = tx.get("id") or tx.get("_id")
            d = api("DELETE", f"/transactions/{tid}", token=tok)
            assert d.status_code in (200, 204), f"delete {tid}: {d.status_code}"
        print(f"    removed {len(txs)} test transaction(s)", flush=True)

    with c.step("delete registered e2e user"):
        uid = st.get("e2e_uid")
        tok = st.get("admin_token")
        if not uid:
            print("    no registered test user (register phase incomplete) - skipping",
                  flush=True)
        else:
            assert tok, "admin token missing"
            d = api("DELETE", f"/admin/users/{uid}", token=tok)
            assert d.status_code in (200, 204), f"delete user: {d.status_code}"

    csv_path = st.get("csv_path")
    if csv_path and os.path.exists(csv_path):
        os.remove(csv_path)


# ------------------------------------------------------------------ main ----

PHASES = [
    ("public", ph_public),
    ("login", ph_login),
    ("addincome", ph_addincome),
    ("transactions", ph_transactions),
    ("budgets", ph_budgets),
    ("categories", ph_categories),
    ("reports", ph_reports),
    ("insights", ph_insights),
    ("tips", ph_tips),
    ("import", ph_import),
    ("profile", ph_profile),
    ("bookmarks", ph_bookmarks),
    ("prefs", ph_prefs),
    ("chat", ph_chat),
    ("admin", ph_admin),
    ("register", ph_register),
    ("api", ph_api),
    ("cleanup", ph_cleanup),
]


def preflight() -> None:
    try:
        r = requests.get(API + "/health", timeout=10)
        assert r.status_code == 200
    except Exception as e:  # noqa: BLE001
        print(f"server not healthy at {API}/health -> {e}")
        sys.exit(2)
    try:
        requests.get(BASE + "/", timeout=10)
    except Exception as e:  # noqa: BLE001
        print(f"client not reachable at {BASE} -> {e}")
        sys.exit(2)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--headed", action="store_true")
    ap.add_argument("--only", default="", help="comma list of phase names")
    args = ap.parse_args()

    only = {s.strip() for s in args.only.split(",") if s.strip()}
    unknown = only - {n for n, _ in PHASES}
    if unknown:
        print(f"unknown phases: {sorted(unknown)}")
        return 2

    preflight()
    print(f"Campus Coin E2E  ({BASE})  {'headed' if args.headed else 'headless'}")

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=not args.headed)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            accept_downloads=True,
        )
        context.set_default_timeout(15000)
        page = context.new_page()
        page.on("pageerror", lambda e: PAGE_ERRORS.append(str(e)))

        c = Ctx(page, {})
        for name, fn in PHASES:
            if only and name not in only:
                continue
            print(f"\n== {name} ==", flush=True)
            t0 = time.time()
            try:
                fn(c)
            except Exception as e:  # noqa: BLE001 - record phase-level failure
                # step() already recorded the failing step; note the abort
                rec(name, f"(phase aborted after {time.time() - t0:.1f}s)",
                    False, 0, short(e))
            time.sleep(0.3)

        context.close()
        browser.close()

    print("\n" + "=" * 60)
    passed = sum(1 for r in RESULTS if r["ok"])
    failed = sum(1 for r in RESULTS if not r["ok"])
    print(f"RESULT: {passed} passed, {failed} failed, {passed + failed} total")
    if failed:
        print("\nFailures:")
        for r in RESULTS:
            if not r["ok"]:
                print(f"  - [{r['phase']}] {r['name']}: {r['err']}")
        print(f"\nscreenshots: {ART}")
    if PAGE_ERRORS:
        uniq = sorted(set(PAGE_ERRORS))
        print(f"\nJS page errors observed ({len(uniq)} unique):")
        for e in uniq[:10]:
            print(f"  ! {e[:200]}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
