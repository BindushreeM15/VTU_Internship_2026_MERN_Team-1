const express = require("express");
const router = express.Router();
const { authenticate, authorize, isAdmin } = require("../middleware/auth");
const {
    getPendingKYC,
    getAllBuilders,
    approveKYC,
    rejectKYC,
    getPendingProjects,
    getAllProjects,
    approveProject,
    rejectProject,
    activateProject,
    deactivateProject,
    AllProjects,
} = require("../controllers/adminController");

router.use(authenticate, authorize("admin"));

// KYC
router.get("/kyc/pending", getPendingKYC);
router.get("/kyc/all", getAllBuilders);
router.post("/kyc/:builderId/approve", approveKYC);
router.post("/kyc/:builderId/reject", rejectKYC);

// Projects
router.get("admin/projects", authenticate, isAdmin, AllProjects);
router.get("/projects/pending", getPendingProjects);
router.get("/projects/all", getAllProjects);
router.post("/projects/:projectId/approve", approveProject);
router.post("/projects/:projectId/reject", rejectProject);
router.post("/projects/:projectId/activate", activateProject);
router.post("/projects/:projectId/deactivate", deactivateProject);
module.exports = router;
