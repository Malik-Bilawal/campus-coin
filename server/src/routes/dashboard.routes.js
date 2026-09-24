import { Router } from "express";
import { getDashboard } from "../controllers/dashboard.controller.js";
import { protect } from "../middlewares/auth.js";

const router = Router();
router.use(protect);
router.get("/", getDashboard);

export default router;
