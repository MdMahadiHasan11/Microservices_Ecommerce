import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { userService } from "./user-service";
const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createUser(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Created successfulLY!",
    data: result,
  });
});
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.loginUser(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User login successfulLY!",
    data: result,
  });
});

const verifyAccessToken = catchAsync(async (req: Request, res: Response) => {
  const { accessToken } = req.body;

  const result = await userService.verifyToken(accessToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "You are Authenticated!",
    data: result,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.verifyEmail(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Email verified successfulLY!",
    data: result,
  });
});

export const userController = {
  createUser,
  loginUser,
  verifyAccessToken,
  verifyEmail,
};
