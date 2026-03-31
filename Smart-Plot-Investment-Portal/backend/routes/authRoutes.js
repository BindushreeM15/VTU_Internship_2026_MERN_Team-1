const express = require("express");
const router = express.Router();
const { signup, login, updateProfile } = require("../controllers/authController.js");
const { authenticate } = require("../middleware/auth");
const {
  sendOtp,
  verifyOtp,
  sendResetLink,
  resetPassword
} = require("../controllers/authController");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/send-reset-link", sendResetLink);
router.post("/reset-password", resetPassword);
router.post("/signup", signup);
router.post("/login", login);
router.put("/update-profile", authenticate, updateProfile);

module.exports = router;