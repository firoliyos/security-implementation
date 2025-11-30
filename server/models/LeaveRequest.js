// models/LeaveRequest.js
import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  type: {
    type: String,
    enum: ["Annual", "Sick", "Emergency", "Maternity", "Unpaid"],
    required: true
  },

  reason: { type: String, required: true },

  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  approvedAt: { type: Date, default: null },

  sensitivity: {
    type: String,
    enum: ["Public", "Internal", "Confidential"],
    default: "Internal"
  },

  // DAC: Users allowed to view/manage this request
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  // Audit fields
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }

}, { timestamps: true });

export default mongoose.model("LeaveRequest", leaveRequestSchema);
