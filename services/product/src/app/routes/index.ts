import express from "express";
import { AdminRoutes } from "../modules/admin/admin.routes";
import { AppointmentRoutes } from "../modules/appointment/appointment.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { DoctorRoutes } from "../modules/doctor/doctor.routes";
import { doctorScheduleRoutes } from "../modules/doctorSchedule/doctorSchedule.routes";

import { MetaRoutes } from "../modules/meta/meta.routes";
import { PatientRoutes } from "../modules/patient/patient.routes";
import { PaymentRoutes } from "../modules/payment/payment.routes";
import { PrescriptionRoutes } from "../modules/prescription/prescription.routes";
import { ProductRoutes } from "../modules/product/product.routes";
import { ReviewRoutes } from "../modules/review/review.routes";
import { ScheduleRoutes } from "../modules/schedule/schedule.routes";
import { SpecialtiesRoutes } from "../modules/specialties/specialties.routes";
import { userRoutes } from "../modules/user/user.routes";

const router: express.Router = express.Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/specialties",
    route: SpecialtiesRoutes,
  },
  {
    path: "/doctor",
    route: DoctorRoutes,
  },
  {
    path: "/patient",
    route: PatientRoutes,
  },
  {
    path: "/schedule",
    route: ScheduleRoutes,
  },
  {
    path: "/doctor-schedule",
    route: doctorScheduleRoutes,
  },
  {
    path: "/appointment",
    route: AppointmentRoutes,
  },
  {
    path: "/payment",
    route: PaymentRoutes,
  },
  {
    path: "/prescription",
    route: PrescriptionRoutes,
  },
  {
    path: "/review",
    route: ReviewRoutes,
  },
  {
    path: "/meta",
    route: MetaRoutes,
  },
  {
    path: "/products",
    route: ProductRoutes,
  },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
