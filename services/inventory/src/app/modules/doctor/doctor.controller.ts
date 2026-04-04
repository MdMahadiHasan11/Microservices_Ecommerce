import { Request, Response } from "express";
import pick from "../../helper/pick";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { doctorFilterableFields } from "./doctor.constant";
import { DoctorService } from "./doctor.service";
import httpStatus from 'http-status';

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, doctorFilterableFields);

    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await DoctorService.getAllFromDB(filters, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Doctors retrieval successfully',
        meta: result.meta,
        data: result.data,
    });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const result = await DoctorService.getByIdFromDB(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Doctor retrieval successfully',
        data: result,
    });
});

const getPatientsAvailableSchedule = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['startDate', 'endDate', 'isBooked']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const { id } = req.params as { id: string };
    const result = await DoctorService.getPatientsAvailableSchedule(filters, options, id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Doctor retrieval successfully',
        data: result,
    });
});


const updateIntoDB = catchAsync(async (req: Request, res: Response) => {

    const { id } = req.params as { id: string };
    const result = await DoctorService.updateIntoDB(id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Doctor data updated!",
        data: result
    })
});

const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const result = await DoctorService.deleteFromDB(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Doctor deleted successfully',
        data: result,
    });
});


const softDelete = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const result = await DoctorService.softDelete(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Doctor soft deleted successfully',
        data: result,
    });
});

const getAiSuggestion = catchAsync(async (req: Request, res: Response) => {
    const { symptoms } = req.body;

    // Basic validation
    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 5) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Please provide valid symptoms for doctor suggestion (minimum 5 characters).',
        });
    }

    const result = await DoctorService.getAISuggestion({ symptoms: symptoms.trim() });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'AI doctor suggestions retrieved successfully',
        data: result,
    });
});



export const DoctorController = {
  updateIntoDB,
    getAllFromDB,
    getByIdFromDB,
    getPatientsAvailableSchedule,
    deleteFromDB,
    softDelete,
    getAiSuggestion,
};
