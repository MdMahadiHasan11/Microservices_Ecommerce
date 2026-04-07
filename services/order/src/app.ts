import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";

import router from "./app/routes";
import config from "./config";

const app: Application = express();

app.use(cookieParser());

app.use(cors({ origin: "*", credentials: true }));

//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send({
    message: `${config.serviceName} Server is running..`,
    environment: config.env,
    uptime: process.uptime().toFixed(2) + " sec",
    timeStamp: new Date().toISOString(),
  });
});

app.use("/api/v1", router);
// app.use("/api/v1", verifyCaller, router);
app.use(globalErrorHandler);
app.use(notFound);

export default app;
