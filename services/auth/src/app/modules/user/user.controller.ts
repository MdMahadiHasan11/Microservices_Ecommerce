/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { UserServices } from "./user.service";
import { JwtPayload } from "jsonwebtoken";
import asyncHandler from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";

//custom email login

// const createUser = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     // throw new Error("fake error");
//     // throw new AppError(httpStatus.BAD_REQUEST, "fake");
//     const user = await UserServices.createUserService(req.body);

//     res
//       .status(httpStatus.CREATED)
//       .json({ message: "User created successfully", user });
//   } catch (err: any) {
//     console.log(err);
//     next(err);
//   }
// };

const createUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserServices.createUser(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "User created successfully",
      data: result,
    });
  }
);

const updateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const verifiedToken = req.user;

    const result = await UserServices.updateUser(
      req.params.id,
      req.body,
      verifiedToken as JwtPayload
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "User updated successfully",
      data: result,
    });
  }
);

const getAllUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserServices.getAllUsers();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Users retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);

const getMe = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const verifiedToken = req.user as JwtPayload;
    const result = await UserServices.getMe(verifiedToken.userId as string);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User retrieved successfully",
      // meta: result.meta,
      data: result.data,
    });
  }
);

const getSingleUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await UserServices.getSingleUser(id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User Retrieved Successfully",
      data: result.data,
    });
  }
);
export const UserControllers = {
  createUser,
  getAllUsers,
  updateUser,
  getMe,
  getSingleUser,
};
