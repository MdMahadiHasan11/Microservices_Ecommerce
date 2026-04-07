import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AddToCartService } from "./cart.service";

const addToCart = catchAsync(async (req: Request, res: Response) => {
  const result = await AddToCartService.addToCart(req.body, req, res);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Add to cart  successfully",
    data: result,
  });
});
const getMyCart = catchAsync(async (req: Request, res: Response) => {
  const result = await AddToCartService.getMyCart(req, res);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Get my cart  successfully",
    data: result,
  });
});

const cleatToCart = catchAsync(async (req: Request, res: Response) => {
  const result = await AddToCartService.cleatToCart(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Clear cart  successfully",
    data: result,
  });
});

export const CartController = {
  addToCart,
  getMyCart,
  cleatToCart,
};
