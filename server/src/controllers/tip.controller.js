import { Tip } from "../models/Tip.js";
import { Transaction } from "../models/Transaction.js";
import { Budget } from "../models/Budget.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { generateTips } from "../services/tipsEngine.js";

export const listTips = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { userId: req.user.id };
  if (status) filter.status = status;

  const tips = await Tip.find(filter).sort({ status: 1, impactScore: -1, createdAt: -1 });
  return sendSuccess(res, { tips });
});

export const refreshTips = asyncHandler(async (req, res) => {
  const generated = await generateTips(req.user.id);
  const tips = await Tip.find({ userId: req.user.id, status: { $ne: "dismissed" } })
    .sort({ status: 1, impactScore: -1 });
  return sendSuccess(res, { tips, generated }, "Tips refreshed");
});

export const updateTipStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["active", "dismissed", "pinned"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }
  const tip = await Tip.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { status },
    { new: true }
  );
  if (!tip) return res.status(404).json({ success: false, message: "Tip not found" });
  return sendSuccess(res, { tip }, "Tip updated");
});
