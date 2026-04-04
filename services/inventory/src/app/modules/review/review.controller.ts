import { Request, Response } from "express";
import httpStatus from "http-status";
import { reviewFilterableFields } from "./review.contant";
import { ReviewService } from "./review.service";
import catchAsync from "../../shared/catchAsync";
import { IAuthUser } from "../../types/common";
import sendResponse from "../../shared/sendResponse";
import pick from "../../helper/pick";

const insertIntoDB = catchAsync(async (req: Request , res: Response) => {
    const user = req.user;
    const result = await ReviewService.insertIntoDB(user as IAuthUser, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Review created successfully',
        data: result,
    });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, reviewFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await ReviewService.getAllFromDB(filters, options);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Reviews retrieval successfully',
        meta: result.meta,
        data: result.data,
    });
});


export const ReviewController = {
    insertIntoDB,
    getAllFromDB
}