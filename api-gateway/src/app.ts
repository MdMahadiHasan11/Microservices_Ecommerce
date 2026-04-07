import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { apiLimiter } from "./app/middlewares/rateLimiter";
import router from "./app/routes";
import config from "./config";

const app: Application = express();

app.use(helmet());
app.use(cookieParser());

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "API Gateway Server is running..",
    environment: config.env,
    uptime: process.uptime().toFixed(2) + " sec",
    timeStamp: new Date().toISOString(),
  });
});

// Rate limiter + Routes
app.use("/api", apiLimiter);
app.use("/gateway", router);

app.use(morgan("dev"));

app.use(globalErrorHandler);
app.use(notFound);

export default app;
