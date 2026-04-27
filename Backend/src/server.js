import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

// Tell the app to use Render's port FIRST, then fallback to your local env port, then 5000
const PORT = process.env.PORT || env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Backend running on port ${PORT}`);
});