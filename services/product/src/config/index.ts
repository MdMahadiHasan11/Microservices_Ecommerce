import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  inventory_url: process.env.INVENTORY_SERVICES_URL || "http://localhost:4002",
  serviceName: process.env.SERVICE_NAME,
};
