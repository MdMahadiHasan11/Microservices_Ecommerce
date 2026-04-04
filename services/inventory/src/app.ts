import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import cron from "node-cron";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { AppointmentService } from "./app/modules/appointment/appointment.service";
import { PaymentController } from "./app/modules/payment/payment.controller";
import router from "./app/routes";
import config from "./config";
import "./config/passport";
import passport from "passport";
const app: Application = express();

app.use(passport.initialize());
// app.use(passport.session());
app.use(cookieParser());
app.post(
  "/api/v1/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleStripeWebhookEvent,
);
// const allowedOrigins = [
//   "http://localhost:3000",
//   "https://edoccarebd.vercel.app",
//   "https://securepay.sslcommerz.com",
//   "https://sandbox.sslcommerz.com",
// ];
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   }),
// );
app.use(cors({ origin: '*', credentials: true }));
//perser
//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

cron.schedule("*/5 * * * *", () => {
  try {
    console.log("Node cron called at ", new Date());
    AppointmentService.cancelUnpaidAppointments();
  } catch (err) {
    console.error(err);
  }
});

app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "Server is running..",
    environment: config.env,
    uptime: process.uptime().toFixed(2) + " sec",
    timeStamp: new Date().toISOString(),
  });
});

app.use("/api/v1", router);
app.use(globalErrorHandler);
app.use(notFound);

export default app;
