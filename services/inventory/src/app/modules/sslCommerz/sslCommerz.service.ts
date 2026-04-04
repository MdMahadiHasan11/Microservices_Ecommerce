// src/services/ssl.service.ts

import axios from "axios";
import qs from "qs";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../errors/ApiError";

export const sslPaymentInit = async (payload: {
  amount: number;
  transactionId: string;
  appointmentId: string;
  doctorId?: string;
  doctorName?: string;
  patient: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
}) => {
  const data = {
    store_id: config.SSL.STORE_ID,
    store_passwd: config.SSL.STORE_PASS,
    total_amount: Number(payload.amount).toFixed(2),
    currency: "BDT",
    tran_id: payload.transactionId,

    success_url: `${config.SSL.SSL_SUCCESS_BACKEND_URL}?tran_id=${encodeURIComponent(payload.transactionId)}`,
    fail_url: `${config.SSL.SSL_FAIL_BACKEND_URL}?tran_id=${encodeURIComponent(payload.transactionId)}`,
    cancel_url: `${config.SSL.SSL_CANCEL_BACKEND_URL}?tran_id=${encodeURIComponent(payload.transactionId)}`,
    ipn_url: config.SSL.SSL_IPN_URL,
    shipping_method: "NO",
    num_of_item: 1,
    product_name: `Appointment with Dr. ${payload.doctorName || "Doctor"}`,
    product_category: "Healthcare Service",
    product_profile: "general",

    cus_name: payload.patient.name || "Patient",
    cus_email: payload.patient.email || "no-reply@domain.com",
    cus_add1: payload.patient.address || "N/A",
    cus_add2: "N/A",
    cus_city: "Dhaka",
    cus_state: "Dhaka",
    cus_postcode: "1200",
    cus_country: "Bangladesh",
    cus_phone: payload.patient.phone || "01500000000",

    value_a: payload.appointmentId,
    value_b: "appointment",
    value_c: payload.doctorId || "",
    value_d: "healthcare",
  };

  try {
    const response = await axios({
      method: "POST",
      url: config.SSL.SSL_PAYMENT_API,
      data: qs.stringify(data),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!response.data?.GatewayPageURL) {
      throw new ApiError(httpStatus.BAD_REQUEST, "SSLCommerz init failed");
    }

    return response.data;
  } catch (err: any) {
    console.error("SSL init error:", err.response?.data || err.message);
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment gateway error");
  }
};

// export const validateSslPayment = async (tran_id: string) => {
//   try {
//     const params = {
//       tran_id,
//       store_id: config.SSL.STORE_ID,
//       store_passwd: config.SSL.STORE_PASS,
//       format: "json",
//     };

//     const response = await axios.get(
//       `${config.SSL.SSL_VALIDATION_API}?${qs.stringify(params)}`,
//     );
//     console.log("SSL VALIDATION RESPONSE:", {
//       tran_id,
//       fullResponse: response.data,
//       status: response.data?.status,
//       msg: response.data?.msg || response.data?.failedreason,
//     });

//     const { data } = response;

//     if (data.status !== "VALID" && data.status !== "VALIDATED") {
//       return { valid: false, data };
//     }

//     return { valid: true, data };
//   } catch (err: any) {
//     console.error("SSL validation failed:", err);
//     return { valid: false, error: err.message };
//   }
// };
export const validateSslPayment = async (val_id: string) => {
  try {
    const params = {
      val_id, // 🔥 change here
      store_id: config.SSL.STORE_ID,
      store_passwd: config.SSL.STORE_PASS,
      format: "json",
    };

    const response = await axios.get(
      config.SSL.SSL_VALIDATION_API,
      { params }   // better than qs stringify
    );

    const data = response.data;

    console.log("SSL VALIDATION:", data);

    if (data.status !== "VALID" && data.status !== "VALIDATED") {
      return { valid: false, data };
    }

    return { valid: true, data };
  } catch (err: any) {
    console.error("SSL validation failed:", err);
    return { valid: false, error: err.message };
  }
};