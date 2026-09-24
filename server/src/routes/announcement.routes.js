import { Router } from "express";
import { Announcement } from "../models/Announcement.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const announcements = await Announcement.find({ active: true })
      .sort({ createdAt: -1 })
      .limit(10);
    return sendSuccess(res, { announcements });
  })
);

export default router;
