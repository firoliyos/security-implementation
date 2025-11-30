import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

// Enable automatic backup cron
import "./cron/backupCron.js";
import backupRoutes from "./routes/backupRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use("/api/logs", logRoutes);
app.use("/api/backups", backupRoutes);
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes

app.use("/api/auth", authRoutes);
app.use("/api/leave", leaveRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
