const mongoose = require("mongoose");
const { snipConn } = require("../config/db");

const projectDocumentSchema = new mongoose.Schema({
  docType:    { type: String, required: true },
  label:      { type: String, required: true },
  fileUrl:    { type: String, required: true },
  publicId:   { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const imageSchema = new mongoose.Schema({
  url:      { type: String, required: true },
  publicId: { type: String, required: true },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  // ── Core info ─────────────────────────────────────────────────────────────
  projectName:  { type: String, required: true, trim: true },
  location:     { type: String, required: true, trim: true },
  locationLink: { type: String, trim: true, default: null },
  description:  { type: String, required: true, trim: true },
  amenities:    { type: [String], default: [] },
  totalPlots:   { type: Number, required: true, min: 1 },

  // ── Ownership ─────────────────────────────────────────────────────────────
  builderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // ── Katha info (added during project creation, shown in trust section) ────
  kathaType: {
    type: String,
    enum: ["A", "B", "NA", null],
    default: null,
  },
  kathaDocument: {
    type: imageSchema,
    default: null,
  },

  // ── Project images (added during creation, used in Home slideshow) ────────
  // sketchImage: optional layout sketch
  sketchImage: {
    type: imageSchema,
    default: null,
  },
  // projectImages: up to 5 gallery images
  projectImages: {
    type: [imageSchema],
    default: [],
  },

  // ── Verification workflow ─────────────────────────────────────────────────
  projectStatus: {
    type: String,
    enum: ["draft", "under_review", "verified", "rejected", "active", "inactive", "completed"],
    default: "draft",
  },
  projectDocuments: {
    type: [projectDocumentSchema],
    default: [],
  },
  projectRejectionReason: { type: String, default: null },
  projectSubmittedAt:     { type: Date, default: null },
  projectVerifiedAt:      { type: Date, default: null },

  // ── Engagement ────────────────────────────────────────────────────────────
  viewCount:     { type: Number, default: 0, min: 0 },
  interestCount: { type: Number, default: 0, min: 0 },

}, { timestamps: true });

// Indexes
projectSchema.index({ projectStatus: 1, interestCount: -1, viewCount: -1 });
projectSchema.index({ location: "text", projectName: "text" });

module.exports = snipConn.model("Project", projectSchema);
