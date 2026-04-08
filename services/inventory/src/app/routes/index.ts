import express from "express";
import { InventoryRoutes } from "../modules/inventory/inventory.routes";

const router: express.Router = express.Router();

const moduleRoutes = [
  {
    path: "/inventories",
    route: InventoryRoutes,
  },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
