import { Router } from "express";
import { PaymentController } from "./payment.controller";

const router: Router = Router();

router.post('/ssl/success', PaymentController.sslSuccess);


router.post('/ssl/fail',    PaymentController.sslFail);


router.post('/ssl/cancel',  PaymentController.sslCancel);


router.post('/ssl/ipn',PaymentController.sslIpn);
//ssl end

export const PaymentRoutes = router;
