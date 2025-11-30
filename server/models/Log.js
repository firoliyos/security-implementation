// models/Log.js
import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  action: { type: String, required: true },  // "CREATE_LEAVE", "LOGIN", "APPROVE_LEAVE"

  status: {
    type: String,
    enum: ["SUCCESS", "FAILED", "DENIED"],
    default: "SUCCESS"
  },

  ip: { type: String },

  details: {
    type: Object,
    default: {}
  },

  createdAt: { type: Date, default: Date.now }

}, { timestamps: true });

export default mongoose.model("Log", logSchema);
