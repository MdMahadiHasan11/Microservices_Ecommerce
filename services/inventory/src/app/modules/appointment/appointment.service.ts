import httpStatus from "http-status";
import { v4 as uuidv4 } from "uuid";
import { IAuthUser } from "../../types/common";
import { stripe, stripeInitiatePayment } from "../../helper/stripe";
import { IPaginationOptions } from "../../types/pagination";
import { paginationHelper } from "../../helper/paginationHelper";
import ApiError from "../../errors/ApiError";
import prisma from "../../../shared/prisma";
import {
  AppointmentStatus,
  PaymentGateway,
  PaymentStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
// import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { sslPaymentInit } from "../sslCommerz/sslCommerz.service";
import Stripe from "stripe";

export const createAppointment = async (
  user: IAuthUser,
  payload: {
    doctorId: string;
    scheduleId: string;
    paymentType: PaymentGateway;
  },
) => {
  // 1. Fetch patient
  const patient = await prisma.patient.findUniqueOrThrow({
    where: { email: user?.email },
    select: {
      id: true,
      name: true,
      email: true,
      contactNumber: true,
      address: true,
    },
  });

  // 2. Fetch doctor
  const doctor = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      appointmentFee: true,
    },
  });

  // 3. Check schedule slot
  const slotAvailable = await prisma.doctorSchedules.findFirst({
    where: {
      doctorId: doctor.id,
      scheduleId: payload.scheduleId,
      isBooked: false,
    },
  });

  if (!slotAvailable) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Selected schedule slot is already booked",
    );
  }

  // 4. Transaction: create appointment + payment + lock slot
  const result = await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        scheduleId: payload.scheduleId,
        videoCallingId: uuidv4(),
        status: AppointmentStatus.SCHEDULED,
      },
      select: {
        id: true,
        videoCallingId: true,
        createdAt: true,
      },
    });

    await tx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: doctor.id,
          scheduleId: payload.scheduleId,
        },
      },
      data: {
        isBooked: true,
        appointmentId: appointment.id,
      },
    });

    const payment = await tx.payment.create({
      data: {
        appointmentId: appointment.id,
        amount: doctor.appointmentFee,
        transactionId: uuidv4(),
        gateway: payload.paymentType,
        status: PaymentStatus.UNPAID,
      },
      select: {
        id: true,
        transactionId: true,
        amount: true,
      },
    });

    return {
      appointment,
      payment,
    };
  });

  // 5. Payment Gateway Initiate
  try {
    switch (payload.paymentType) {
      case PaymentGateway.SSLCOMMERZ: {
        const sslResponse = await sslPaymentInit({
          amount: result.payment.amount,
          transactionId: result.payment.transactionId,
          appointmentId: result.appointment.id,
          doctorId: doctor.id,
          doctorName: doctor.name,
          patient: {
            name: patient.name || "Patient",
            email: patient.email,
            phone: patient.contactNumber || "N/A",
            address: patient.address || "N/A",
          },
        });

        return {
          success: true,
          paymentUrl: sslResponse.GatewayPageURL,
          transactionId: result.payment.transactionId,
          appointmentId: result.appointment.id,
        };
      }

      case PaymentGateway.STRIPE: {
        const stripeUrl = await stripeInitiatePayment({
          doctorName: doctor.name,
          amount: result.payment.amount,
          appointmentId: result.appointment.id,
          transactionId: result.payment.transactionId,
          email: patient.email,
          patientName: patient.name || "Patient",
          doctorId: doctor.id,
        });

        return {
          success: true,
          paymentUrl: stripeUrl,
          transactionId: result.payment.transactionId,
          appointmentId: result.appointment.id,
        };
      }

      default:
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid payment gateway");
    }
  } catch (error: any) {
    console.error("Payment initialization failed", {
      appointmentId: result.appointment.id,
      transactionId: result.payment.transactionId,
      error: error.message,
    });

    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Payment initialization failed",
    );
  }
};

const getMyAppointment = async (
  user: IAuthUser,
  filters: any,
  options: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { ...filterData } = filters;

  const andConditions: Prisma.AppointmentWhereInput[] = [];

  if (user?.role === UserRole.PATIENT) {
    andConditions.push({
      patient: {
        email: user?.email,
      },
    });
  } else if (user?.role === UserRole.DOCTOR) {
    andConditions.push({
      doctor: {
        email: user?.email,
      },
    });
  }

  if (Object.keys(filterData).length > 0) {
    const filterConditions = Object.keys(filterData).map((key) => ({
      [key]: {
        equals: (filterData as any)[key],
      },
    }));

    andConditions.push(...filterConditions);
  }

  const whereConditions: Prisma.AppointmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.appointment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include:
      user?.role === UserRole.DOCTOR
        ? {
            patient: true,
            schedule: true,
            prescription: true,
            review: true,
            payment: true,
            doctor: {
              include: {
                doctorSpecialties: {
                  include: {
                    specialities: true,
                  },
                },
              },
            },
          }
        : {
            doctor: {
              include: {
                doctorSpecialties: {
                  include: {
                    specialities: true,
                  },
                },
              },
            },
            schedule: true,
            prescription: true,
            review: true,
            payment: true,
            patient: true,
          },
  });

  const total = await prisma.appointment.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      limit,
      page,
    },
    data: result,
  };
};

// task get all data from db (appointment data) - admin

