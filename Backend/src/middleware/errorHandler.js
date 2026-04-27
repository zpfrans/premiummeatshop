export function notFoundHandler(_req, res) {
  return res.status(404).json({ message: "Not found" });
}

export function errorHandler(error, _req, res, _next) {
  if (error?.code === "ECONNREFUSED") {
    return res.status(503).json({
      message: "Database unavailable. Please start PostgreSQL and try again."
    });
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";
  const details = error.details || undefined;
  return res.status(statusCode).json({ message, details });
}
