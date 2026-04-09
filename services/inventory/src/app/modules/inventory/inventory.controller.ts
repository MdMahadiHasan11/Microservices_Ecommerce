import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { InventoryService } from "./inventory.service";

const createInventory = catchAsync(async (req: Request, res: Response) => {
  const result = await InventoryService.createInventory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Inventory created successfully",
    data: result,
  });
});

const updateInventory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const result = await InventoryService.updateInventory(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Update inventory successfully",
    data: result,
  });
});

const getInventoryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const result = await InventoryService.getInventoryById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Get inventory successfully",
    data: result,
  });
});

const getInventoryDetailsById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const result = await InventoryService.getInventoryDetailsById(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Get Inventory details successfully",
      data: result,
    });
  },
);
export const InventoryController = {
  createInventory,
  updateInventory,
  getInventoryById,
  getInventoryDetailsById,
};
