// utils/dbBackup.js
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createLog } from "../middleware/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup folder
const backupDir = path.join(__dirname, "../backups");

// Ensure folder exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

export const runBackup = async (manual = false, userId = null, ip = null) => {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const backupPath = path.join(backupDir, `backup-${timestamp}.gz`);

    const command = `mongodump --uri="${process.env.MONGO_URI}" --archive="${backupPath}" --gzip`;

    return new Promise((resolve, reject) => {
      exec(command, async (err) => {
        if (err) {
          console.error("Backup error:", err);

          await createLog({
            userId,
            action: manual ? "MANUAL_BACKUP" : "AUTO_BACKUP",
            status: "FAILED",
            ip,
            details: { error: err.message }
          });

          return reject(err);
        }

        await createLog({
          userId,
          action: manual ? "MANUAL_BACKUP" : "AUTO_BACKUP",
          status: "SUCCESS",
          ip,
          details: { file: backupPath }
        });

        resolve(backupPath);
      });
    });

  } catch (err) {
    console.error("Backup failed:", err);
  }
};
