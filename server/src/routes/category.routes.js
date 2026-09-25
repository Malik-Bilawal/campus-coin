import { Router } from "express";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { protect } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { z } from "zod";

const router = Router();
router.use(protect);

const createSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(["income", "expense"]),
  icon: z.string().max(40).optional(),
  color: z.string().max(20).optional(),
});

router.get("/", listCategories);
router.post("/", validate(createSchema), createCategory);
router.patch("/:id", validate(createSchema.partial()), updateCategory);
router.delete("/:id", deleteCategory);

export default router;
