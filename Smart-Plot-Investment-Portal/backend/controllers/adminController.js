const { SnipUser } = require("../models/User");
const Project = require("../models/Project");

// ══════════════════════════════════════════════════════════════════════════════
// KYC
// ══════════════════════════════════════════════════════════════════════════════

exports.getPendingKYC = async (req, res) => {
  try {
    const builders = await SnipUser.find({ role: "builder", kycStatus: "under_review" })
      .select("name email phone companyName kycStatus kycDocuments kycSubmittedAt kycRejectionReason createdAt");
    res.json({ builders });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getAllBuilders = async (req, res) => {
  try {
    const builders = await SnipUser.find({ role: "builder" })
      .select("name email phone companyName kycStatus kycSubmittedAt kycVerifiedAt kycRejectionReason createdAt");
    res.json({ builders });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.approveKYC = async (req, res) => {
  try {
    const builder = await SnipUser.findOne({ _id: req.params.builderId, role: "builder" });
    if (!builder) return res.status(404).json({ error: "Builder not found" });
    if (builder.kycStatus !== "under_review") return res.status(400).json({ error: "Not under review" });
    builder.kycStatus = "verified";
    builder.kycVerifiedAt = new Date();
    builder.kycRejectionReason = null;
    await builder.save();
    res.json({ message: `KYC approved for ${builder.companyName}`, kycStatus: "verified" });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.rejectKYC = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ error: "Rejection reason is required" });
    const builder = await SnipUser.findOne({ _id: req.params.builderId, role: "builder" });
    if (!builder) return res.status(404).json({ error: "Builder not found" });
    if (builder.kycStatus !== "under_review") return res.status(400).json({ error: "Not under review" });
    builder.kycStatus = "rejected";
    builder.kycRejectionReason = reason.trim();
    builder.kycVerifiedAt = null;
    await builder.save();
    res.json({ message: `KYC rejected for ${builder.companyName}`, kycStatus: "rejected" });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ══════════════════════════════════════════════════════════════════════════════
// PROJECTS
// ══════════════════════════════════════════════════════════════════════════════

exports.getPendingProjects = async (req, res) => {
  try {
    const projects = await Project.find({ projectStatus: "under_review" })
      .populate("builderId", "name email companyName")
      .select("projectName location description amenities totalPlots projectStatus kathaType projectDocuments kathaDocument projectRejectionReason projectSubmittedAt builderId");
    res.json({ projects });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("builderId", "name email companyName")
      .select("projectName location projectStatus totalPlots kathaType projectSubmittedAt projectVerifiedAt builderId createdAt viewCount interestCount");
    res.json({ projects });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.approveProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.projectStatus !== "under_review") return res.status(400).json({ error: "Not under review" });
    project.projectStatus = "verified";
    project.projectVerifiedAt = new Date();
    project.projectRejectionReason = null;
    await project.save();
    res.json({ message: `"${project.projectName}" approved`, projectStatus: "verified" });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.rejectProject = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ error: "Rejection reason is required" });
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.projectStatus !== "under_review") return res.status(400).json({ error: "Not under review" });
    project.projectStatus = "rejected";
    project.projectRejectionReason = reason.trim();
    project.projectVerifiedAt = null;
    await project.save();
    res.json({ message: `"${project.projectName}" rejected`, projectStatus: "rejected" });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ── POST /api/admin/projects/:projectId/activate ──────────────────────────────
// Admin activates a verified project — makes it live for investors
exports.activateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!["verified", "inactive"].includes(project.projectStatus)) {
      return res.status(400).json({ error: "Only verified or inactive projects can be activated" });
    }
    project.projectStatus = "active";
    await project.save();
    res.json({ message: `"${project.projectName}" is now active`, projectStatus: "active" });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ── POST /api/admin/projects/:projectId/deactivate ────────────────────────────
// Admin deactivates an active project (e.g. reported content)
exports.deactivateProject = async (req, res) => {
  try {
    const { reason } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.projectStatus !== "active") {
      return res.status(400).json({ error: "Only active projects can be deactivated" });
    }
    project.projectStatus = "inactive";
    if (reason) project.projectRejectionReason = reason;
    await project.save();
    res.json({ message: `"${project.projectName}" deactivated`, projectStatus: "inactive" });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
