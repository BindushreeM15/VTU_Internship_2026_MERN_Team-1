const { AdminUser, SnipUser } = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

const getUserModel = (role) => (role === "admin" ? AdminUser : SnipUser);

// ── Investor signup ───────────────────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!["investor"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const UserModel = getUserModel(role);
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await new UserModel({ name, email, password: hashedPassword, phone, role }).save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── Unified login ─────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    let user = await SnipUser.findOne({ email });
    if (!user) user = await AdminUser.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const tokenPayload = {
      id: user._id, name: user.name, email: user.email,
      phone: user.phone, role: user.role,
      ...(user.role === "builder" && { companyName: user.companyName, kycStatus: user.kycStatus }),
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "8h" });

    res.json({
      message: "Login successful", token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role,
        ...(user.role === "builder" && { companyName: user.companyName, kycStatus: user.kycStatus }),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── Update profile ────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, companyName, currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;
    const role   = req.user.role;

    const UserModel = getUserModel(role);
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role === "builder" && companyName !== undefined) user.companyName = companyName;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: "Current password is required" });
      if (newPassword !== confirmPassword) return res.status(400).json({ error: "Passwords do not match" });
      if (newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok) return res.status(400).json({ error: "Current password is incorrect" });
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json({
      message: "Profile updated successfully",
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, companyName: user.companyName, kycStatus: user.kycStatus },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── Password reset request ─────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Search both models since you have a split user system
    let user = await SnipUser.findOne({ email });
    if (!user) user = await AdminUser.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 min

    await user.save();

    // Ensure your utils/sendEmail.js is using the Google App Password!
    await sendEmail(email, "Password Reset OTP", `Your OTP is ${otp}`);

    res.json({ message: "OTP sent to email" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── Verify OTP ─────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    let user = await SnipUser.findOne({ email });
    if (!user) user = await AdminUser.findOne({ email });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    res.json({ message: "OTP verified" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── Reset Password ──────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    let user = await SnipUser.findOne({ email });
    if (!user) user = await AdminUser.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpires = null;

    await user.save();
    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};