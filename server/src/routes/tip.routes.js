import { Router } from "express";
import { listTips, refreshTips, updateTipStatus } from "../controllers/tip.controller.js";
import { protect } from "../middlewares/auth.js";

const router = Router();
router.use(protect);

router.get("/", listTips);
router.post("/refresh", refreshTips);
router.patch("/:id/status", updateTipStatus);

export default router;
