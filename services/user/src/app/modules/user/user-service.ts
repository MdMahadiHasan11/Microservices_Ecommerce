import * as bcrypt from "bcryptjs";
import { Request } from "express";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import { ICreateUser } from "./user.validation";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createUser = async (req: Request) => {
  const data = req.body as ICreateUser;

  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.authUserId,
    },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User already exists");
  }

  const createUser = await prisma.user.create({
    data: data,
  });

  return createUser;
};

const getUserById = async (id: string, filters: any) => {
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User id is required");
  }

  const {field } = filters;
  const user = await prisma.user.findUnique({
    where: field === "auth" ? { authUserId: id } : { id },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};
export const userService = {
  createUser,
  getUserById,
};
