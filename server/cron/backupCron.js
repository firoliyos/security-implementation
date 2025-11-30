// cron/backupCron.js
import cron from "node-cron";
import { runBackup } from "../utils/dbBackup.js";

// Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running automatic backup...");
  await runBackup(false, null, "SYSTEM");
});
