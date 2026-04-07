import express from "express";
import { cartRoutes } from "../modules/cart/cart.routes";

const router: express.Router = express.Router();

const moduleRoutes = [
  {
    path: "/cart",
    route: cartRoutes,
  },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
