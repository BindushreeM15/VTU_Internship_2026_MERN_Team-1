const Project  = require("../models/Project");
const Plot     = require("../models/Plot");
const cloudinary = require("../config/cloudinary");

const PROJECT_DOC_LABELS = {
  reraCertificate:        "RERA Certificate",
  landTitle:              "Land Title / Sale Deed",
  dcConversion:           "DC Conversion Certificate",
  approvedLayoutPlan:     "Approved Layout Plan",
  encumbranceCertificate: "Encumbrance Certificate",
};
const REQUIRED_PROJECT_DOCS = Object.keys(PROJECT_DOC_LABELS);

// ── POST /api/projects/create ─────────────────────────────────────────────────
exports.createProject = async (req, res) => {
  try {
    const { projectName, location, locationLink, description, amenities, totalPlots, kathaType } = req.body;
    const builderId = req.user.id;

    if (!projectName || !location || !description || !totalPlots) {
      return res.status(400).json({ error: "projectName, location, description and totalPlots are required" });
    }

    const uploadedFiles = req.files || {};
    const sketchFile    = uploadedFiles?.sketchImage?.[0];
    const imageFiles    = uploadedFiles?.projectImages || [];

    const project = new Project({
      projectName, location,
      locationLink:  locationLink || null,
      description,
      amenities:     Array.isArray(amenities) ? amenities : (amenities ? JSON.parse(amenities) : []),
      totalPlots:    Number(totalPlots),
      builderId,
      projectStatus: "draft",
      kathaType:     kathaType || null,
      sketchImage:   sketchFile ? { url: sketchFile.path, publicId: sketchFile.filename } : null,
      projectImages: imageFiles.map((f) => ({ url: f.path, publicId: f.filename })),
    });

    await project.save();
    res.status(201).json({ message: "Project created as draft", project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/projects/my-projects ─────────────────────────────────────────────
exports.getBuilderProjects = async (req, res) => {
  try {
    const projects = await Project.find({ builderId: req.user.id }).sort({ createdAt: -1 });
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/projects/:projectId ──────────────────────────────────────────────
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, builderId: req.user.id });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── PUT /api/projects/update ──────────────────────────────────────────────────
exports.updateProject = async (req, res) => {
  try {
    const { projectId, projectName, location, locationLink, description, amenities, totalPlots, projectStatus, kathaType } = req.body;
    const builderId = req.user.id;

    if (!projectId) return res.status(400).json({ error: "Project ID is required" });

    const project = await Project.findOne({ _id: projectId, builderId });
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.projectStatus === "under_review") {
      return res.status(400).json({ error: "Cannot edit a project under review" });
    }
    if (project.projectStatus === "completed") {
      return res.status(400).json({ error: "Cannot edit a completed project" });
    }

    if (projectName  !== undefined) project.projectName  = projectName;
    if (location     !== undefined) project.location     = location;
    if (locationLink !== undefined) project.locationLink = locationLink;
    if (description  !== undefined) project.description  = description;
    if (kathaType    !== undefined) project.kathaType    = kathaType;
    if (amenities    !== undefined) {
      project.amenities = Array.isArray(amenities) ? amenities : JSON.parse(amenities);
    }
    if (totalPlots !== undefined) {
      const existingCount = await Plot.countDocuments({ projectId });
      if (Number(totalPlots) < existingCount) {
        return res.status(400).json({ error: `Cannot reduce below current plot count (${existingCount})` });
      }
      project.totalPlots = Number(totalPlots);
    }

    // Builder toggles active ↔ inactive
    if (projectStatus !== undefined) {
      const allowed = { verified: ["inactive"], active: ["inactive"], inactive: ["active"] };
      if (!(allowed[project.projectStatus] || []).includes(projectStatus)) {
        return res.status(400).json({ error: `Cannot change from "${project.projectStatus}" to "${projectStatus}"` });
      }
      project.projectStatus = projectStatus;
    }

    // New images
    const uploadedFiles = req.files || {};
    const newSketch     = uploadedFiles?.sketchImage?.[0];
    const newImages     = uploadedFiles?.projectImages || [];

    if (newSketch) {
      if (project.sketchImage?.publicId) {
        try { await cloudinary.uploader.destroy(project.sketchImage.publicId); } catch (_) {}
      }
      project.sketchImage = { url: newSketch.path, publicId: newSketch.filename };
    }
    if (newImages.length) {
      const current = project.projectImages?.length || 0;
      if (current + newImages.length > 5) {
        return res.status(400).json({ error: "Maximum 5 project images allowed" });
      }
      project.projectImages.push(...newImages.map((f) => ({ url: f.path, publicId: f.filename })));
    }

    await project.save();
    res.json({ message: "Project updated", project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── DELETE /api/projects/delete ───────────────────────────────────────────────
// Builder can delete any project in any status (except completed)
// If under_review or active — add a warning but still allow
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.body;
    const builderId     = req.user.id;

    if (!projectId) return res.status(400).json({ error: "Project ID is required" });

    const project = await Project.findOne({ _id: projectId, builderId });
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.projectStatus === "completed") {
      return res.status(400).json({ error: "Cannot delete a completed project" });
    }

    // Clean Cloudinary
    for (const doc of project.projectDocuments || []) {
      try { await cloudinary.uploader.destroy(doc.publicId, { resource_type: "raw" }); } catch (_) {}
    }
    if (project.sketchImage?.publicId) {
      try { await cloudinary.uploader.destroy(project.sketchImage.publicId); } catch (_) {}
    }
    for (const img of project.projectImages || []) {
      try { await cloudinary.uploader.destroy(img.publicId); } catch (_) {}
    }
    if (project.kathaDocument?.publicId) {
      try { await cloudinary.uploader.destroy(project.kathaDocument.publicId, { resource_type: "raw" }); } catch (_) {}
    }

    await Plot.deleteMany({ projectId });
    await Project.findByIdAndDelete(projectId);
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── DELETE /api/projects/delete-project-image ─────────────────────────────────
exports.deleteProjectImage = async (req, res) => {
  try {
    const { projectId, publicId, type } = req.body;
    const project = await Project.findOne({ _id: projectId, builderId: req.user.id });
    if (!project) return res.status(404).json({ error: "Project not found" });
    try { await cloudinary.uploader.destroy(publicId); } catch (_) {}
    if (type === "sketch") project.sketchImage = null;
    else project.projectImages = project.projectImages.filter((i) => i.publicId !== publicId);
    await project.save();
    res.json({ message: "Image deleted", project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── POST /api/projects/submit-for-review ──────────────────────────────────────
exports.submitProjectForReview = async (req, res) => {
  try {
    const { projectId, kathaType } = req.body;
    const builderId = req.user.id;

    if (!projectId) return res.status(400).json({ error: "Project ID is required" });
    if (!kathaType) return res.status(400).json({ error: "Katha type is required" });

    const project = await Project.findOne({ _id: projectId, builderId });
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.projectStatus === "under_review") return res.status(400).json({ error: "Already under review" });
    if (["verified","active"].includes(project.projectStatus)) return res.status(400).json({ error: "Already verified" });
    if (!["draft","rejected"].includes(project.projectStatus)) return res.status(400).json({ error: `Cannot submit with status "${project.projectStatus}"` });

    const uploadedFiles  = req.files || {};
    const submittedTypes = Object.keys(uploadedFiles).filter((k) => REQUIRED_PROJECT_DOCS.includes(k));
    const missingDocs    = REQUIRED_PROJECT_DOCS.filter((d) => !submittedTypes.includes(d));

    if (missingDocs.length > 0) {
      for (const t of submittedTypes) {
        const f = uploadedFiles[t]?.[0];
        if (f?.filename) try { await cloudinary.uploader.destroy(f.filename, { resource_type: "raw" }); } catch (_) {}
      }
      return res.status(400).json({ error: `Missing: ${missingDocs.map((d) => PROJECT_DOC_LABELS[d]).join(", ")}` });
    }

    // Delete old docs
    for (const doc of project.projectDocuments || []) {
      try { await cloudinary.uploader.destroy(doc.publicId, { resource_type: "raw" }); } catch (_) {}
    }

    // Katha doc (optional)
    const kathaFile = uploadedFiles?.kathaDocument?.[0];
    if (kathaFile) {
      if (project.kathaDocument?.publicId) {
        try { await cloudinary.uploader.destroy(project.kathaDocument.publicId, { resource_type: "raw" }); } catch (_) {}
      }
      project.kathaDocument = { url: kathaFile.path, publicId: kathaFile.filename };
    }

    project.kathaType        = kathaType;
    project.projectDocuments = submittedTypes.map((docType) => {
      const f = uploadedFiles[docType][0];
      return { docType, label: PROJECT_DOC_LABELS[docType], fileUrl: f.path, publicId: f.filename };
    });
    project.projectStatus          = "under_review";
    project.projectRejectionReason = null;
    project.projectSubmittedAt     = new Date();
    project.projectVerifiedAt      = null;

    await project.save();
    res.json({ message: "Project submitted for review", project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PLOTS — no image handling
// ══════════════════════════════════════════════════════════════════════════════

exports.addPlot = async (req, res) => {
  try {
    const { projectId, plotNumber, sizeSqft, dimensions, facing, roadWidth, price, cornerPlot, description, locationLink } = req.body;
    const builderId = req.user.id;

    const project = await Project.findOne({ _id: projectId, builderId });
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!["verified","active"].includes(project.projectStatus)) {
      return res.status(400).json({ error: "Plots can only be added to verified or active projects" });
    }

    const existingCount = await Plot.countDocuments({ projectId });
    if (existingCount >= project.totalPlots) {
      return res.status(400).json({ error: `Plot limit reached (${project.totalPlots}). Edit project to increase Total Plots.` });
    }

    const exists = await Plot.findOne({ projectId, plotNumber });
    if (exists) return res.status(400).json({ error: "Plot number already exists in this project" });

    const plot = new Plot({
      projectId, builderId, plotNumber,
      sizeSqft:    Number(sizeSqft),
      dimensions:  dimensions   || null,
      facing,
      roadWidth,
      price:       Number(price),
      cornerPlot:  cornerPlot === "true" || cornerPlot === true,
      description: description  || null,
      locationLink: locationLink || null,
    });

    await plot.save();
    res.status(201).json({ message: "Plot added successfully", plot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProjectPlots = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, builderId: req.user.id });
    if (!project) return res.status(404).json({ error: "Project not found" });
    const plots = await Plot.find({ projectId: req.params.projectId }).sort({ plotNumber: 1 });
    res.json({ plots, totalAllowed: project.totalPlots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllBuilderPlots = async (req, res) => {
  try {
    const plots = await Plot.find({ builderId: req.user.id })
      .populate("projectId", "projectName location totalPlots")
      .sort({ createdAt: -1 });
    res.json({ plots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePlot = async (req, res) => {
  try {
    const { plotId, plotNumber, sizeSqft, dimensions, facing, roadWidth, price, cornerPlot, description, locationLink, status } = req.body;
    const plot = await Plot.findOne({ _id: plotId, builderId: req.user.id });
    if (!plot) return res.status(404).json({ error: "Plot not found" });

    if (plotNumber   !== undefined) plot.plotNumber   = plotNumber;
    if (sizeSqft     !== undefined) plot.sizeSqft     = Number(sizeSqft);
    if (dimensions   !== undefined) plot.dimensions   = dimensions;
    if (facing       !== undefined) plot.facing       = facing;
    if (roadWidth    !== undefined) plot.roadWidth    = roadWidth;
    if (price        !== undefined) plot.price        = Number(price);
    if (cornerPlot   !== undefined) plot.cornerPlot   = cornerPlot === "true" || cornerPlot === true;
    if (description  !== undefined) plot.description  = description;
    if (locationLink !== undefined) plot.locationLink = locationLink;
    if (status       !== undefined) plot.status       = status;

    await plot.save();
    res.json({ message: "Plot updated", plot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePlot = async (req, res) => {
  try {
    const { plotId } = req.body;
    const plot = await Plot.findOne({ _id: plotId, builderId: req.user.id });
    if (!plot) return res.status(404).json({ error: "Plot not found" });
    if (plot.status !== "available") return res.status(400).json({ error: "Only available plots can be deleted" });
    await Plot.findByIdAndDelete(plotId);
    res.json({ message: "Plot deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
