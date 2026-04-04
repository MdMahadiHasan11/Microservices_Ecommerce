import Stripe from 'stripe';
import httpStatus from 'http-status';
import ApiError from '../errors/ApiError';
import config from '../../config';

export const stripe = new Stripe(config.stripeSecretKey as string, {
  apiVersion: "2026-01-28.clover",
});

export const stripeInitiatePayment = async (payload: {
  doctorName: string;
  amount: number;           // in BDT (whole Taka, e.g. 1500)
  appointmentId: string;
  transactionId: string;    // ← use your UUID transactionId consistently
  email: string;
  patientName?: string;     // optional – nice to have
  doctorId?: string;       // optional – if you want to store doctor info in metadata
}) => {
  try {
    // Safety checks
    if (!payload.amount || payload.amount <= 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid appointment amount');
    }

    if (!payload.email || !payload.email.includes('@')) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Valid email is required for Stripe');
    }
    const amountBDT = Math.round(payload.amount); // rough example – use real exchange rate
    const currency = 'bdt'; // or 'inr', 'eur' – whatever your Stripe account supports

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],

      mode: 'payment',

      customer_email: payload.email,

      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Appointment with Dr. ${payload.doctorName}`,
              description: `Online consultation.`,
            },
            unit_amount: amountBDT * 100, // Stripe expects amount in smallest unit (cents)
          },
          quantity: 1,
        },
      ],

      // Very important – use transactionId consistently
      metadata: {
        appointmentId: payload.appointmentId,
        transactionId: payload.transactionId,     // ← this is what you should look for in webhook
        patientName: payload.patientName || 'Patient',
        
        doctorName: payload.doctorName,
        originalAmountBDT: payload.amount.toString(),
      },

      // Do NOT trust success_url query params for confirmation!
      // Use webhook instead.
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/my-appointments?status=cancelled`,

   
      // Optional but recommended
      client_reference_id: payload.transactionId,
      invoice_creation: { enabled: true }, // auto-generate Stripe invoice

      // If you want to store more data in the payment intent
      payment_intent_data: {
        metadata: {
          transactionId: payload.transactionId,
          appointmentId: payload.appointmentId,
        },
      },
    });

    if (!session.url) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create Stripe session');
    }

    return session.url;
  } catch (error: any) {
    console.error('[Stripe Initiate Error]', error);
    throw new ApiError(
      error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to initialize Stripe payment',
    );
  }
};