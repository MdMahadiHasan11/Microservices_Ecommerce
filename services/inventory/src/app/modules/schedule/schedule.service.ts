import { addMinutes, addHours, format } from "date-fns";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { Prisma, Schedule } from "@prisma/client";
import { IFilterRequest, ISchedule } from "./schedule.interface";
import { IPaginationOptions } from "../../types/pagination";
import { IAuthUser } from "../../types/common";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { DateTimeUtils } from "../../utils/common/date-time-utils";

const convertDateTime = async (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + offset);
};

const inserIntoDB = async (payload: ISchedule): Promise<Schedule[]> => {
  const { startDate, endDate, startTime, endTime } = payload;

  const intervalTime = 30;

  const schedules = [];

  const currentDate = new Date(startDate); // start date
  const lastDate = new Date(endDate); // end date

  while (currentDate <= lastDate) {
    // 09:30  ---> ['09', '30']
    const startDateTime = new Date(
      addMinutes(
        addHours(
          `${format(currentDate, "yyyy-MM-dd")}`,
          Number(startTime.split(":")[0]),
        ),
        Number(startTime.split(":")[1]),
      ),
    );

    const endDateTime = new Date(
      addMinutes(
        addHours(
          `${format(currentDate, "yyyy-MM-dd")}`,
          Number(endTime.split(":")[0]),
        ),
        Number(endTime.split(":")[1]),
      ),
    );

    while (startDateTime < endDateTime) {
      // const scheduleData = {
      //     startDateTime: startDateTime,
      //     endDateTime: addMinutes(startDateTime, intervalTime)
      // }

      const s = await convertDateTime(startDateTime);
      const e = await convertDateTime(addMinutes(startDateTime, intervalTime));

      const scheduleData = {
        startDateTime: s,
        endDateTime: e,
      };

      const existingSchedule = await prisma.schedule.findFirst({
        where: {
          startDateTime: scheduleData.startDateTime,
          endDateTime: scheduleData.endDateTime,
        },
      });

      if (!existingSchedule) {
        const result = await prisma.schedule.create({
          data: scheduleData,
        });
        schedules.push(result);
      }

      startDateTime.setMinutes(startDateTime.getMinutes() + intervalTime);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedules;
};

const getAllFromDB = async (
  filters: IFilterRequest,
  options: IPaginationOptions,
  user: IAuthUser,
) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { startDate, endDate, ...filterData } = filters;

  const andConditions: Prisma.ScheduleWhereInput[] = [];

  const now = new Date();
  // If no date filter -> show only future schedules (after today)
  if (!startDate && !endDate) {
    andConditions.push({
      startDateTime: { gte: now },
    });
  }
  // startDate + endDate
  if (startDate && endDate) {
    andConditions.push({
      startDateTime: {
        gte: DateTimeUtils.startOfDay(startDate),
        lte: DateTimeUtils.endOfDay(endDate),
      },
    });
  }

  // only startDate
  if (startDate && !endDate) {
    andConditions.push({
      startDateTime: {
        gte: DateTimeUtils.startOfDay(startDate),
        lte: DateTimeUtils.endOfDay(startDate),
      },
    });
  }

  // only endDate
  if (!startDate && endDate) {
    andConditions.push({
      startDateTime: {
        gte: DateTimeUtils.startOfDay(endDate),
        lte: DateTimeUtils.endOfDay(endDate),
      },
    });
  }

  // other filters
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.ScheduleWhereInput = andConditions.length
    ? { AND: andConditions }
    : {};

  const result = await prisma.schedule.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      startDateTime: "asc",
    },
  });

  const total = await prisma.schedule.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};
const getAllDoctorScheduleFromDB = async (
  filters: IFilterRequest,
  options: IPaginationOptions,
  user: IAuthUser,
) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { startDate, endDate, isBooked, ...filterData } = filters;

  const isBookedBoolean =
    typeof isBooked === "string" ? JSON.parse(isBooked) : isBooked;

  const andConditions: Prisma.ScheduleWhereInput[] = [];

  const now = new Date();
  if (!startDate && !endDate) {
    andConditions.push({
      startDateTime: { gte: now },
    });
  }
  // Date filter
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : new Date(endDate!);
    start.setUTCHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date(startDate!);
    end.setUTCHours(23, 59, 59, 999);

    andConditions.push({
      startDateTime: {
        gte: start,
        lte: end,
      },
    });
  }

  // Other filters
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: (filterData as any)[key] },
      })),
    });
  }

  // Find doctor
  const doctor = await prisma.doctor.findFirst({
    where: { email: user?.email },
    select: { id: true },
  });

  if (!doctor) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Doctor not found");
  }

  // isBooked filter (Professional way)
  if (isBookedBoolean !== undefined) {
    andConditions.push({
      doctorSchedules:
        isBookedBoolean === true
          ? {
              some: {
                doctorId: doctor.id,
              },
            }
          : {
              none: {
                doctorId: doctor.id,
              },
            },
    });
  }

  const whereConditions: Prisma.ScheduleWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Query
  const [result, total] = await prisma.$transaction([
    prisma.schedule.findMany({
      where: whereConditions,
      include: {
        doctorSchedules: {
          where: {
            doctorId: doctor.id,
          },
        },
      },
      orderBy: {
        startDateTime: "asc",
      },
      skip,
      take: limit,
    }),
    prisma.schedule.count({
      where: whereConditions,
    }),
  ]);

  // Map response
  const data = result.map((schedule) => ({
    id: schedule.id,
    startDateTime: schedule.startDateTime,
    endDateTime: schedule.endDateTime,
    isBooked: schedule.doctorSchedules.length > 0,
  }));
  console.log({ data });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data,
  };
};
const getByIdFromDB = async (id: string): Promise<Schedule | null> => {
  const result = await prisma.schedule.findUnique({
    where: {
      id,
    },
  });

  return result;
};

const deleteFromDB = async (id: string): Promise<Schedule> => {
  const result = await prisma.schedule.delete({
    where: {
      id,
    },
  });
  return result;
};

export const ScheduleService = {
  getAllDoctorScheduleFromDB,
  inserIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
};
