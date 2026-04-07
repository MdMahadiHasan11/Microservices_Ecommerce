import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { orderController } from "./order.controller";
import { OrderValidation } from "./order.validation";

const router: Router = Router();

router.get(
  "/:id",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  // validateRequest(OrderValidation.OrderCreateSchema),
  orderController.getOrderById,
);
router.get(
  "/",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  // validateRequest(OrderValidation.OrderCreateSchema),
  orderController.getAllOrders,
);

router.post(
  "/checkout",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  validateRequest(OrderValidation.OrderCreateSchema),
  orderController.checkout,
);

export const OrderRoutes = router;
