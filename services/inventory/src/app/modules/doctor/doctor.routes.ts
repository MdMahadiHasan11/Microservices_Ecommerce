import { Router } from "express";
// import { UserRole } from "../../../generated/prisma/enums";
import auth from "../../middlewares/auth";
import { DoctorController } from "./doctor.controller";
import { DoctorValidation } from "./doctor.validation";
import validateRequest from "../../middlewares/validateRequest";
import { UserRole } from "@prisma/client";
const router: Router = Router();
// AI driven doctor suggestion
router.post('/suggestion', DoctorController.getAiSuggestion);

router.get('/', DoctorController.getAllFromDB);
router.get('/:id', DoctorController.getByIdFromDB);

router.get('/schedule/:id', DoctorController.getPatientsAvailableSchedule );

router.patch(
    '/:id',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
    validateRequest(DoctorValidation.update),
    DoctorController.updateIntoDB
);
router.delete(
    '/:id',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    DoctorController.deleteFromDB
);

router.delete(
    '/soft/:id',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    DoctorController.softDelete);

export const DoctorRoutes = router;
