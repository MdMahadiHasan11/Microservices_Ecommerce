import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { ProductController } from "./product.controller";
import { ProductValidation } from "./product.validation";

const router: Router = Router();

router.get(
  "/:id",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  // validateRequest(InventoryValidation.InventoryCreateSchema),
  ProductController.getProductById,
);

router.put(
  "/:id",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  validateRequest(ProductValidation.ProductUpdateSchema),
  ProductController.updateProductById,
);
router.post(
  "/",
  //   auth(UserRole.DOCTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  validateRequest(ProductValidation.createProductSchema),
  ProductController.createProduct,
);

router.get("/", ProductController.getProduct);

export const ProductRoutes = router;
