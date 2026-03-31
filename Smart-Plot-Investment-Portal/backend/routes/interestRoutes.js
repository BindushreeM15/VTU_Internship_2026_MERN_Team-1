const express = require("express");
const router  = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const { toggleInterest, getMySavedProjects } = require("../controllers/interestController");

// Only investors can save projects
router.post("/:projectId/toggle", authenticate, authorize("investor"), toggleInterest);
router.get("/my-saved",           authenticate, authorize("investor"), getMySavedProjects);

module.exports = router;
