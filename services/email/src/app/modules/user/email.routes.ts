import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { emailController } from "./email.controller";
import { emailValidation } from "./email.validation";
// import { UserRole } from "@prisma/client";
const router: Router = Router();

router.post(
  "/send",
  validateRequest(emailValidation.CreateEmailSchema),
  emailController.sentEmail,
);
router.get("/get", emailController.getEmail);

export const emailRoutes = router;
