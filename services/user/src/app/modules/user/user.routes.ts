import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { userController } from "./user.controller";
import { userValidation } from "./user.validation";
// import { UserRole } from "@prisma/client";
const router: Router = Router();

router.get("/:id", userController.getUserById);

router.post(
  "/create-user",
  validateRequest(userValidation.CreateUserSchema),
  userController.createUser,
);

export const userRoutes = router;
