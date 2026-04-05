import { PaymentGateway, PaymentStatus } from "@prisma/client";
import Stripe from "stripe";
import prisma from "../../../shared/prisma";
import { fileUploader } from "../../helper/fileUploader";
import { generatePdf, IInvoiceData } from "../../utils/invoice";
import { sendEmail } from "../../utils/sendEmail";

const handleStripeWebhookEvent = async (event: Stripe.Event) => {
  // Check if event has already been processed (idempotency)
  const existingPayment = await prisma.payment.findFirst({
    where: {
      stripeEventId: event.id,
    },
  });

  if (existingPayment) {
    console.log(`⚠️ Event ${event.id} already processed. Skipping.`);
    return { message: "Event already processed" };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;

      const appointmentId = session.metadata?.appointmentId;
      const paymentId = session.metadata?.paymentId;

      if (!appointmentId || !paymentId) {
        console.error("⚠️ Missing metadata in webhook event");
        return { message: "Missing metadata" };
      }

      // Verify appointment exists
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment) {
        console.error(
          `⚠️ Appointment ${appointmentId} not found. Payment may be for expired appointment.`,
        );
        return { message: "Appointment not found" };
      }

      await prisma.$transaction(async (tx) => {
        await tx.appointment.update({
          where: {
            id: appointmentId,
          },
          data: {
            paymentStatus:
              session.payment_status === "paid"
                ? PaymentStatus.PAID
                : PaymentStatus.UNPAID,
          },
        });

        await tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            status:
              session.payment_status === "paid"
                ? PaymentStatus.PAID
                : PaymentStatus.UNPAID,
            gatewayData: session,
            stripeEventId: event.id, // Store event ID for idempotency
          },
        });

        console.log("Database updated successfully");
      });
      setImmediate(async () => {
        try {
          await processInvoiceEmail(session);
        } catch (err) {
          console.error("Background email failed:", err);
        }
      });
      console.log(
        `✅ Payment ${session.payment_status} for appointment ${appointmentId}`,
      );
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as any;
      console.log(`⚠️ Checkout session expired: ${session.id}`);
      // Appointment will be cleaned up by cron job
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as any;
      console.log(`❌ Payment failed: ${paymentIntent.id}`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  return { message: "Webhook processed successfully" };
};


const confirmPayment = async (
  transactionId: string,
  gateway: PaymentGateway,
  gatewayPayload: any,
) => {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { transactionId },
      include: { appointment: true },
    });

    if (!payment) throw new Error('Payment not found');

    if (payment.status === PaymentStatus.PAID) {
      return { alreadyProcessed: true };
    }

    // Basic amount check
    const receivedAmount = Number(gatewayPayload.amount || gatewayPayload.total_amount || 0);
    if (receivedAmount !== payment.amount) {
      throw new Error('Amount mismatch');
    }

    const updateData: any = {
      status: PaymentStatus.PAID,
      gatewayData: gatewayPayload,
      gateway: gateway,
    };

    if (gateway === PaymentGateway.SSLCOMMERZ) {
      updateData.externalId = gatewayPayload.val_id;
    } else if (gateway === PaymentGateway.STRIPE) {
      updateData.externalId = gatewayPayload.payment_intent;
      updateData.stripeEventId = gatewayPayload.id; // for idempotency
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: updateData,
    });

    await tx.appointment.update({
      where: { id: payment.appointmentId },
      data: { paymentStatus: PaymentStatus.PAID },
    });

    // Invoice in background
    setImmediate(async () => {
      try {
        // await sendInvoiceEmail(payment.appointmentId);
      } catch (e) {
        console.error('Invoice sending failed', e);
      }
    });

    return { success: true };
  });
};






const processInvoiceEmail = async (session: any) => {
  const invoiceData: IInvoiceData = {
    bookingDate: new Date(session.created * 1000),
    guestCount: Number(session.metadata?.guestCount) || 0,
    totalAmount: Number(session.amount_total) || 0,
    tourTitle: "Appointment Booking",
    transactionId: session.payment_intent as string,
    userName: session.metadata?.userName || "Customer",
  };

  console.log("Generating PDF...");

  const pdfBuffer = await generatePdf(invoiceData);

  console.log("Uploading to Cloudinary...");

  const cloudinaryResult = await fileUploader.uploadBufferToCloudinary(
    pdfBuffer,
    "invoice",
  );

  if (!cloudinaryResult) {
    throw new Error("Cloudinary upload failed");
  }

  console.log("Sending email...");

  await sendEmail({
    to: "hasanpustcse11@gmail.com",
    subject: "Your Booking Invoice",
    templateName: "invoice",
    templateData: {
      ...invoiceData,
      invoiceUrl: cloudinaryResult.secure_url,
    },
    attachments: [
      {
        filename: "invoice.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  console.log("Invoice email sent successfully");
};

export const PaymentService = {
  handleStripeWebhookEvent,
  confirmPayment,
};
