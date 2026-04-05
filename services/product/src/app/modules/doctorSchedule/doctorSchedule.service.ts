import { Prisma } from "@prisma/client";
import ApiError from "../../errors/ApiError";
import { paginationHelper } from "../../helper/paginationHelper";
// import { prisma } from "../../shared/prisma";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import { IAuthUser } from "../../types/common";
import { IPaginationOptions } from "../../types/pagination";
import { DateTimeUtils } from "../../utils/common/date-time-utils";
import { IDoctorScheduleFilterRequest } from "./doctorSchedule.interface";

const insertIntoDB = async (
  user: any,
  payload: {
    scheduleIds: string[];
  },
) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const doctorScheduleData = payload.scheduleIds.map((scheduleId) => ({
    doctorId: doctorData.id,
    scheduleId,
  }));

  const result = await prisma.doctorSchedules.createMany({
    data: doctorScheduleData,
  });

  return result;
};

const getMySchedule = async (
  filters: any,
  options: IPaginationOptions,
  user: IAuthUser,
) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);

  const { startDate, endDate, ...filterData } = filters;

  const andConditions: Prisma.DoctorSchedulesWhereInput[] = [];

  const now = new Date();

  /**
   * Get Doctor ID from logged in user
   */
  const doctor = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
    select: {
      id: true,
    },
  });

  /**
   * Always filter by doctor
   */
  andConditions.push({
    doctorId: doctor.id,
  });

  /**
   * If no date filter -> show only future schedules
   */
  if (!startDate && !endDate) {
    andConditions.push({
      schedule: {
        startDateTime: {
          gte: now,
        },
      },
    });
  }

  /**
   * startDate + endDate
   */
  if (startDate && endDate) {
    andConditions.push({
      schedule: {
        startDateTime: {
          gte: DateTimeUtils.startOfDay(startDate),
          lte: DateTimeUtils.endOfDay(endDate),
        },
      },
    });
  }

  /**
   * only startDate
   */
  if (startDate && !endDate) {
    andConditions.push({
      schedule: {
        startDateTime: {
          gte: DateTimeUtils.startOfDay(startDate),
          lte: DateTimeUtils.endOfDay(startDate),
        },
      },
    });
  }

  /**
   * only endDate
   */
  if (!startDate && endDate) {
    andConditions.push({
      schedule: {
        startDateTime: {
          lte: DateTimeUtils.endOfDay(endDate),
        },
      },
    });
  }

  /**
   * Convert isBooked string -> boolean
   */
  if (filterData.isBooked === "true") {
    filterData.isBooked = true;
  }

  if (filterData.isBooked === "false") {
    filterData.isBooked = false;
  }

  /**
   * Dynamic filtering
   */
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  /**
   * Final where condition
   */
  const whereConditions: Prisma.DoctorSchedulesWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  /**
   * DB query with transaction (best practice)
   */

  console.log("ppppppppp");
  const [result, total] = await prisma.$transaction([
    prisma.doctorSchedules.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy:
        options.sortBy && options.sortOrder
          ? { [options.sortBy]: options.sortOrder }
          : { createdAt: "desc" },
      include: {
        schedule: true,
      },
    }),

    prisma.doctorSchedules.count({
      where: whereConditions,
    }),
  ]);

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const getAllScheduleDate = async (id: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const schedules = await prisma.doctorSchedules.findMany({
    where: {
      doctorId: id,
      schedule: {
        startDateTime: {
          gte: today,
        },
      },
    },
    include: {
      schedule: true,
    },
    orderBy: {
      schedule: {
        startDateTime: "asc",
      },
    },
  });

  // unique date with ISO format
  const uniqueDates = [
    ...new Set(
      schedules.map((item) => {
        const date = item.schedule.startDateTime.toISOString().split("T")[0];
        return `${date}T00:00:00.000Z`;
      }),
    ),
  ];

  return {
    meta: {
      total: uniqueDates.length,
    },
    data: uniqueDates,
  };
};

