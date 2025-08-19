import dotenv from "dotenv";

dotenv.config();

interface EnvVars {
  PORT: string;
  DB_URL: string;
  NODE_ENV: "development" | "production";

  REDIS_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: string;
  REDIS_USERNAME: string;
  REDIS_PASSWORD: string;
}

const loadEnvVariables = (): EnvVars => {
  const requiredEnvVars = [
    "PORT",
    "DB_URL",
    "NODE_ENV",
    "REDIS_URL",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_USERNAME",
    "REDIS_PASSWORD",
  ];

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`Missing environment variable: ${envVar}`);
    }
  });

  return {
    PORT: process.env.PORT as string,
    DB_URL: process.env.DB_URL as string, // ✅ Fixed here
    NODE_ENV: process.env.NODE_ENV as "development" | "production",

    REDIS_URL: process.env.REDIS_URL as string,
    REDIS_HOST: process.env.REDIS_HOST as string,
    REDIS_PORT: process.env.REDIS_PORT as string,
    REDIS_USERNAME: process.env.REDIS_USERNAME as string,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD as string,
  };
};

export const envVars = loadEnvVariables();
