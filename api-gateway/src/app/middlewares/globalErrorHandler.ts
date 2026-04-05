import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../config";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let success = false;
  let message = err.message || "Something went wrong!";
  let error: any = err;

  // Handle common error types (without Prisma)
  if (err.name === "ValidationError") {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Validation Error";
    error = err.details || err.message;
  } else if (err.name === "UnauthorizedError" || err.message?.includes("jwt")) {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Unauthorized access";
    error = null;
  } else if (err.name === "ForbiddenError") {
    statusCode = httpStatus.FORBIDDEN;
    message = "Access forbidden";
    error = null;
  } else if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = httpStatus.BAD_REQUEST;
    message = "File size is too large";
  } else if (err.message?.includes("duplicate key") || err.code === 11000) {
    // For MongoDB duplicate key error (if you use later)
    statusCode = httpStatus.CONFLICT;
    message = "Duplicate entry. Record already exists.";
  }

  // In production, don't show detailed error to user
  if (config.env === "production") {
    error = null; // Hide full error details in production
    if (statusCode === httpStatus.INTERNAL_SERVER_ERROR) {
      message = "Internal Server Error";
    }
  }

  // Log error for debugging
  console.error("[ERROR]", {
    statusCode,
    message,
    path: req.originalUrl,
    method: req.method,
    stack: config.env === "development" ? err.stack : undefined,
  });

  // Send response
  res.status(statusCode).json({
    success,
    message,
    error,
  });
};

export default globalErrorHandler;
