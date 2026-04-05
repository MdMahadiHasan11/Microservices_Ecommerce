import { z } from "zod";

const PaymentGatewayEnum = z.enum([
  "STRIPE",
  "SSLCOMMERZ",
  "BKASH",
  "NAGAD",
  "ROCKET",
  "UPAY",
]);

const createAppointment = z.object({
  body: z.object({
    doctorId: z.string({
      error: "Doctor Id is required!",
    }),

    scheduleId: z.string({
      error: "Doctor schedule id is required!",
    }),

    paymentType: PaymentGatewayEnum,
  }),
});

const createAppointmentPayLetter = z.object({
  body: z.object({
    doctorId: z.string({
      error: "Doctor Id is required!",
    }),

    scheduleId: z.string({
      error: "Doctor schedule id is required!",
    }),
  }),
});

export const AppointmentValidation = {
  createAppointment,
  createAppointmentPayLetter
};