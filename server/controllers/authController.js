import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

// Email transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// REGISTER USER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, department, location } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      department,
      location
    });

    res.json({ message: "Registration Successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "Invalid credentials" });

    if (user.isLocked) {
      return res.json({ message: "Account locked. Contact admin." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      user.failedAttempts += 1;

      if (user.failedAttempts >= 5) {
        user.isLocked = true;
      }

      await user.save();
      return res.json({ message: "Invalid credentials" });
    }

    user.failedAttempts = 0;

    // MFA OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 3 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      to: user.email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`
    });

    res.json({ message: "OTP sent to email", email: user.email });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// VERIFY OTP
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.json({ message: "Invalid user" });

  if (user.otp !== otp || user.otpExpires < Date.now()) {
    return res.json({ message: "Invalid or expired OTP" });
  }

  // Create Token
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1h"
  });

  user.otp = null;
  await user.save();

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax"
  });

  res.json({ message: "Login successful", token });
};
