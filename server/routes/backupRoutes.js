// routes/backupRoutes.js
import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { checkRole } from "../middleware/roleMiddleware.js";
import { runBackup } from "../utils/dbBackup.js";

const router = express.Router();

router.post(
  "/manual",
  requireAuth,
  checkRole(["Admin"]),
  async (req, res) => {
    try {
      const file = await runBackup(true, req.user.id, req.ip);
      return res.json({ message: "Backup completed", file });
    } catch (err) {
      return res.status(500).json({ message: "Backup failed" });
    }
  }
);

export default router;
