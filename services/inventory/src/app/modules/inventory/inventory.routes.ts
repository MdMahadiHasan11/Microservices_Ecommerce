import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { InventoryController } from "./inventory.controller";
import { InventoryValidation } from "./inventory.validation";

const router: Router = Router();
router.patch(
  "/:id",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  validateRequest(InventoryValidation.InventoryUpdateSchema),
  InventoryController.updateInventory,
);
router.post(
  "/",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  validateRequest(InventoryValidation.InventoryCreateSchema),
  InventoryController.createInventory,
);
router.get(
  "/:id",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  // validateRequest(InventoryValidation.InventoryCreateSchema),
  InventoryController.getInventoryById,
);

export const InventoryRoutes = router;
