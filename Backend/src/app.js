import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { runQuery } from "./db/pool.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRateLimiter, writeRateLimiter } from "./middleware/rateLimiters.js";
import authRoutes from "./modules/auth/auth.routes.js";
import productsRoutes from "./modules/products/products.routes.js";
import ordersRoutes from "./modules/orders/orders.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import expensesRoutes from "./modules/expenses/expenses.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

export const app = express();
app.set("trust proxy", env.TRUST_PROXY);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is in the explicit list
      if (env.frontendOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow all Vercel preview URLs (*.vercel.app)
      if (origin.includes(".vercel.app")) {
        return callback(null, true);
      }
      
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(`/${env.UPLOAD_DIR}`, express.static(env.UPLOAD_DIR));
app.use(
  pinoHttp({
    logger
  })
);

app.get("/api/health", async (_req, res) => {
  try {
    await runQuery("SELECT 1");
    return res.json({ status: "ok", database: "connected" });
  } catch (error) {
    logger.error({ error }, "Health check failed: database unavailable");
    return res.status(503).json({
      status: "degraded",
      database: "disconnected",
      message: "API is up but database is unavailable"
    });
  }
});

app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", writeRateLimiter, ordersRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
