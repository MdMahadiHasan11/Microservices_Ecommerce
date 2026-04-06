import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { sentEmailService } from "./email.service";

const sentEmail = catchAsync(async (req: Request, res: Response) => {
  const result = await sentEmailService.sentEmail(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});
const getEmail = catchAsync(async (req: Request, res: Response) => {
  const result = await sentEmailService.getEmail();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Email get successfulLY!",
    data: result,
  });
});

export const emailController = {
  sentEmail,
  getEmail,
};
