import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { DoctorScheduleService } from "./doctorSchedule.service";
import { IAuthUser } from "../../types/common";
import httpStatus from "http-status";
import pick from "../../helper/pick";
import { scheduleFilterableFields } from "./doctorSchedule.constants";


const insertIntoDB = catchAsync(async (req: Request, res: Response) => {

    const user = req.user;
    const result = await DoctorScheduleService.insertIntoDB(user, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Doctor Schedule created successfully!",
        data: result
    });
});

const getMySchedule = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['startDate', 'endDate', 'isBooked']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const user = req.user;
    const result = await DoctorScheduleService.getMySchedule(filters, options, user as IAuthUser);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "My Schedule fetched successfully!",
        data : result?.data,
        meta : result?.meta
    });
});

const deleteFromDB =catchAsync(async (req: Request, res: Response) => {

    const user = req.user;
    const { id } = req.params as { id: string };
    const result = await DoctorScheduleService.deleteFromDB(user as IAuthUser, id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "My Schedule deleted successfully!",
        data: result
    });
});

const getAllScheduleDate =catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const result = await DoctorScheduleService.getAllScheduleDate(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All Active Schedule fetched successfully!",
        meta : result?.meta,
        data : result?.data
    });
});
const getAllSlotByDate =catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['date']);
    const { id } = req.params as { id: string };
    const {date} = filters;
    const result = await DoctorScheduleService.getAllSlotByDate(id, date as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All Active Schedule fetched successfully!",
        meta : result?.meta,
        data : result?.data
    });
});
const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, scheduleFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await DoctorScheduleService.getAllFromDB(filters, options);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Doctor Schedule retrieval successfully',
        meta: result.meta,
        data: result.data,
    });
});

export const DoctorScheduleController = {
    getAllScheduleDate,
    insertIntoDB,
    getMySchedule,
    deleteFromDB,
    getAllFromDB,
    getAllSlotByDate
};