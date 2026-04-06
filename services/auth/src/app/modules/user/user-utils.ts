import { LoginAttempt } from "@prisma/client";
import { Request } from "express";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { LoginHistory } from "./user-interface";

export const extractRequestInfo = (req: Request) => {
  const ipAddress =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket?.remoteAddress ||
    req.ip ||
    "";

  const userAgent = req.headers["user-agent"] || "";

  return { ipAddress, userAgent };
};

export const createLoginHistory = async ({
  userId,
  userAgent,
  ipAddress,
  attempt,
}: LoginHistory) => {
  // 🔍 Step 1: Check existing user
  await prisma.loginHistory.create({
    data: {
      userId,
      userAgent,
      ipAddress,
      attempt,
    },
  });

  return;
};
export const handleFailedLogin = async ({
  userId,
  userAgent,
  ipAddress,
  message,
}: {
  userId: string;
  userAgent: string;
  ipAddress: string;
  message: string;
}) => {
  try {
    await createLoginHistory({
      userId,
      userAgent,
      ipAddress,
      attempt: LoginAttempt.FAILED,
    });
  } catch (error) {
    // শুধু log করো, app crash করো না
    console.error("❌ Failed to save login history:", error);
  }

  // মূল error always throw হবে
  throw new ApiError(httpStatus.BAD_REQUEST, message);
};
