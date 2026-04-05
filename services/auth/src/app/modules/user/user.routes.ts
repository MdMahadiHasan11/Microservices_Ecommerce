import { NextFunction, Request, Response, Router } from "express";
// import { UserRole } from "../../../generated/prisma/enums";
// import { fileUploader } from "../../helper/fileUploader";
import auth from "../../middlewares/auth";
import { userController } from "./user.controller";
import { userValidation } from "./user.validation";
import validateRequest from "../../middlewares/validateRequest";
// import { UserRole } from "@prisma/client";
const router: Router = Router();


router.get(
    "/:id",
    userController.getUserById)

router.post(
    "/create-user",
     validateRequest(userValidation.CreateUserSchema),
    userController.createUser

);


export const userRoutes = router;
