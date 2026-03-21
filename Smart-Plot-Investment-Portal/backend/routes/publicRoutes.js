const express = require("express");
const router  = express.Router();
const {
  getPublicProjects,
  getPublicProjectDetail,
  getPublicPlotDetail,
  getPublicFilters,
  getPublicStats,
} = require("../controllers/publicController");

router.get("/stats",                              getPublicStats);
router.get("/filters",                            getPublicFilters);
router.get("/projects",                           getPublicProjects);
router.get("/projects/:projectId",                getPublicProjectDetail);
router.get("/projects/:projectId/plots/:plotId",  getPublicPlotDetail);

module.exports = router;
