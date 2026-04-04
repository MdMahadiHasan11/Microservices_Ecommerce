import { NextFunction, Request, Response, Router } from "express";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../helper/fileUploader";
import auth from "../../middlewares/auth";
import { SpecialtiesController } from "./specialties.controller";
import { SpecialtiesValidtaion } from "./specialties.validation";

const router: Router = Router();
router.get(
    '/',
    SpecialtiesController.getAllFromDB
);

router.post(
    '/',
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = SpecialtiesValidtaion.create.parse(JSON.parse(req.body.data))
        return SpecialtiesController.insertIntoDB(req, res, next)
    }
);

router.delete(
    '/:id',
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    SpecialtiesController.deleteFromDB
);

export const SpecialtiesRoutes = router;