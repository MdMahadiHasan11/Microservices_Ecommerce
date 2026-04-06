import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../config";

// 🔐 sanitize sensitive error
const sanitizeError = (error: any) => {
  if (config.node_env === "production") {
    return {
      message: error?.message || "Something went wrong",
      details: null,
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
  let message = err.message || "Something went wrong!";
  let errorDetails: any = err;

  // =========================
  // ✅ Prisma Errors
  // =========================
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        statusCode = httpStatus.CONFLICT;
        message = `${(err.meta?.target as any)?.[0] || "Field"} already exists`;
        errorDetails = err.meta;
        break;

      case "P2003":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Foreign key constraint failed";
        errorDetails = err.meta;
        break;

      case "P2025":
        statusCode = httpStatus.NOT_FOUND;
        message = "No record found";
        errorDetails = {
          cause: err.meta?.cause || "The requested record does not exist",
        };
        break;

      case "P1000":
        statusCode = httpStatus.BAD_GATEWAY;
        message = "Database authentication failed";
        errorDetails = err.meta;
        break;

      default:
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = "Database operation failed";
        errorDetails = { code: err.code, meta: err.meta };
    }
  }

  // =========================
  // ✅ Prisma Validation
  // =========================
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Invalid query / validation error";
    errorDetails = err.message;
  }

  // =========================
  // ✅ Axios Error (🔥 MOST IMPORTANT for you)
  // =========================
  else if (err.isAxiosError) {
    statusCode = err.response?.status || httpStatus.BAD_GATEWAY;

    message =
      err.response?.data?.message || err.message || "External service error";

    errorDetails = err.response?.data || null;
  }

  // =========================
  // ✅ Generic Errors
  // =========================
  else {
    errorDetails = err;
  }

  // 🪵 Logging
  console.error("[ERROR]", {
    statusCode,
    message,
    path: req.originalUrl,
    method: req.method,
    error: err,
  });

  // 🔐 sanitize
  const sanitizedError = sanitizeError(errorDetails);

  // 📤 Response
  res.status(statusCode).json({
    success: false,
    message,
    ...(config.node_env !== "production" && {
      error: sanitizedError,
      stack: err.stack,
    }),
  });
};

export default globalErrorHandler;
