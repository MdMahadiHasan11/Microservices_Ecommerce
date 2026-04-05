import { Router } from "express";
import auth from "../../middlewares/auth";
import { AuthController } from "./auth.controller";
// import { UserRole } from "../../../generated/prisma/enums";
import { UserRole } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import passport from "passport";
import config from "../../../config";
import { authLimiter } from "../../middlewares/rateLimiter";

const router: Router = Router();

router.post("/login", authLimiter, AuthController.loginUser);

router.get(
  "/google",
  async (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/";

    passport.authenticate("google", {
      scope: ["email", "profile"],
      // prompt: "select_account",
      // prompt: "consent",
      state: redirect as string,
    })(req, res, next);
  },
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false, // 🔥 VERY IMPORTANT
    failureRedirect: `${config.frontendUrl}/login?error=Google login failed`,
  }),
  AuthController.googleCallBack,
);

router.post("/refresh-token", AuthController.refreshToken);

router.post(
  "/change-password",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  AuthController.changePassword,
);

router.post(
  "/set-password",
  auth(UserRole.PATIENT),
  AuthController.setPassword,
);

router.post("/forgot-password", AuthController.forgotPassword);

router.post(
  "/reset-password",
  (req: Request, res: Response, next: NextFunction) => {
    //user is resetting password without token and logged in newly created admin or doctor
    if (!req.headers.authorization && req.cookies.accessToken) {
      console.log(req.headers.authorization, "from reset password route guard");
      console.log(req.cookies.accessToken, "from reset password route guard");
      auth(
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
        UserRole.DOCTOR,
        UserRole.PATIENT,
      )(req, res, next);
    } else {
      //user is resetting password via email link with token
      next();
    }
  },
  AuthController.resetPassword,
);

router.get("/me", AuthController.getMe);

export const authRoutes = router;
