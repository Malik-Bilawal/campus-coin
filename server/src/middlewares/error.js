import { ApiError } from "../utils/apiError.js";
import { env } from "../config/env.js";

export function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errors = err.errors || null;

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => e.message);
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value for ${field}`;
  }

  if (env.NODE_ENV !== "test") {
    console.error(`[${new Date().toISOString()}] ${statusCode} ${message}`, err.stack?.split("\n").slice(0, 4).join("\n"));
  }

  // Unexpected 5xx: log the real error, but never leak internals to the client
  const clientMessage =
    statusCode >= 500 ? "Something went wrong — please try again." : message;

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    errors,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
