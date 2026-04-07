import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ProductService } from "./product.service";

const createProduct = catchAsync(async (req: Request, res: Response) => {
  console.log(req.body);
  const result = await ProductService.createProduct(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Inventory created successfully",
    data: result,
  });
});

const getProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.getProduct();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product get successfully",
    data: result,
  });
});

const getProductById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const result = await ProductService.getProductById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Get inventory successfully",
    data: result,
  });
});

const updateProductById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const result = await ProductService.updateProductById(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Update product successfully",
    data: result,
  });
});

export const ProductController = {
  getProduct,
  createProduct,
  getProductById,
  updateProductById,
};
