import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { OrderService } from "./order.service";

const checkout = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.checkout(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Checkout successfully",
    data: result,
  });
});
const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const result = await OrderService.getOrderById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order get successfully",
    data: result,
  });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.getAllOrders();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Order get successfully",
    data: result,
  });
});

export const orderController = {
  checkout,
  getOrderById,
  getAllOrders,
};
