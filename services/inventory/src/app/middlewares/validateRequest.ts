import { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

const validateRequest =
  (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedData = await schema.parseAsync(req.body);
      req.body = parsedData;
      return next();
    } catch (err) {
      next(err);
    }
  };

export default validateRequest;
