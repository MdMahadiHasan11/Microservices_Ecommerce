import { Request, Response } from "express";
import config from "../../../config";
import { stripe } from "../../helper/stripe";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { PaymentService } from "./payment.service";
import { validateSslPayment } from "../sslCommerz/sslCommerz.service";
import { PaymentGateway } from "@prisma/client";

const handleStripeWebhookEvent = catchAsync(
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = config.stripeWebhookSecret as string;

    if (!webhookSecret) {
      console.error("⚠️ Stripe webhook secret not configured");
      return res.status(500).send("Webhook secret not configured");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    console.log({ event });

    try {
      const result = await PaymentService.handleStripeWebhookEvent(event);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Webhook processed successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("❌ Error processing webhook:", error);
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Webhook received but processing failed",
        data: { error: error.message },
      });
    }
  },
);

const sslSuccess = catchAsync(async (req: Request, res: Response) => {
  const { val_id, tran_id } = req.query;

  if (!tran_id || !val_id) {
    return res.redirect(
      `${config.SSL.SSL_FAIL_FRONTEND_URL}?error=missing_tran_id`,
    );
  }

  const validation = await validateSslPayment(val_id as string);

  if (!validation.valid) {
    return res.redirect(
      `${config.SSL.SSL_FAIL_FRONTEND_URL}?error=invalid_payment`,
    );
  }

  await PaymentService.confirmPayment(
    tran_id as string,
    PaymentGateway.SSLCOMMERZ,
    validation.data,
  );

  res.redirect(
    `${config.SSL.SSL_SUCCESS_FRONTEND_URL}?tran_id=${tran_id}&hasan=`,
  );
});

const sslFail = catchAsync(async (req, res) => {
  res.redirect(config.SSL.SSL_FAIL_FRONTEND_URL);
});

const sslCancel = catchAsync(async (req, res) => {
  res.redirect(config.SSL.SSL_CANCEL_FRONTEND_URL);
});

const sslIpn = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  console.log("sslcommerz ipn url body-------------------------------------------", req.body);
const { tran_id, status, val_id } = payload;

 if (!tran_id || !val_id || !["VALID", "VALIDATED"].includes(status)) {
    return res.status(200).send("OK");
  }
  const validation = await validateSslPayment(val_id);

  if (validation.valid) {
    await PaymentService.confirmPayment(
      tran_id,
      PaymentGateway.SSLCOMMERZ,
      validation.data,
    );
  }

  res.status(200).send("IPN processed");
});
//ssl start

//ssl end

export const PaymentController = {
  handleStripeWebhookEvent,
  sslSuccess,
  sslFail,
  sslCancel,
  sslIpn,
};
