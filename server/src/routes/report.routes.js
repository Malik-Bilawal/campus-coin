import { Router } from "express";
import {
  categoryReport,
  sixMonthTrend,
  dailyWeeklySummary,
  filteredReport,
} from "../controllers/report.controller.js";
import { protect } from "../middlewares/auth.js";

const router = Router();
router.use(protect);

router.get("/category", categoryReport);
router.get("/trend", sixMonthTrend);
router.get("/daily-weekly", dailyWeeklySummary);
router.get("/filtered", filteredReport);

export default router;
