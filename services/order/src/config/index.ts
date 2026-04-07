import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  serviceName: process.env.SERVICE_NAME,
  product_service_url: process.env.PRODUCT_SERVICE_URL,
  cart_service_url: process.env.CART_SERVICE_URL,
  email_service_url: process.env.EMAIL_SERVICE_URL,
};
