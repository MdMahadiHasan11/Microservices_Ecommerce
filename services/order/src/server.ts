import { Server } from "http";
import app from "./app";
import config from "./config";
let server: Server | undefined;

const port = process.env.PORT || config.port || 5000;

async function bootstrap() {
  try {
    console.log("🚀 Starting application...");

    console.log("🌱 Seeding super admin...");

    // ৩. start server
    server = app.listen(port, () => {
      console.log(
        `✅ ${config.serviceName} Server running → http://localhost:${port}`,
      );
    });
  } catch (err) {
    console.error("❌ Failed to start application:", err);
    process.exit(1);
  }
}

// Graceful shutdown logic
const gracefulShutdown = (signal: string) => async () => {
  console.log(`\n${signal} received → Initiating graceful shutdown...`);

  const shutdownTimeout = setTimeout(() => {
    console.error("Graceful shutdown timed out → Force exiting");
    process.exit(1);
  }, 10000);

  try {
    if (server) {
      console.log("Stopping HTTP server (no new connections)...");
      await new Promise<void>((resolve) => {
        server!.close(() => {
          console.log("HTTP server closed successfully.");
          resolve();
        });
      });
    }
    // await closeDB();
    // await closeRedis();

    console.log("All resources cleaned up ✓");
    clearTimeout(shutdownTimeout);
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
};

// Signals handlers
process.on("SIGTERM", gracefulShutdown("SIGTERM"));
process.on("SIGINT", gracefulShutdown("SIGINT")); // Ctrl+C

// Global error handlers (safety net)
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection")();
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  gracefulShutdown("uncaughtException")();
});

bootstrap();
