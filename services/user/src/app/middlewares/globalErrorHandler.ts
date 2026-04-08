import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

const sanitizeError = (error: any) => {
  // Don't expose Prisma errors in production
  if (process.env.NODE_ENV === "production" && error.code?.startsWith("P")) {
    return {
      message: "Database operation failed",
      errorDetails: null,
    };
  }
  return error;
};

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

  // Handle Prisma specific errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        message = "Duplicate entry. Record already exists.";
        error = err.meta;
        statusCode = httpStatus.CONFLICT;
        break;

      case "P2003":
        message = "Foreign key constraint failed.";
        error = err.meta;
        statusCode = httpStatus.BAD_REQUEST;
        break;

      case "P2025": // ← Record not found (most important for your login case)
        message = "No record found";
        error = {
          cause: err.meta?.cause || "The requested record does not exist",
        };
        statusCode = httpStatus.NOT_FOUND;
        break;

      case "P1000":
        message = "Database authentication failed";
        error = err.meta;
        statusCode = httpStatus.BAD_GATEWAY;
        break;

      default:
        message = "Database operation failed";
        error = { code: err.code, meta: err.meta };
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    message = "Invalid query / validation error";
    error = err.message;
    statusCode = httpStatus.BAD_REQUEST;
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    message = "Unknown database error occurred";
    error = err.message;
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    message = "Database client failed to initialize";
    error = err.message;
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  }

  // Optional: log the error somewhere (console, file, sentry, etc.)
  console.error("[ERROR]", {
    statusCode,
    message,
    path: req.originalUrl,
    method: req.method,
    error: err,
  });
  // Sanitize error before sending response
  const sanitizedError = sanitizeError(error);

  res.status(statusCode).json({
    success,
    message,
    error: sanitizedError,
  });
};

export default globalErrorHandler;
