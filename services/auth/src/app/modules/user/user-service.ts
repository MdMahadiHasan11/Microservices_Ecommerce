import * as bcrypt from "bcryptjs";
import { Request } from "express";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import { ICreateUser } from "./user.validation";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createUser = async (req: Request) => {
  const data = req.body as ICreateUser;

  return data;
};

export const userService = {
  createUser
};
