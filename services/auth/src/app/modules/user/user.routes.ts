import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { userController } from "./user.controller";
import { userValidation } from "./user.validation";
// import { UserRole } from "@prisma/client";
const router: Router = Router();

router.post(
  "/registration",
  validateRequest(userValidation.CreateUserSchema),
  userController.createUser,
);
router.post(
  "/login",
  validateRequest(userValidation.LoginSchema),
  userController.loginUser,
);

router.post(
  "/verify-token",
  validateRequest(userValidation.VerifyTokenSchema),
  userController.verifyAccessToken,
);

router.post(
  "/verify-email",
  validateRequest(userValidation.verifyEmailSchema),
  userController.verifyEmail,
);

export const userRoutes = router;
