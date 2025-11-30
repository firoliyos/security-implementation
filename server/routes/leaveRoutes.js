// routes/leaveRoutes.js
import express from "express";
import LeaveRequest from "../models/LeaveRequest.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { checkRole } from "../middleware/roleMiddleware.js";
import {
  checkOwnerOrAllowed,
  checkSensitivity,
  checkWorkingHours,
  checkAttributes
} from "../middleware/accessControl.js";

const router = express.Router();

/**
 * Employee creates a leave request
 * - must be authenticated
 * - must obey working hours rule (optional: allow creation outside hours but restrict approvals)
 */
router.post(
  "/",
  requireAuth,
  checkWorkingHours(), // optional: deny creation outside hours for non-admins
  async (req, res) => {
    try {
      const { startDate, endDate, type, reason } = req.body;
      const leave = await LeaveRequest.create({
        employee: req.user.id,
        startDate,
        endDate,
        type,
        reason,
        status: "Pending",
        sensitivity: "Internal" // default; admin/HR can set Confidental when needed
      });
      return res.status(201).json(leave);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to create leave" });
    }
  }
);

/**
 * Manager views a leave request for approval
 * Conditions:
 *  - authenticated
 *  - either owner OR role=Manager of same department (ABAC) OR role=HR/Admin (RBAC)
 *  - MAC sensitivity check (if Confidential, only HR/Admin)
 */
router.get(
  "/:id",
  requireAuth,
  // First RBAC allow HR/Admin immediately
  (req, res, next) => {
    if (["HR", "Admin"].includes(req.user.role)) return next();
    return next(); // fallthrough to DAC/ABAC checks below
  },
  // check sensitivity (MAC) - will block if user role not allowed for that sensitivity
  checkSensitivity("sensitivity"),
  // check owner or allowed (DAC)
  checkOwnerOrAllowed(LeaveRequest, "employee", "allowedUsers"),
  async (req, res) => {
    try {
      const leave = await LeaveRequest.findById(req.params.id)
        .populate("employee", "name email department")
        .lean();
      if (!leave) return res.status(404).json({ message: "Not found" });
      return res.json(leave);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch leave" });
    }
  }
);

/**
 * Approve leave: example protecting with ABAC (manager can approve within dept)
 */
router.post(
  "/:id/approve",
  requireAuth,
  // HR and Admin can approve any leave
  checkRole(["HR", "Admin"]),
  // OR we could allow managers with ABAC; illustrated below as an alternative route
  async (req, res) => {
    try {
      const leave = await LeaveRequest.findById(req.params.id);
      if (!leave) return res.status(404).json({ message: "Not found" });

      leave.status = "Approved";
      leave.approvedBy = req.user.id;
      leave.approvedAt = new Date();
      await leave.save();

      // TODO: create log entry and send notifications
      return res.json({ message: "Approved", leave });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to approve" });
    }
  }
);

/**
 * Manager-approve route using ABAC (only if manager of same department & within hours)
 */
router.post(
  "/:id/manager-approve",
  requireAuth,
  checkAttributes({ role: "Manager", timeWindow: { start: "09:00", end: "18:00" } }),
  async (req, res) => {
    try {
      const leave = await LeaveRequest.findById(req.params.id).populate("employee");
      if (!leave) return res.status(404).json({ message: "Not found" });

      // ensure manager dept == employee dept
      if (req.user.department !== String(leave.employee.department)) {
        return res.status(403).json({ message: "Not allowed: department mismatch" });
      }

      // block if > 10 days (RuBAC rule) — only HR can approve
      const ms = new Date(leave.endDate) - new Date(leave.startDate);
      const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
      if (days > 10) {
        return res.status(403).json({ message: "Long leaves (>10 days) require HR approval" });
      }

      leave.status = "Approved";
      leave.approvedBy = req.user.id;
      leave.approvedAt = new Date();
      await leave.save();

      // TODO: log + notify
      return res.json({ message: "Manager Approved", leave });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to approve" });
    }
  }
);

export default router;
