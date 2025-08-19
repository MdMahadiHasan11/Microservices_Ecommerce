// Import required modules and types
import express, { Application, Request, Response } from "express";
import cors from "cors";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import cookieParser from "cookie-parser";
import passport from "passport";
import expressSession from "express-session";
import "./config/passport"; // Passport configuration
import { envVars } from "./config/env";
import { router } from "./app/routes";

// Initialize Express application
const app: Application = express();

// Configure session middleware for user session management
app.use(
  expressSession({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false, // Prevents resaving session if unmodified
    saveUninitialized: false, // Prevents saving uninitialized sessions
  })
);

// Initialize Passport for authentication
app.use(passport.initialize());

// Enable persistent login sessions with Passport
app.use(passport.session());

// Parse incoming JSON request bodies
app.use(express.json());

// Parse cookies attached to client requests
app.use(cookieParser());

// Parse URL-encoded request bodies (e.g., form submissions)
app.use(express.urlencoded({ extended: true }));

// Enable trust proxy for handling reverse proxies (e.g., behind nginx)
app.set("trust proxy", 1);

// Configure CORS to allow requests from the specified frontend URL
app.use(
  cors({
    origin: envVars.FRONTEND_URL, // Allow requests from this origin
    credentials: true, // Allow cookies to be sent with requests
  })
);

app.use("/api/v1", router);

// Define root route for basic server status check
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome, Auth-Service is running!");
});

// Handle 404 errors for undefined routes
app.use(notFound);

// Handle all errors globally with custom error middleware
app.use(globalErrorHandler);

// Export the configured Express app
export default app;
