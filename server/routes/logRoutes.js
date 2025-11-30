// routes/logRoutes.js
import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { checkRole } from "../middleware/roleMiddleware.js";
import { getLogs, deleteAllLogs } from "../controllers/logController.js";

const router = express.Router();

// Only Admin can access logs
router.use(requireAuth, checkRole(["Admin"]));

router.get("/", getLogs);  // view logs
router.delete("/", deleteAllLogs);  // clear logs (optional)

export default router;
