// controllers/stats.controller.ts
import { Request, Response } from "express";
import { StatsService } from "./stats.service";
import asyncHandler from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";

const getBookingStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await StatsService.getBookingStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking stats fetched successfully",
    data: stats,
  });
});

const getPaymentStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await StatsService.getPaymentStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment stats fetched successfully",
    data: stats,
  });
});

const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await StatsService.getUserStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User stats fetched successfully",
    data: stats,
  });
});

export const StatsController = {
  getBookingStats,
  getPaymentStats,
  getUserStats,
};
