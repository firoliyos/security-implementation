// controllers/leaveController.js
import LeaveRequest from "../models/LeaveRequest.js";
import { createLog } from "../middleware/logger.js";

// CREATE LEAVE (Employee)
export const createLeave = async (req, res) => {
  try {
    const { startDate, endDate, type, reason } = req.body;

    const leave = await LeaveRequest.create({
      employee: req.user.id,
      startDate,
      endDate,
      type,
      reason,
      sensitivity: "Internal"
    });

    await createLog({
      userId: req.user.id,
      action: "CREATE_LEAVE",
      status: "SUCCESS",
      ip: req.ip,
      details: { leaveId: leave._id }
    });

    return res.status(201).json(leave);
  } catch (err) {
    console.error(err);

    await createLog({
      userId: req.user.id,
      action: "CREATE_LEAVE",
      status: "FAILED",
      ip: req.ip,
      details: { error: err.message }
    });

    return res.status(500).json({ message: "Failed to create leave request" });
  }
};


// GET MY LEAVES
export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ employee: req.user.id }).sort({ createdAt: -1 });
    return res.json(leaves);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch leaves" });
  }
};


// GET SINGLE LEAVE (with access control done in routes)
export const getLeaveById = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id)
      .populate("employee", "name email department");

    if (!leave) return res.status(404).json({ message: "Leave not found" });

    return res.json(leave);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch leave" });
  }
};


// APPROVE LEAVE (Manager or HR)
export const approveLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Not found" });

    leave.status = "Approved";
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();
    await leave.save();

    await createLog({
      userId: req.user.id,
      action: "APPROVE_LEAVE",
      status: "SUCCESS",
      ip: req.ip,
      details: { leaveId: leave._id }
    });

    return res.json({ message: "Leave approved successfully", leave });
  } catch (err) {
    return res.status(500).json({ message: "Failed to approve leave" });
  }
};


// REJECT LEAVE
export const rejectLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Not found" });

    leave.status = "Rejected";
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();
    await leave.save();

    await createLog({
      userId: req.user.id,
      action: "REJECT_LEAVE",
      status: "SUCCESS",
      ip: req.ip,
      details: { leaveId: leave._id }
    });

    return res.json({ message: "Leave rejected", leave });
  } catch (err) {
    return res.status(500).json({ message: "Failed to reject leave" });
  }
};


// UPDATE LEAVE (Employee Only)
export const updateLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Not found" });

    // Employee can update only while Pending
    if (leave.status !== "Pending") {
      return res.status(403).json({ message: "Cannot update leave after approval" });
    }

    // Apply updates
    leave.startDate = req.body.startDate ?? leave.startDate;
    leave.endDate = req.body.endDate ?? leave.endDate;
    leave.type = req.body.type ?? leave.type;
    leave.reason = req.body.reason ?? leave.reason;

    await leave.save();

    return res.json({ message: "Leave updated successfully", leave });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update leave" });
  }
};
