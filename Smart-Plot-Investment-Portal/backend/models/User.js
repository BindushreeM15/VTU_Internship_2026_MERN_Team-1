const { adminConn, snipConn } = require("../config/db");
const mongoose = require("mongoose");

const kycDocumentSchema = new mongoose.Schema({
  docType:    { type: String, required: true }, // e.g. "gstCertificate"
  label:      { type: String, required: true }, // e.g. "GST Certificate"
  fileUrl:    { type: String, required: true },
  publicId:   { type: String, required: true }, // Cloudinary public_id for deletion
  uploadedAt: { type: Date,   default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String, required: true, trim: true,
  },
  email: {
    type: String, required: true, unique: true, lowercase: true, trim: true,
  },
  password: {
    type: String, required: true,
  },
  phone: {
    type: String, required: true,
    match: [/^[0-9]{10}$/, "Phone number must be 10 digits"],
  },
  role: {
    type: String, required: true, enum: ["investor", "builder", "admin"],
  },

  // ── Builder-only fields ───────────────────────────────────────────────────
  companyName: {
    type: String, trim: true,
    required: function () { return this.role === "builder"; },
  },

  // KYC workflow
  kycStatus: {
    type: String,
    enum: ["unsubmitted", "under_review", "verified", "rejected"],
    default: function () { return this.role === "builder" ? "unsubmitted" : undefined; },
  },
  kycDocuments: {
    type: [kycDocumentSchema],
    default: [],
  },
  kycRejectionReason: {
    type: String,
    default: null,
  },
  kycSubmittedAt:  { type: Date, default: null },
  kycVerifiedAt:   { type: Date, default: null },
  // ─────────────────────────────────────────────────────────────────────────

}, { timestamps: true });

const AdminUser = adminConn.model("User", userSchema);
const SnipUser  = snipConn.model("User", userSchema);

module.exports = { AdminUser, SnipUser };
