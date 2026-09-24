import { Router } from "express";
import {
  listBookmarks,
  createBookmark,
  deleteBookmark,
} from "../controllers/bookmark.controller.js";
import { protect } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { z } from "zod";

const router = Router();
router.use(protect);

const bmSchema = z.object({
  refModel: z.enum(["Tip", "Insight"]),
  refId: z.string().min(1),
});

router.get("/", listBookmarks);
router.post("/", validate(bmSchema), createBookmark);
router.delete("/:id", deleteBookmark);

export default router;
