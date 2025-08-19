import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelpers/AppError";
import { envVars } from "../../config/env";
import httpStatus from "http-status-codes";
export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      next();
    } catch (error) {
      next(error);
    }
  };
