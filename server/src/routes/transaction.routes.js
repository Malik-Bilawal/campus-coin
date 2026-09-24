import { Router } from "express";
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransaction,
} from "../controllers/transaction.controller.js";
import { protect } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { z } from "zod";

const router = Router();
router.use(protect);

const txSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive(),
  categoryId: z.string().min(1),
  note: z.string().max(200).optional().default(""),
  date: z.coerce.date().optional(),
  isRecurring: z.boolean().optional().default(false),
  recurringDay: z.coerce.number().min(1).max(31).optional(),
});

const updateSchema = txSchema.partial();

router.get("/", listTransactions);
router.get("/:id", getTransaction);
router.post("/", validate(txSchema), createTransaction);
router.patch("/:id", validate(updateSchema), updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
