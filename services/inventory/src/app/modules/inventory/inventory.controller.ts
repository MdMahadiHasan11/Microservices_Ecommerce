import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { InventoryService } from "./inventory.service";

const createInventory = catchAsync(async (req: Request, res: Response) => {
  console.log(req.body);
  const result = await InventoryService.createInventory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Inventory created successfully",
    data: result,
  });
});

export const InventoryController = {
  createInventory,
};
