import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { InventoryController } from "./inventory.controller";
import { InventoryValidation } from "./inventory.validation";

const router: Router = Router();
router.put(
  "/:id",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  validateRequest(InventoryValidation.InventoryUpdateSchema),
  InventoryController.updateInventory,
);

router.get(
  "/:id",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  // validateRequest(InventoryValidation.InventoryCreateSchema),
  InventoryController.getInventoryById,
);

router.get(
  "/:id/details",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  // validateRequest(InventoryValidation.InventoryCreateSchema),
  InventoryController.getInventoryDetailsById,
);
router.post(
  "/",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  validateRequest(InventoryValidation.InventoryCreateSchema),
  InventoryController.createInventory,
);

export const InventoryRoutes = router;
