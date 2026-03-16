const express = require("express");
const router = express.Router();
const { signup, login, updateProfile } = require("../controllers/authController.js");
const { authenticate } = require("../middleware/auth");

router.post("/signup", signup);
router.post("/login", login);
router.put("/update-profile", authenticate, updateProfile);

module.exports = router;