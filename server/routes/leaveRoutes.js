// routes/leaveRoutes.js
import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { checkRole } from "../middleware/roleMiddleware.js";
import {
  checkOwnerOrAllowed,
  checkSensitivity,
  checkWorkingHours,
  checkAttributes
} from "../middleware/accessControl.js";

import {
  createLeave,
  getMyLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave,
  updateLeave
} from "../controllers/leaveController.js";

import LeaveRequest from "../models/LeaveRequest.js";

const router = express.Router();


// CREATE LEAVE (Employee)
router.post(
  "/",
  requireAuth,
  checkWorkingHours(),        // RuBAC: only during work hours
  createLeave
);


// GET MY LEAVES
router.get(
  "/my",
  requireAuth,
  getMyLeaves
);


// GET SINGLE LEAVE (MAC + DAC)
router.get(
  "/:id",
  requireAuth,
  checkSensitivity("sensitivity"),         // MAC
  checkOwnerOrAllowed(LeaveRequest, "employee", "allowedUsers"), // DAC
  getLeaveById
);


// APPROVE LEAVE (Manager or HR)
router.post(
  "/:id/approve",
  requireAuth,
  checkRole(["Manager", "HR", "Admin"]),   // RBAC
  approveLeave
);


// REJECT LEAVE
router.post(
  "/:id/reject",
  requireAuth,
  checkRole(["Manager", "HR", "Admin"]),   // RBAC
  rejectLeave
);


// UPDATE LEAVE (Employee only — DAC ensures employee owns it)
router.put(
  "/:id",
  requireAuth,
  checkOwnerOrAllowed(LeaveRequest, "employee"),
  updateLeave
);


export default router;
