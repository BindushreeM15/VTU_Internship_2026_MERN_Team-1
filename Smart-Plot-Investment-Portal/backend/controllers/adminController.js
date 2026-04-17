const { SnipUser } = require("../models/User");
const Project = require("../models/Project");
const Plot = require("../models/Plot");
const Booking = require("../models/booking");
const Interest = require("../models/Interest");
const fs = require("fs").promises;
const path = require("path");

const uploadsDir = path.join(__dirname, "../uploads");

// ── Internal helper: clean up all local files for a project ──────────────────
async function _cleanupProjectFiles(project) {
  for (const doc of project.projectDocuments || []) {
    try { await fs.unlink(path.join(uploadsDir, doc.publicId)); } catch (_) {}
  }
  if (project.sketchImage?.publicId) {
    try { await fs.unlink(path.join(uploadsDir, project.sketchImage.publicId)); } catch (_) {}
  }
  for (const img of project.projectImages || []) {
    try { await fs.unlink(path.join(uploadsDir, img.publicId)); } catch (_) {}
  }
  if (project.kathaDocument?.publicId) {
    try { await fs.unlink(path.join(uploadsDir, project.kathaDocument.publicId)); } catch (_) {}
  }
}

// ── Internal helper: clean up KYC files for a builder ────────────────────────
async function _cleanupKycFiles(builder) {
  for (const doc of builder.kycDocuments || []) {
    try { await fs.unlink(path.join(uploadsDir, doc.publicId)); } catch (_) {}
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// KYC
// ═════════════════════════════════════════════════════════════════════════════

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
    if (builder.kycStatus === "rejected") {
      return res.status(400).json({ error: "Builder already blocked" });
    }

    builder.kycStatus = "rejected";
    builder.kycRejectionReason = reason || "Blocked by admin";
    builder.kycVerifiedAt = null;
    await builder.save();
    res.json({ message: `KYC rejected for ${builder.companyName}`, kycStatus: "rejected" });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ── DELETE /api/admin/builders/:builderId ─────────────────────────────────────
// Deletes builder + all their projects + all plots + cleans up files
exports.deleteBuilder = async (req, res) => {
  try {
    const builder = await SnipUser.findOne({ _id: req.params.builderId, role: "builder" });
    if (!builder) return res.status(404).json({ error: "Builder not found" });

    // 1. Find all projects by this builder
    const projects = await Project.find({ builderId: req.params.builderId });

    // 2. For each project: clean files, delete plots, delete interests
    for (const project of projects) {
      await _cleanupProjectFiles(project);
      await Plot.deleteMany({ projectId: project._id });
      await Interest.deleteMany({ projectId: project._id });
    }

    // 3. Delete all projects
    await Project.deleteMany({ builderId: req.params.builderId });

    // 4. Clean KYC files and delete builder
    await _cleanupKycFiles(builder);
    await SnipUser.findByIdAndDelete(req.params.builderId);

    res.json({ message: `Builder "${builder.companyName}" and all associated data deleted.` });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ═════════════════════════════════════════════════════════════════════════════
// PROJECTS
// ═════════════════════════════════════════════════════════════════════════════

exports.getPendingProjects = async (req, res) => {
  try {
    const projects = await Project.find({ projectStatus: "under_review" })
      .populate("builderId", "name email companyName")
      .select("projectName location description amenities totalPlots projectStatus kathaType projectDocuments kathaDocument projectRejectionReason projectSubmittedAt builderId sketchImage projectImages");
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

exports.activateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!["verified", "inactive"].includes(project.projectStatus)) {
      return res.status(400).json({ error: "Cannot activate this project" });
    }
    project.projectStatus = "active";
    await project.save();
    res.json({ message: `"${project.projectName}" is now active`, projectStatus: "active" });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

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

// ── DELETE /api/admin/projects/:projectId ─────────────────────────────────────
// Deletes project + all its plots + cleans up files
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    await _cleanupProjectFiles(project);
    await Plot.deleteMany({ projectId: req.params.projectId });
    await Interest.deleteMany({ projectId: req.params.projectId });
    await Project.findByIdAndDelete(req.params.projectId);

    res.json({ message: `"${project.projectName}" and all its plots deleted.` });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.AllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("builderId", "name companyName")
      .select("projectName location projectStatus builderId");

    const formattedProjects = projects.map((p) => ({
      projectName: p.projectName,
      builderName: p.builderId?.companyName || p.builderId?.name,
      location: p.location,
      status: p.projectStatus,
    }));
    res.json({ projects: formattedProjects });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getAllPlots = async (req, res) => {
  try {
    const plots = await Plot.find()
      .populate("projectId", "projectName location")
      .populate("builderId", "name companyName")
      .select("plotNumber sizeSqft price facing status projectId builderId createdAt distanceToMetro distanceToHighway distanceToSchool distanceToHospital")
      .sort({ createdAt: -1 });

    const plotIds = plots.map((p) => p._id);
    const bookings = await Booking.find({
      plotId: { $in: plotIds },
      status: { $in: ["reserved", "confirmed"] },
    })
      .populate("userId", "name email phone")
      .select("plotId tokenAmount status expiresAt userId");

    const bookingMap = new Map();
    bookings.forEach((b) => { bookingMap.set(String(b.plotId), b); });

    const formattedPlots = plots.map((p) => {
      const booking = bookingMap.get(String(p._id));
      return {
        plotNumber: p.plotNumber,
        projectName: p.projectId?.projectName,
        builderName: p.builderId?.companyName || p.builderId?.name,
        location: p.projectId?.location,
        sizeSqft: p.sizeSqft,
        price: p.price,
        facing: p.facing,
        status: p.status,
        tokenAmount: booking?.tokenAmount ?? null,
        bookingStatus: booking?.status ?? null,
        investorName: booking?.userId?.name ?? null,
        investorEmail: booking?.userId?.email ?? null,
        expiresAt: booking?.expiresAt ?? null,
      };
    });

    res.json({ plots: formattedPlots });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ═════════════════════════════════════════════════════════════════════════════
// INVESTORS
// ═════════════════════════════════════════════════════════════════════════════

exports.getAllInvestors = async (req, res) => {
  try {
    const investors = await SnipUser.find({ role: "investor" })
      .select("name email phone createdAt");
    res.json({ investors });
  } catch (error) { res.status(500).json({ error: error.message }); }
};