const updateAppointmentStatus = async (
  appointmentId: string,
  status: AppointmentStatus,
  user: IAuthUser,
) => {
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
    },
    include: {
      doctor: true,
    },
  });

  if (user?.role === UserRole.DOCTOR) {
    if (!(user?.email === appointmentData.doctor.email))
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "This is not your appointment",
      );
  }

  return await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status,
    },
  });
};
const getMyAppointmentById = async (appointmentId: string) => {
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
    },
    include: {
      doctor: {
        include: {
          doctorSpecialties: {
            include: {
              specialities: true,
            },
          },
        },
      },
      patient: true,
      schedule: true,
      prescription: true,
      review: true,
      payment: true,
    },
  });

  return appointmentData;
};

const getAllFromDB = async (filters: any, options: IPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { patientEmail, doctorEmail, ...filterData } = filters;
  const andConditions = [];

  if (patientEmail) {
    andConditions.push({
      patient: {
        email: patientEmail,
      },
    });
  } else if (doctorEmail) {
    andConditions.push({
      doctor: {
        email: doctorEmail,
      },
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => {
        return {
          [key]: {
            equals: (filterData as any)[key],
          },
        };
      }),
    });
  }

  // console.dir(andConditions, { depth: Infinity })
  const whereConditions: Prisma.AppointmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.appointment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            createdAt: "desc",
          },
    include: {
      doctor: {
        include: {
          doctorSpecialties: {
            include: {
              specialities: true,
            },
          },
        },
      },
      patient: true,
      schedule: true,
      prescription: true,
      review: true,
      payment: true,
    },
  });
  const total = await prisma.appointment.count({
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

const cancelUnpaidAppointments = async () => {
  const thirtyMinAgo = new Date(Date.now() - 2 * 60 * 1000);

  const unPaidAppointments = await prisma.appointment.findMany({
    where: {
      createdAt: {
        lte: thirtyMinAgo,
      },
      paymentStatus: PaymentStatus.UNPAID,
    },
    select: {
      id: true,
      doctorId: true,
      scheduleId: true,
    },
  });

  if (unPaidAppointments.length === 0) return;

  const appointmentIdsToCancel = unPaidAppointments.map((a) => a.id);

  await prisma.$transaction(async (tnx) => {
    // 1️⃣ Cancel appointments
    await tnx.appointment.updateMany({
      where: {
        id: { in: appointmentIdsToCancel },
      },
      data: {
        status: AppointmentStatus.CANCELED,
      },
    });

    // 2️⃣ Delete payments
    await tnx.payment.deleteMany({
      where: {
        appointmentId: { in: appointmentIdsToCancel },
      },
    });

    // 3️⃣ Free doctor schedules (🔥 Bulk query)
    await tnx.doctorSchedules.updateMany({
      where: {
        OR: unPaidAppointments.map((a) => ({
          doctorId: a.doctorId,
          scheduleId: a.scheduleId,
        })),
      },
      data: {
        isBooked: false,
      },
    });
  });
};

const createAppointmentWithPayLater = async (user: IAuthUser, payload: any) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
    select: {
      id: true,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false,
    },
    select: {
      id: true,
      appointmentFee: true,
    },
  });

  // 3. Check schedule slot
  const slotAvailable = await prisma.doctorSchedules.findFirst({
    where: {
      doctorId: doctorData.id,
      scheduleId: payload.scheduleId,
      isBooked: false,
    },
  });

  if (!slotAvailable) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Selected schedule slot is already booked",
    );
  }

  const videoCallingId = uuidv4();

  const result = await prisma.$transaction(async (tnx) => {
    const appointmentData = await tnx.appointment.create({
      data: {
        patientId: patientData.id,
        doctorId: doctorData.id,
        scheduleId: payload.scheduleId,
        videoCallingId,
      },
      include: {
        patient: true,
        doctor: true,
        schedule: true,
      },
    });

    await tnx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: doctorData.id,
          scheduleId: payload.scheduleId,
        },
      },
      data: {
        isBooked: true,
      },
    });

    const transactionId = uuidv4();

    await tnx.payment.create({
      data: {
        appointmentId: appointmentData.id,
        amount: doctorData.appointmentFee,
        transactionId,
      },
    });

    return appointmentData;
  });

  return result;
};

const initiatePaymentForAppointment = async (
  appointmentId: string,
  user: IAuthUser,
) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
  });

  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
      patientId: patientData.id,
    },
    include: {
      payment: true,
      doctor: true,
    },
  });

  if (!appointment) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Appointment not found or unauthorized",
    );
  }

  if (appointment.paymentStatus !== PaymentStatus.UNPAID) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment already completed for this appointment",
    );
  }

  if (appointment.status === AppointmentStatus.CANCELED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot pay for cancelled appointment",
    );
  }

  // Create Stripe checkout session

  if (!appointment.payment) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment not found");
  }

  

  const stripeUrl = await stripeInitiatePayment({
    doctorName: appointment.doctor.name,
    amount: appointment.payment.amount,
    appointmentId: appointment.id,
    transactionId: appointment.payment.transactionId,
    email: patientData.email,
    patientName: patientData.name || "Patient",
    doctorId: appointment.doctor.id,
  });
 
  return { paymentUrl: stripeUrl };
};

export const AppointmentService = {
  getMyAppointmentById,
  createAppointment,
  getMyAppointment,
  updateAppointmentStatus,
  getAllFromDB,
  cancelUnpaidAppointments,
  createAppointmentWithPayLater,
  initiatePaymentForAppointment,
};
