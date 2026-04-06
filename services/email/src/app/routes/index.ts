import express from "express";
import { emailRoutes } from "../modules/user/email.routes";
// import { userRoutes } from "../modules/user/user.routes";

const router: express.Router = express.Router();

const moduleRoutes = [
  {
    path: "/email",
    route: emailRoutes,
  },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
