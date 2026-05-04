const express = require("express");
const router  = express.Router();
const { authenticate, authorize, requireKYCVerified } = require("../middleware/auth");
const { uploadProjectDocs, uploadProjectImages } = require("../middleware/upload");
const {
  createProject, getBuilderProjects, getProjectById,
  updateProject, deleteProject, submitProjectForReview, deleteProjectImage,
  addPlot, getProjectPlots, getAllBuilderPlots, updatePlot, deletePlot,
  getLegalSummary, getProjectMetrics, updateExpectedPrice, updatePlotExpectedPrice,
} = require("../controllers/projectController");

const builderOnly  = [authenticate, authorize("builder")];
const verifiedOnly = [authenticate, authorize("builder"), requireKYCVerified];

// Projects
router.post("/create",                ...verifiedOnly, uploadProjectImages, createProject);
router.get("/my-projects",            ...builderOnly,  getBuilderProjects);
router.get("/:projectId",             ...builderOnly,  getProjectById);
router.put("/update",                 ...verifiedOnly, uploadProjectImages, updateProject);
router.delete("/delete",              ...verifiedOnly, deleteProject);
router.delete("/delete-project-image",...verifiedOnly, deleteProjectImage);
router.post("/submit-for-review",     ...verifiedOnly, uploadProjectDocs, submitProjectForReview);

// Compliance & Investment Metrics
router.get("/:projectId/legal-summary", getLegalSummary);
router.get("/:projectId/metrics",       getProjectMetrics);
router.put("/update-expected-price",    ...verifiedOnly, updateExpectedPrice);

// Plots — no image upload
router.post("/plots/add",             ...verifiedOnly, addPlot);
router.get("/plots/all",              ...builderOnly,  getAllBuilderPlots);
router.get("/plots/:projectId",       ...builderOnly,  getProjectPlots);
router.put("/plots/update",           ...verifiedOnly, updatePlot);
router.delete("/plots/delete",        ...verifiedOnly, deletePlot);
router.put("/plots/update-expected-price", ...verifiedOnly, updatePlotExpectedPrice);

module.exports = router;
