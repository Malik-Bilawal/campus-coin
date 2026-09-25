import { Router } from "express";
import { z } from "zod";
import { protect } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { aiCategorize, aiCategorizeBatch, ruleCategorize } from "../services/ai/categorize.js";
import { generateInsight, listInsights, buildMonthStats } from "../services/ai/insight.js";
import { aiChat } from "../services/ai/chat.js";
import { aiStatus } from "../services/ai/provider.js";
import { Category } from "../models/Category.js";

const router = Router();
router.use(protect);

router.get("/status", (req, res) => sendSuccess(res, aiStatus()));

const catSchema = z.object({
  note: z.string().max(300),
  type: z.enum(["income", "expense"]).default("expense"),
});

router.post(
  "/categorize",
  validate(catSchema),
  asyncHandler(async (req, res) => {
    const { note, type } = req.body;
    const cats = await Category.find({
      type,
      $or: [{ userId: req.user.id }, { userId: null }],
    }).select("name");
    const names = cats.map((c) => c.name);
    const result = await aiCategorize(note, type, names, req.user.id);
    return sendSuccess(res, { suggestion: result });
  })
);

const batchSchema = z.object({
  rows: z
    .array(
      z.object({
        note: z.string().max(300),
        type: z.enum(["income", "expense"]).optional(),
        amount: z.coerce.number().optional(),
        date: z.string().optional(),
      })
    )
    .min(1)
    .max(100),
});

router.post(
  "/categorize-batch",
  validate(batchSchema),
  asyncHandler(async (req, res) => {
    const { rows } = req.body;
    const cats = await Category.find({
      $or: [{ userId: req.user.id }, { userId: null }],
    }).select("name type");
    const names = cats.map((c) => c.name);

    const enriched = await aiCategorizeBatch(
      rows.map((r) => ({ ...r, availableNames: names, userId: req.user.id }))
    );
    return sendSuccess(res, { rows: enriched });
  })
);

router.post(
  "/insight/:month",
  asyncHandler(async (req, res) => {
    const month = req.params.month;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: "Invalid month" });
    }
    const force = req.query.force === "true";
    const insight = await generateInsight(req.user.id, month, force);
    return sendSuccess(res, { insight });
  })
);

router.get(
  "/insights",
  asyncHandler(async (req, res) => {
    const insights = await listInsights(req.user.id);
    return sendSuccess(res, { insights });
  })
);

router.get(
  "/insight-stats/:month",
  asyncHandler(async (req, res) => {
    const stats = await buildMonthStats(req.user.id, req.params.month);
    return sendSuccess(res, { stats });
  })
);

const chatSchema = z.object({
  message: z.string().min(1).max(500),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(1000) }))
    .optional()
    .default([]),
});

router.post(
  "/chat",
  validate(chatSchema),
  asyncHandler(async (req, res) => {
    const result = await aiChat(req.user.id, req.body.message, req.body.history);
    return sendSuccess(res, result);
  })
);

export default router;
