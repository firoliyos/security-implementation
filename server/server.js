import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";

// Routes (ensure these files exist in your project)
import authRoutes from "./routes/authRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import backupRoutes from "./routes/backupRoutes.js";

// Middlewares
import { logResponse } from "./middleware/logger.js";

const app = express();

// Basic app config
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || "development";
const TRUST_PROXY = process.env.TRUST_PROXY === "true";

// (Optional) trust proxy if behind load balancer / reverse proxy
if (TRUST_PROXY) app.set("trust proxy", 1);

// Connect to DB
connectDB().catch((err) => {
  console.error("Failed to connect DB on startup:", err);
  process.exit(1);
});

// Security + parsing middlewares
app.use(helmet());
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging + rate limiter
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Response-logging middleware (writes to DB via your middleware/logger.js)
app.use(logResponse);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/backups", backupRoutes);

// Healthcheck
app.get("/api/health", (req, res) => res.json({ status: "ok", env: NODE_ENV }));

// Centralized error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  // Don't leak stack traces in production
  const payload =
    NODE_ENV === "production"
      ? { message: "Internal server error" }
      : { message: err.message, stack: err.stack };
  res.status(err.status || 500).json(payload);
});

// Start server with graceful shutdown
const server = app.listen(PORT, () =>
  console.log(`Server listening on port ${PORT} (env: ${NODE_ENV})`)
);

const graceful = async () => {
  console.log("Shutting down gracefully...");
  server.close(() => {
    console.log("HTTP server closed");
    // Close DB connection if needed (mongoose)
    import("mongoose")
      .then(({ default: mongoose }) => mongoose.disconnect())
      .then(() => {
        console.log("MongoDB disconnected");
        process.exit(0);
      })
      .catch((e) => {
        console.error("Error during shutdown:", e);
        process.exit(1);
      });
  });

  // Force exit after timeout
  setTimeout(() => {
    console.warn("Forcing shutdown");
    process.exit(1);
  }, 30_000);
};

process.on("SIGTERM", graceful);
process.on("SIGINT", graceful);

export default app;
