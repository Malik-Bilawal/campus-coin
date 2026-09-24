import { Router } from "express";
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransaction,
  importTransactions,
} from "../controllers/transaction.controller.js";
import { protect } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { z } from "zod";

const router = Router();
router.use(protect);

const txSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive(),
  categoryId: z.string().min(1).optional(),
  note: z.string().max(200).optional().default(""),
  date: z.coerce.date().optional(),
  isRecurring: z.boolean().optional().default(false),
  recurringDay: z.coerce.number().min(1).max(31).optional(),
  aiSuggested: z.boolean().optional(),
});

const updateSchema = txSchema.partial().extend({ categoryId: z.string().min(1).optional() });

const importSchema = z.object({
  rows: z
    .array(
      z.object({
        type: z.enum(["income", "expense"]).optional(),
        amount: z.coerce.number().positive(),
        categoryId: z.string().min(1),
        note: z.string().max(200).optional(),
        date: z.string().optional(),
        aiSuggested: z.boolean().optional(),
      })
    )
    .min(1)
    .max(500),
});

router.get("/", listTransactions);
router.post("/import", validate(importSchema), importTransactions);
router.get("/:id", getTransaction);
router.post("/", validate(txSchema), createTransaction);
router.patch("/:id", validate(updateSchema), updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