const getAllSlotByDate = async (id: string, date?: string) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const andConditions: Prisma.DoctorSchedulesWhereInput[] = [
    { doctorId: id },
  ];

  /**
   * If date is provided -> filter that specific day
   */
  if (date) {
    andConditions.push({
      schedule: {
        startDateTime: {
          gte: DateTimeUtils.startOfDay(date),
          lte: DateTimeUtils.endOfDay(date),
        },
      },
    });
  } else {
    /**
     * If no date -> show only future slots
     */
    andConditions.push({
      schedule: {
        startDateTime: {
          gte: today,
        },
      },
    });
  }

  const whereConditions: Prisma.DoctorSchedulesWhereInput = {
    AND: andConditions,
  };

  const result = await prisma.doctorSchedules.findMany({
    where: whereConditions,
    orderBy: {
      schedule: {
        startDateTime: "asc",
      },
    },
    include: {
      schedule: {
        select: {
          id: true,
          startDateTime: true,
          endDateTime: true,
        },
      },
    },
  });

  const total = await prisma.doctorSchedules.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
    },
    data: result,
  };
};

const deleteFromDB = async (user: IAuthUser, scheduleId: string) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
  });

  const isBookedSchedule = await prisma.doctorSchedules.findFirst({
    where: {
      doctorId: doctorData.id,
      scheduleId: scheduleId,
      isBooked: true,
    },
  });

  if (isBookedSchedule) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You can not delete the schedule because of the schedule is already booked!",
    );
  }

  const result = await prisma.doctorSchedules.delete({
    where: {
      doctorId_scheduleId: {
        doctorId: doctorData.id,
        scheduleId: scheduleId,
      },
    },
  });
  return result;
};

const getAllFromDB = async (
  filters: IDoctorScheduleFilterRequest,
  options: IPaginationOptions,
) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { startDate, endDate, searchTerm, ...filterData } = filters;
  const andConditions = [];

  const now = new Date();

  // If no date filter -> show only future schedules
  if (!startDate && !endDate) {
    andConditions.push({
      schedule: {
        startDateTime: {
          gte: now,
        },
      },
    });
  }

  // startDate + endDate
  if (startDate && endDate) {
    andConditions.push({
      schedule: {
        startDateTime: {
          gte: DateTimeUtils.startOfDay(startDate),
          lte: DateTimeUtils.endOfDay(endDate),
        },
      },
    });
  }

  // only startDate
  if (startDate && !endDate) {
    andConditions.push({
      schedule: {
        startDateTime: {
          gte: DateTimeUtils.startOfDay(startDate),
          lte: DateTimeUtils.endOfDay(startDate),
        },
      },
    });
  }

  // only endDate
  if (!startDate && endDate) {
    andConditions.push({
      schedule: {
        startDateTime: {
          lte: DateTimeUtils.endOfDay(endDate),
        },
      },
    });
  }

  if (searchTerm) {
    andConditions.push({
      doctor: {
        name: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
    });
  }

  if (Object.keys(filterData).length > 0) {
    if (
      typeof filterData.isBooked === "string" &&
      filterData.isBooked === "true"
    ) {
      filterData.isBooked = true;
    } else if (
      typeof filterData.isBooked === "string" &&
      filterData.isBooked === "false"
    ) {
      filterData.isBooked = false;
    }
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: any =
    andConditions.length > 0 ? { AND: andConditions } : {};
  const result = await prisma.doctorSchedules.findMany({
    include: {
      // doctor: true,
      schedule: true,
    },
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { schedule: { [options.sortBy]: options.sortOrder } }
        : { schedule: { startDateTime: "asc" } },
  });
  const total = await prisma.doctorSchedules.count({
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

export const DoctorScheduleService = {
  insertIntoDB,
  getMySchedule,
  deleteFromDB,
  getAllFromDB,
  getAllScheduleDate,
  getAllSlotByDate,
};
