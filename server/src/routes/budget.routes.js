import { Router } from "express";
import { listBudgets, upsertBudget, deleteBudget } from "../controllers/budget.controller.js";
import { protect } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { z } from "zod";

const router = Router();
router.use(protect);

const budgetSchema = z.object({
  categoryId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  limit: z.coerce.number().min(0),
});

router.get("/", listBudgets);
router.post("/", validate(budgetSchema), upsertBudget);
router.delete("/:id", deleteBudget);

export default router;
