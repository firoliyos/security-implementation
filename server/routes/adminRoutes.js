// routes/adminRoutes.js
import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { checkRole } from "../middleware/roleMiddleware.js";

import {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserDepartment,
  toggleActiveStatus,
  unlockAccount,
  deleteUser
} from "../controllers/adminController.js";

const router = express.Router();

// ADMIN ONLY ROUTES
router.use(requireAuth, checkRole(["Admin"]));

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id/role", updateUserRole);
router.put("/:id/department", updateUserDepartment);
router.put("/:id/toggle-active", toggleActiveStatus);
router.put("/:id/unlock", unlockAccount);
router.delete("/:id", deleteUser);

export default router;
