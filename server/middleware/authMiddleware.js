// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // adjust path as needed

export const requireAuth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) return res.status(401).json({ message: "Authentication required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password -otp");
    if (!user) return res.status(401).json({ message: "Invalid token" });

    // attach minimal user info for AC checks
    req.user = {
      id: user._id.toString(),
      role: user.role,
      department: user.department,
      location: user.location,
      employmentStatus: user.employmentStatus || "Full-Time" // optional
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Authentication failed" });
  }
};
