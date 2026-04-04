import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { ScheduleController } from "./schedule.controller";
const router: Router = Router();
router.get(
    '/',
    auth(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    ScheduleController.getAllFromDB
);

router.get(
    '/doctor',
    auth(UserRole.DOCTOR),
    ScheduleController.getAllDoctorScheduleFromDB
);

router.get(
    '/:id',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
    ScheduleController.getByIdFromDB
);

router.post(
    '/',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    ScheduleController.insertIntoDB
);

router.delete(
    '/:id',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    ScheduleController.deleteFromDB
);
export const ScheduleRoutes = router;
