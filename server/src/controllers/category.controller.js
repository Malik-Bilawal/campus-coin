import { Category } from "../models/Category.js";
import { Transaction } from "../models/Transaction.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { notifyUser } from "../services/notify.js";

export const listCategories = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = {
    $or: [{ userId: req.user.id }, { userId: null, isDefault: true }],
  };
  if (type) filter.type = type;

  const categories = await Category.find(filter).sort({ type: 1, name: 1 });
  return sendSuccess(res, { categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, type, icon, color } = req.body;
  const exists = await Category.findOne({
    userId: req.user.id,
    name: name.toLowerCase() === name.toLowerCase() ? name : name,
    type,
  });
  if (exists) throw ApiError.conflict("Category with this name already exists");

  const category = await Category.create({
    userId: req.user.id,
    name,
    type,
    icon: icon || "tag",
    color: color || "#F59E0B",
    isDefault: false,
  });
  await notifyUser(req.user.id, {
    type: "category",
    title: "Category created",
    message: `New ${type} category “${category.name}” is ready to use.`,
  });
  return sendSuccess(res, { category }, "Category created", 201);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, userId: req.user.id });
  if (!category) throw ApiError.notFound("Category not found");
  if (category.isDefault && category.userId === null) {
    throw ApiError.forbidden("System default categories cannot be edited");
  }

  const { name, icon, color, type } = req.body;
  if (name) category.name = name;
  if (icon) category.icon = icon;
  if (color) category.color = color;
  if (type) category.type = type;
  await category.save();
  await notifyUser(req.user.id, {
    type: "category",
    title: "Category updated",
    message: `Category “${category.name}” was updated.`,
  });

  return sendSuccess(res, { category }, "Category updated");
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, userId: req.user.id });
  if (!category) throw ApiError.notFound("Category not found");

  const used = await Transaction.exists({ userId: req.user.id, categoryId: category._id });
  if (used) throw ApiError.conflict("Cannot delete: transactions exist in this category");

  await category.deleteOne();
  return sendSuccess(res, null, "Category deleted");
});
