import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { CartController } from "./cart.controller";
import { CartValidation } from "./cart.validation";

const router: Router = Router();
router.post(
  "/add-to-cart",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  validateRequest(CartValidation.CartItemSchema),
  CartController.addToCart,
);
router.get(
  "/get-my-cart",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  // validateRequest(CartValidation.CartItemSchema),
  CartController.getMyCart,
);
router.get(
  "/clear-to-cart",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  // validateRequest(CartValidation.CartItemSchema),
  CartController.cleatToCart,
);

export const cartRoutes = router;
