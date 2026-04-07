const mongoose = require("mongoose");
const { snipConn } = require("../config/db");

const plotSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plotNumber: {
      type: String,
      required: true,
      trim: true,
    },
    sizeSqft: {
      type: Number,
      required: true,
      min: [1, "Size must be greater than 0"],
    },
    dimensions: {
      type: String,
      default: null,
      trim: true,
    },
    facing: {
      type: String,
      required: true,
      enum: ["North", "South", "East", "West", "NorthEast", "NorthWest", "SouthEast", "SouthWest"],
    },
    roadWidth: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: [1, "Price must be greater than 0"],
    },
    cornerPlot: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    locationLink: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ["available", "reserved", "sold"],
      default: "available",
    },
  },
  { timestamps: true }
);

// ── Compound index: ensure unique plotNumber per project ─────────────────────
plotSchema.index({ projectId: 1, plotNumber: 1 }, { unique: true });

module.exports = snipConn.model("Plot", plotSchema);