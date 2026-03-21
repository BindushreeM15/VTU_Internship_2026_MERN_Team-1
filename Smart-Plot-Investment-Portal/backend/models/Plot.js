const mongoose = require("mongoose");
const { snipConn } = require("../config/db");

const plotSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  builderId: { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },

  plotNumber:  { type: String, required: true, trim: true },
  sizeSqft:    { type: Number, required: true, min: 1 },
  dimensions:  { type: String, trim: true, default: null },

  facing: {
    type: String,
    enum: ["North","South","East","West","North-East","North-West","South-East","South-West"],
    required: true,
  },
  roadWidth:   { type: String, required: true, trim: true },
  cornerPlot:  { type: Boolean, default: false },

  price:  { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["available","blocked","sold"], default: "available" },

  description:  { type: String, trim: true, default: null },
  locationLink: { type: String, trim: true, default: null },

  // No plot-level images — project images are shown on all plots
}, { timestamps: true });

plotSchema.index({ projectId: 1, plotNumber: 1 }, { unique: true });

module.exports = snipConn.model("Plot", plotSchema);
