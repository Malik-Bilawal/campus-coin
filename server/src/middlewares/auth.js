import { verifyAccessToken } from "../utils/token.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendError } from "../utils/response.js";

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  let token = null;

  if (header?.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return sendError(res, "Authentication required", 401);
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub, role: decoded.role, email: decoded.email };
    next();
  } catch {
    return sendError(res, "Token expired or invalid", 401);
  }
});

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return sendError(res, "Insufficient permissions", 403);
  }
  next();
};

export const adminOnly = requireRole("admin");
