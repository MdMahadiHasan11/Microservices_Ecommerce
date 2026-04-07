import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  service_name: process.env.SERVICE_NAME,
  inventory_service_url: process.env.INVENTORY_SERVICE_URL,
  redis: {
    redis_port: process.env.REDIS_PORT,
    redis_host: process.env.REDIS_HOST,
    cart_ttl: process.env.CART_TTL,
  },
};
