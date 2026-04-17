const mongoose = require("mongoose");
const { snipConn } = require("../config/db");

const bookingSchema = new mongoose.Schema(
  {
    plotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plot",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenAmount: {
      type: Number,
      required: true,
      min: [1, "Token amount must be greater than 0"],
    },
    status: {
      type: String,
      enum: ["reserved", "confirmed", "cancelled", "expired"],
      default: "reserved",
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  { timestamps: true }
);

module.exports = snipConn.model("Booking", bookingSchema);