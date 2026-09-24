import { Bookmark } from "../models/Bookmark.js";
import { Tip } from "../models/Tip.js";
import { Insight } from "../models/Insight.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

export const listBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ userId: req.user.id }).sort({ createdAt: -1 });
  return sendSuccess(res, { bookmarks });
});

export const createBookmark = asyncHandler(async (req, res) => {
  const { refModel, refId } = req.body;

  let title = "";
  let snippet = "";

  if (refModel === "Tip") {
    const tip = await Tip.findOne({ _id: refId, userId: req.user.id });
    if (!tip) throw ApiError.notFound("Tip not found");
    title = tip.title;
    snippet = tip.body;
  } else if (refModel === "Insight") {
    const insight = await Insight.findOne({ _id: refId, userId: req.user.id });
    if (!insight) throw ApiError.notFound("Insight not found");
    title = `Insight ${insight.month}`;
    snippet = insight.narrative.slice(0, 120);
  } else {
    throw ApiError.badRequest("Unsupported refModel");
  }

  const existing = await Bookmark.findOne({ userId: req.user.id, refModel, refId });
  if (existing) {
    await existing.deleteOne();
    return sendSuccess(res, { bookmark: null, removed: true }, "Bookmark removed");
  }

  const bookmark = await Bookmark.create({
    userId: req.user.id,
    refModel,
    refId,
    title,
    snippet,
  });
  return sendSuccess(res, { bookmark, removed: false }, "Bookmarked", 201);
});

export const deleteBookmark = asyncHandler(async (req, res) => {
  const bm = await Bookmark.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!bm) throw ApiError.notFound("Bookmark not found");
  return sendSuccess(res, null, "Bookmark removed");
});
