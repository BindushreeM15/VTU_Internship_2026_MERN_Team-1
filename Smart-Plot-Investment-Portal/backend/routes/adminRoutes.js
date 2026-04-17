const express = require("express");
const router = express.Router();

const { authenticate, authorize } = require("../middleware/auth");
const {
  getPendingKYC,
  getAllBuilders,
  approveKYC,
  rejectKYC,
  deleteBuilder,
  getPendingProjects,
  getAllProjects,
  approveProject,
  rejectProject,
  activateProject,
  deactivateProject,
  deleteProject,
  AllProjects,
  getAllPlots,
  getAllInvestors,
} = require("../controllers/adminController");

// All routes require admin authentication
router.use(authenticate, authorize("admin"));

// ── KYC ───────────────────────────────────────────────────────────────────────
router.get("/kyc/pending", getPendingKYC);
router.get("/kyc/all", getAllBuilders);
router.post("/kyc/:builderId/approve", approveKYC);
router.post("/kyc/:builderId/reject", rejectKYC);

// ── Builders ──────────────────────────────────────────────────────────────────
router.get("/investors", getAllInvestors);
router.delete("/builders/:builderId", deleteBuilder);

// ── Projects ──────────────────────────────────────────────────────────────────
router.get("/projects/pending", getPendingProjects);
router.get("/projects/all", getAllProjects);
router.get("/all-projects", AllProjects);
router.post("/projects/:projectId/approve", approveProject);
router.post("/projects/:projectId/reject", rejectProject);
router.post("/projects/:projectId/activate", activateProject);
router.post("/projects/:projectId/deactivate", deactivateProject);
router.delete("/projects/:projectId", deleteProject);

// ── Plots ─────────────────────────────────────────────────────────────────────
router.get("/plots", getAllPlots);

module.exports = router;