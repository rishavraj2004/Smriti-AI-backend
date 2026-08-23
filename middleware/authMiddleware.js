import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";

const requireRole = (role) => (req, res, next) => {
  const header = req.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new AppError("Authentication token is required", 401));
  if (!process.env.JWT_SECRET) return next(new Error("JWT_SECRET is not configured"));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== role || !payload.sub) return next(new AppError("Invalid authentication token", 401));
    req.authenticatedUserId = payload.sub;
    next();
  } catch (error) {
    next(error);
  }
};

export const requirePatientAuth = (req, res, next) => {
  requireRole("patient")(req, res, (error) => {
    if (!error) req.patientId = req.authenticatedUserId;
    next(error);
  });
};

export const requireCaregiverAuth = (req, res, next) => {
  requireRole("caregiver")(req, res, (error) => {
    if (!error) req.caregiverId = req.authenticatedUserId;
    next(error);
  });
};

export const requireAnyAuth = (req, res, next) => {
  const header = req.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new AppError("Authentication token is required", 401));
  if (!process.env.JWT_SECRET) return next(new Error("JWT_SECRET is not configured"));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.sub) return next(new AppError("Invalid authentication token", 401));
    req.authenticatedUserId = payload.sub;
    req.userRole = payload.role;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (error) {
    next(error);
  }
};
