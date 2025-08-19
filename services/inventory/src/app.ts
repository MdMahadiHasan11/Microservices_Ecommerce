import express, { Application, Request, Response } from "express";
import cors from "cors";
import { envVars } from "./config/env";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import morgan from "morgan";

const app: Application = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);

app.use(cors());
app.use(morgan("dev"));

// Root route
app.get("/health", (req: Request, res: Response) => {
  res.send("Welcome, Inventory services is running!");
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
