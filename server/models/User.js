import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["Employee", "Manager", "HR", "Admin"],
    default: "Employee"
  },

  department: { type: String },
  location: { type: String },

  failedAttempts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },

  otp: { type: String },
  otpExpires: { type: Date }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
