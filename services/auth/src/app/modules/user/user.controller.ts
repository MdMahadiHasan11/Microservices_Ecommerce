import { Request, Response } from "express";
import httpStatus from "http-status";
import pick from "../../helper/pick";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { userService } from "./user-service";
const createUser= catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createUser(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Created successfuly!",
    data: result,
  });
});



export const userController = {
  createUser,
};
