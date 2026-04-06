import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  serviceName: process.env.SERVICE_NAME,
  smtp: {
    default_email_sender: process.env.DEFAULT_EMAIL_SENDER,
    smtp_host: process.env.SMTP_HOST,
    smtp_port: process.env.SMTP_PORT,
  },
};
