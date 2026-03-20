const express = require("express");
const router  = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const { uploadKYCDocs }           = require("../middleware/upload");
const { getKYCStatus, submitKYC } = require("../controllers/kycController");

// All KYC routes require a logged-in builder
router.use(authenticate, authorize("builder"));

router.get("/status", getKYCStatus);
router.post("/submit", uploadKYCDocs, submitKYC);

module.exports = router;
