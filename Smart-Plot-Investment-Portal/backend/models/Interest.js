const mongoose = require("mongoose");
const { snipConn } = require("../config/db");

const interestSchema = new mongoose.Schema({
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
}, { timestamps: true });

// One investor can save a project only once
interestSchema.index({ investorId: 1, projectId: 1 }, { unique: true });

module.exports = snipConn.model("Interest", interestSchema);
