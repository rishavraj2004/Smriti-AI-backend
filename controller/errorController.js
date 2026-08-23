import AppError from "../utils/appError.js";

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = err.keyValue ? Object.keys(err.keyValue)[0] : "field";
  const value = err.keyValue ? err.keyValue[field] : "";
  const message = `This ${field} already exists: ${value}. Please use another one!`;
  return new AppError(message, 409);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError("Invalid authentication token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your session token has expired! Please log in again.", 401);

export default (err, req, res, next) => {
  let error = err;
  error.statusCode = err.statusCode || 500;
  error.status = err.status || "error";
  error.message = err.message || "An unexpected error occurred.";

  if (err.name === "CastError") error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === "ValidationError") error = handleValidationErrorDB(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  if (error.statusCode === 500) {
    console.error("SERVER ERROR:", err);
  }

  res.status(error.statusCode).json({
    success: false,
    status: error.status,
    message: error.message,
  });
};
