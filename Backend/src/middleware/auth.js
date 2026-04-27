import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

export function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : req.cookies?.accessToken;

  if (!token) {
    throw new HttpError(401, "Authentication required");
  }

  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }

  return next();
}

export function requireRole(role) {
  return (req, _res, next) => {
    if (!req.user || req.user.role !== role) {
      throw new HttpError(403, "Forbidden");
    }
    return next();
  };
}
