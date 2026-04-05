import express from "express";
import { configureRoutes } from "../../config/configure-routes";
import config from "../../routes.config.json";

const router = express.Router();

// API Gateway routes configure করা
configureRoutes(router, config);

export default router;
