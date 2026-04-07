import { Server } from "http";
import app from "./app";
import config from "./config";

let server: Server | undefined;
const port = process.env.PORT || config.port;

async function bootstrap() {
  try {
    console.log("🚀 Starting application...");

    // এখানে কোনো ডাটাবেস বা সিডিং নেই

    server = app.listen(port, () => {
      console.log(
        `✅${config.service_name} Server is running on: http://localhost:${port}`,
      );
    });
  } catch (err) {
    console.error("❌ Failed to start the application:", err);
    process.exit(1);
  }
}

// Graceful Shutdown (সুন্দর করে সার্ভার বন্ধ করা)
const gracefulShutdown = (signal: string) => async () => {
  console.log(`\n${signal} received → Starting graceful shutdown...`);

  const shutdownTimeout = setTimeout(() => {
    console.error("Graceful shutdown timed out → Force exiting");
    process.exit(1);
  }, 10000);

  try {
    if (server) {
      console.log("Stopping HTTP server...");
      await new Promise<void>((resolve) => {
        server!.close(() => {
          console.log("HTTP server closed successfully.");
          resolve();
        });
      });
    }

    console.log("✅ All resources cleaned up.");
    clearTimeout(shutdownTimeout);
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
};

// সার্ভার বন্ধ করার সিগন্যাল
process.on("SIGTERM", gracefulShutdown("SIGTERM"));
process.on("SIGINT", gracefulShutdown("SIGINT"));

// এরর হ্যান্ডলার
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection")();
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  gracefulShutdown("uncaughtException")();
});

// অ্যাপ্লিকেশন শুরু করা
bootstrap();
