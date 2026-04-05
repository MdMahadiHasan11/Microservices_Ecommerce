
import express, { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AppointmentController } from './appointment.controller';
import { AppointmentValidation } from './appointment.validation';
import { UserRole } from "@prisma/client";
import { paymentLimiter } from '../../middlewares/rateLimiter';
const router: Router = Router();

router.get(
    '/',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    AppointmentController.getAllFromDB
);

router.get(
    '/my-appointment',
    auth(UserRole.PATIENT, UserRole.DOCTOR),
    AppointmentController.getMyAppointment
)
router.get(
    '/my-appointment/:id',
    auth(UserRole.PATIENT, UserRole.DOCTOR),
    AppointmentController.getMyAppointmentById
)
router.post(
    '/',
    auth(UserRole.PATIENT),
    paymentLimiter,
    validateRequest(AppointmentValidation.createAppointment),
    AppointmentController.createAppointment
);

router.post(
    '/pay-later',
    auth(UserRole.PATIENT),
    validateRequest(AppointmentValidation.createAppointmentPayLetter),
    AppointmentController.createAppointmentWithPayLater
);

router.post(
    '/:id/initiate-payment',
    auth(UserRole.PATIENT),
    paymentLimiter,
    AppointmentController.initiatePayment
);

router.patch(
    '/status/:id',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
    AppointmentController.changeAppointmentStatus
);

router.post('/pay-later', auth(UserRole.PATIENT), AppointmentController.createAppointmentWithPayLater);


export const AppointmentRoutes = router;