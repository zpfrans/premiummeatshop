import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { spawn } from "child_process";

// Run migrations on startup (production only)
async function runMigrations() {
  if (env.NODE_ENV === "production") {
    logger.info("Running database migrations...");
    return new Promise((resolve, reject) => {
      const migrate = spawn("node-pg-migrate", ["up", "-m", "migrations"], {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: env.DATABASE_URL }
      });
      
      migrate.on("close", (code) => {
        if (code === 0) {
          logger.info("Migrations completed successfully");
          resolve();
        } else {
          logger.error(`Migrations failed with code ${code}`);
          reject(new Error(`Migrations failed`));
        }
      });
    });
  }
}

// Tell the app to use Render's port FIRST, then fallback to your local env port, then 5000
const PORT = process.env.PORT || env.PORT || 5000;

// Run migrations before starting server
runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Backend running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error("Failed to start server:", error);
    process.exit(1);
  });