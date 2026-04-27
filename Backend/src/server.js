import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { execSync } from "child_process";

// Run migrations on startup (production only)
function runMigrations() {
  if (env.NODE_ENV === "production") {
    try {
      logger.info("Running database migrations...");
      execSync("npx node-pg-migrate up -m migrations", {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: env.DATABASE_URL }
      });
      logger.info("Migrations completed successfully");
    } catch (error) {
      logger.error("Migrations failed:", error.message);
      throw error;
    }
  }
}

// Run seed on startup (production only)
function runSeed() {
  if (env.NODE_ENV === "production") {
    try {
      logger.info("Seeding database...");
      execSync("npx node scripts/seed.js", {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: env.DATABASE_URL }
      });
      logger.info("Database seeded successfully");
    } catch (error) {
      // Don't fail if seed fails (might be already seeded)
      logger.warn("Seed completed with message:", error.message);
    }
  }
}

// Tell the app to use Render's port FIRST, then fallback to your local env port, then 5000
const PORT = process.env.PORT || env.PORT || 5000;

// Run migrations and seed before starting server
try {
  runMigrations();
  runSeed();
  app.listen(PORT, () => {
    logger.info(`Backend running on port ${PORT}`);
  });
} catch (error) {
  logger.error("Failed to start server:", error);
  process.exit(1);
}