import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  FRONTEND_ORIGINS: z.string().optional(),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(5),
  UPLOAD_DIR: z.string().default("uploads"),
  TRUST_PROXY: z.coerce.number().default(1),
  ADMIN_SEED_USERNAME: z.string().default("admin"),
  ADMIN_SEED_PASSWORD: z.string().default("admin123")
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const frontendOrigins = parsed.data.FRONTEND_ORIGINS
  ? parsed.data.FRONTEND_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [parsed.data.FRONTEND_ORIGIN];

export const env = {
  ...parsed.data,
  frontendOrigins
};
