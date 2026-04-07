import express from "express";
import { OrderRoutes } from "../modules/order/order.routes";

const router: express.Router = express.Router();

const moduleRoutes = [
  {
    path: "/order",
    route: OrderRoutes,
  },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
