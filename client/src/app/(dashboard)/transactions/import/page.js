"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Sparkles, CheckCircle2, Download } from "lucide-react";
import Papa from "papaparse";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/ui";
import { formatMoney } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ImportPage() {
  const addToast = useUIStore((s) => s.addToast);
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [aiRows, setAiRows] = useState([]);
  const [categorizing, setCategorizing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    api
      .get("/categories")
      .then((r) => setCategories(r.data.categories))
      .catch(() => {});
  }, []);

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data
          .map((r) => ({
            note: r.note || r.description || r.memo || r.Narrative || "",
            amount: Math.abs(Number(r.amount || r.Amount || r.value) || 0),
            type: String(r.amount || r.Amount || 0).startsWith("-") || !r.type ? "expense" : r.type,
            date: r.date || r.Date || r.transaction_date || new Date().toISOString().slice(0, 10),
          }))
          .filter((r) => r.note || r.amount > 0)
          .slice(0, 100);
        setRows(parsed);
        setAiRows([]);
        addToast({ type: "success", message: `Parsed ${parsed.length} rows` });
      },
      error: () => addToast({ type: "error", message: "CSV parse failed" }),
    });
  }

  async function autoCategorize() {
    setCategorizing(true);
    try {
      const res = await api.post("/ai/categorize-batch", {
        rows: rows.map((r) => ({ note: r.note, type: r.type, amount: r.amount, date: r.date })),
      });
      const byName = Object.fromEntries(categories.map((c) => [c.name.toLowerCase(), c._id]));
      const enriched = res.data.rows.map((r) => ({
        ...r,
        categoryId: byName[String(r.name || "").toLowerCase()] || "",
        categoryName: r.name,
      }));
      setAiRows(enriched);
      addToast({ type: "success", message: "AI categorization complete" });
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setCategorizing(false);
    }
  }

  async function runImport() {
    const payload = aiRows
      .filter((r) => r.categoryId)
      .map((r) => ({
        type: r.type || "expense",
        amount: r.amount,
        categoryId: r.categoryId,
        note: r.note,
        date: r.date,
        aiSuggested: true,
      }));
    if (!payload.length) {
      addToast({ type: "error", message: "No rows with categories selected" });
      return;
    }
    setImporting(true);
    try {
      const res = await api.post("/transactions/import", { rows: payload });
      setDone(res.data.imported);
      addToast({ type: "success", message: res.message });
      setRows([]);
      setAiRows([]);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      addToast({ type: "error", message: e.message });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CSV import"
        subtitle="Bulk import history with AI batch categorization"
        breadcrumbs={[{ label: "CSV Import" }]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <CardHeader
            title="1. Upload CSV"
            subtitle="Columns: note/description, amount, date, optional type"
            action={
              <a
                href="data:text/csv;charset=utf-8,note,amount,date,type%0ACampus%20cafe,-120,2026-09-01,expense%0AMetro%20card,-200,2026-09-02,expense%0APart-time%20pay,5000,2026-09-03,income"
                download="campus-coin-sample.csv"
                className="inline-flex items-center gap-1 text-xs text-honey-600 hover:underline"
              >
                <Download className="h-3.5 w-3.5" /> Sample CSV
              </a>
            }
          />
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 px-6 py-12 text-center transition hover:border-honey-500 hover:bg-honey-500/5 dark:border-zinc-700">
            <Upload className="mb-3 h-8 w-8 text-honey-500" />
            <span className="text-sm font-semibold">Drop CSV or click to browse</span>
            <span className="mt-1 text-xs text-zinc-400">Max 100 rows in demo</span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onFile}
            />
          </label>
        </Card>

        <Card className="p-5">
          <CardHeader title="2. AI categorize" subtitle="Groq → OpenRouter → rules" />
          <Button
            onClick={autoCategorize}
            isLoading={categorizing}
            disabled={!rows.length}
            className="w-full"
          >
            <Sparkles className="h-4 w-4" /> Auto-categorize
          </Button>
          <div className="mt-4">
            <CardHeader title="3. Import" />
            <Button
              onClick={runImport}
              isLoading={importing}
              disabled={!aiRows.length}
              variant="success"
              className="w-full"
            >
              <CheckCircle2 className="h-4 w-4" /> Import {aiRows.filter((r) => r.categoryId).length} rows
            </Button>
          </div>
          {done > 0 && (
            <p className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-center text-xs text-emerald-600">
              Imported {done} transactions
            </p>
          )}
        </Card>
      </div>

      {rows.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-honey-500" />
              <h3 className="text-sm font-semibold">
                Preview ({aiRows.length ? aiRows.length : rows.length} rows)
              </h3>
            </div>
            {aiRows.length > 0 && (
              <span className="rounded bg-honey-500/15 px-2 py-1 text-[10px] font-bold text-honey-700">
                AI READY
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-400 dark:bg-zinc-900/50">
                <tr>
                  <th className="px-4 py-2">Note</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">AI category</th>
                  <th className="px-4 py-2">Override</th>
                </tr>
              </thead>
              <tbody>
                {(aiRows.length ? aiRows : rows).map((r, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-t border-zinc-100 dark:border-zinc-800/60"
                  >
                    <td className="max-w-[200px] truncate px-4 py-2.5">{r.note}</td>
                    <td className="money px-4 py-2.5">{formatMoney(r.amount)}</td>
                    <td className="px-4 py-2.5 text-xs text-zinc-400">{String(r.date).slice(0, 10)}</td>
                    <td className="px-4 py-2.5">
                      {aiRows.length ? (
                        <span className="rounded bg-honey-500/15 px-2 py-0.5 text-xs font-medium text-honey-700">
                          {r.categoryName || r.name}
                          {r.confidence ? ` · ${Math.round(r.confidence * 100)}%` : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {aiRows.length > 0 && (
                        <Select
                          className="min-w-[140px] py-1.5 text-xs"
                          value={r.categoryId || ""}
                          onChange={(e) => {
                            const next = [...aiRows];
                            next[i] = {
                              ...next[i],
                              categoryId: e.target.value,
                              categoryName:
                                categories.find((c) => c._id === e.target.value)?.name || "",
                            };
                            setAiRows(next);
                          }}
                        >
                          <option value="">Select...</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </Select>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {rows.length === 0 && (
        <EmptyState
          icon={Upload}
          title="No file loaded"
          description="Upload a bank/export CSV to bulk-add history."
        />
      )}
    </div>
  );
}
