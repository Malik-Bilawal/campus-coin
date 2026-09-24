import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Transaction } from "../models/Transaction.js";
import { Category } from "../models/Category.js";
import { Announcement } from "../models/Announcement.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { User as UserModel } from "../models/User.js";
import { broadcastNotification } from "../services/notify.js";

export const getStats = asyncHandler(async (req, res) => {
  const [users, transactions, categories, topCategories, activeUsers] = await Promise.all([
    User.countDocuments(),
    Transaction.countDocuments(),
    Category.countDocuments({ userId: null }),
    Transaction.aggregate([
      { $match: { type: "expense" } },
      { $group: { _id: "$categoryId", count: { $sum: 1 }, total: { $sum: "$amount" } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "cat",
        },
      },
      { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          count: 1,
          total: 1,
          name: "$cat.name",
        },
      },
    ]),
    User.countDocuments({ isActive: true, lastLoginAt: { $gte: new Date(Date.now() - 7 * 864e5) } }),
  ]);

  return sendSuccess(res, {
    stats: { users, transactions, categories, activeUsers, topCategories },
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, q } = req.query;
  const filter = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit) || 20);

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    users: users.map((u) => u.toSafeJSON()),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  user.isActive = !user.isActive;
  await user.save();
  return sendSuccess(res, { user: user.toSafeJSON() }, `User ${user.isActive ? "enabled" : "disabled"}`);
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  user.password = await User.hashPassword(newPassword || "Reset@123");
  await user.save();
  return sendSuccess(res, null, "Password reset by admin");
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  if (user.role === "admin") throw ApiError.forbidden("Cannot delete admin");
  await user.deleteOne();
  return sendSuccess(res, null, "User deleted");
});

export const listDefaultCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ userId: null }).sort({ type: 1, name: 1 });
  return sendSuccess(res, { categories });
});

export const createDefaultCategory = asyncHandler(async (req, res) => {
  const { name, type, icon, color } = req.body;
  const category = await Category.create({
    userId: null,
    name,
    type,
    icon: icon || "tag",
    color: color || "#F59E0B",
    isDefault: true,
  });
  return sendSuccess(res, { category }, "Default category created", 201);
});

export const updateDefaultCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, userId: null },
    req.body,
    { new: true, runValidators: true }
  );
  if (!category) throw ApiError.notFound("Category not found");
  return sendSuccess(res, { category }, "Category updated");
});

export const deleteDefaultCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOneAndDelete({ _id: req.params.id, userId: null });
  if (!category) throw ApiError.notFound("Category not found");
  return sendSuccess(res, null, "Category deleted");
});

export const listAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  return sendSuccess(res, { announcements });
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, body, active } = req.body;
  const isActive = active !== false;
  const announcement = await Announcement.create({
    title,
    body,
    active: isActive,
  });
  if (isActive) {
    await broadcastNotification({
      type: "announcement",
      title,
      message: `${title} — ${body}`,
    });
  }
  return sendSuccess(res, { announcement }, "Announcement created", 201);
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!announcement) throw ApiError.notFound("Announcement not found");
  return sendSuccess(res, { announcement }, "Announcement updated");
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) throw ApiError.notFound("Announcement not found");
  return sendSuccess(res, null, "Announcement deleted");
});
