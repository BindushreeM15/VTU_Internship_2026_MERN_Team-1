const Interest = require("../models/Interest");
const Project  = require("../models/Project");

// ── POST /api/interests/:projectId/toggle ─────────────────────────────────────
// Toggle save/unsave a project. Returns new state.
exports.toggleInterest = async (req, res) => {
  try {
    const { projectId } = req.params;
    const investorId    = req.user.id;

    // Verify project exists and is active
    const project = await Project.findOne({ _id: projectId, projectStatus: "active" });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const existing = await Interest.findOne({ investorId, projectId });

    if (existing) {
      // Unsave
      await Interest.findByIdAndDelete(existing._id);
      await Project.findByIdAndUpdate(projectId, { $inc: { interestCount: -1 } });
      return res.json({ saved: false, message: "Removed from saved projects" });
    } else {
      // Save
      await Interest.create({ investorId, projectId });
      await Project.findByIdAndUpdate(projectId, { $inc: { interestCount: 1 } });
      return res.json({ saved: true, message: "Project saved successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/interests/my-saved ───────────────────────────────────────────────
// Get all projects saved by the logged-in investor
exports.getMySavedProjects = async (req, res) => {
  try {
    const investorId = req.user.id;

    const interests = await Interest.find({ investorId })
      .populate({
        path:   "projectId",
        select: "projectName location description amenities totalPlots bannerImages viewCount interestCount projectStatus",
        populate: { path: "builderId", select: "name companyName" },
      })
      .sort({ createdAt: -1 });

    // Filter out any projects that are no longer active
    const saved = interests
      .filter((i) => i.projectId?.projectStatus === "active")
      .map((i) => i.projectId);

    res.json({ saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
