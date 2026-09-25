import { Router } from "express";
import {
  getStats,
  listUsers,
  toggleUserActive,
  resetUserPassword,
  deleteUser,
  listDefaultCategories,
  createDefaultCategory,
  updateDefaultCategory,
  deleteDefaultCategory,
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/admin.controller.js";
import { protect, adminOnly } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { z } from "zod";

const router = Router();
router.use(protect, adminOnly);

router.get("/stats", getStats);

router.get("/users", listUsers);
router.patch("/users/:id/toggle", toggleUserActive);
router.patch("/users/:id/reset-password", resetUserPassword);
router.delete("/users/:id", deleteUser);

const catSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(["income", "expense"]),
  icon: z.string().max(40).optional(),
  color: z.string().max(20).optional(),
});

router.get("/categories", listDefaultCategories);
router.post("/categories", validate(catSchema), createDefaultCategory);
router.patch("/categories/:id", validate(catSchema.partial()), updateDefaultCategory);
router.delete("/categories/:id", deleteDefaultCategory);

const annSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  active: z.boolean().optional(),
});

router.get("/announcements", listAnnouncements);
router.post("/announcements", validate(annSchema), createAnnouncement);
router.patch("/announcements/:id", validate(annSchema.partial()), updateAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

export default router;
