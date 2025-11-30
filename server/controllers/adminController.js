// controllers/adminController.js
import User from "../models/User.js";
import { createLog } from "../middleware/logger.js";


// GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};


// GET SINGLE USER
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};


// UPDATE USER ROLE
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    await createLog({
      userId: req.user.id,
      action: "UPDATE_USER_ROLE",
      status: "SUCCESS",
      ip: req.ip,
      details: { userId: user._id, newRole: role }
    });

    return res.json({ message: "Role updated successfully", user });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update role" });
  }
};


// UPDATE DEPARTMENT
export const updateUserDepartment = async (req, res) => {
  try {
    const { department } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { department },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    await createLog({
      userId: req.user.id,
      action: "UPDATE_USER_DEPARTMENT",
      status: "SUCCESS",
      ip: req.ip,
      details: { userId: user._id, newDept: department }
    });

    return res.json({ message: "Department updated", user });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update department" });
  }
};


// ACTIVATE / DEACTIVATE USER
export const toggleActiveStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

    return res.json({
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      user
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update user status" });
  }
};


// UNLOCK ACCOUNT
export const unlockAccount = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.lockoutEnd = null;
    user.failedLoginAttempts = 0;
    await user.save();

    return res.json({ message: "Account unlocked successfully", user });
  } catch (err) {
    return res.status(500).json({ message: "Failed to unlock account" });
  }
};


// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete user" });
  }
};
