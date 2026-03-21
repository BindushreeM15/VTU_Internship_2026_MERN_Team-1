const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const fileSizeLimit = 10 * 1024 * 1024; // 10 MB

// ── KYC documents ─────────────────────────────────────────────────────────────
const kycStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "spip/kyc", allowed_formats: ["jpg","jpeg","png","pdf"], resource_type: "auto" },
});

// ── Project legal documents ───────────────────────────────────────────────────
const projectDocStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "spip/project-docs", allowed_formats: ["jpg","jpeg","png","pdf"], resource_type: "auto" },
});

// ── Project creation images (sketch + gallery) + katha doc ───────────────────
const projectImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "spip/project-images",
    allowed_formats: ["jpg","jpeg","png","webp"],
    resource_type: "image",
    transformation: [{ width: 1200, height: 800, crop: "fill", quality: "auto:good" }],
  },
});

// Katha document (image or PDF)
const kathaDocStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "spip/katha-docs", allowed_formats: ["jpg","jpeg","png","pdf"], resource_type: "auto" },
});

// ── Plot images — max 2 ───────────────────────────────────────────────────────
const plotImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "spip/plot-images",
    allowed_formats: ["jpg","jpeg","png","webp"],
    resource_type: "image",
    transformation: [{ width: 900, height: 675, crop: "fill", quality: "auto:good" }],
  },
});

// ── Multer instances ──────────────────────────────────────────────────────────

// KYC: 5 doc types
const uploadKYCDocs = multer({ storage: kycStorage, limits: { fileSize: fileSizeLimit } })
  .fields([
    { name: "gstCertificate",        maxCount: 1 },
    { name: "companyPan",            maxCount: 1 },
    { name: "incorporationCert",     maxCount: 1 },
    { name: "directorId",            maxCount: 1 },
    { name: "addressProof",          maxCount: 1 },
  ]);

// Project legal docs: 5 required
const uploadProjectDocs = multer({ storage: projectDocStorage, limits: { fileSize: fileSizeLimit } })
  .fields([
    { name: "reraCertificate",        maxCount: 1 },
    { name: "landTitle",              maxCount: 1 },
    { name: "dcConversion",           maxCount: 1 },
    { name: "approvedLayoutPlan",     maxCount: 1 },
    { name: "encumbranceCertificate", maxCount: 1 },
  ]);

// Project creation: sketch(1) + gallery(5) + kathaDoc(1)
const uploadProjectImages = multer({ storage: projectImageStorage, limits: { fileSize: fileSizeLimit } })
  .fields([
    { name: "sketchImage",    maxCount: 1 },
    { name: "projectImages",  maxCount: 5 },
  ]);

// Katha document (separate upload, any format)
const uploadKathaDoc = multer({ storage: kathaDocStorage, limits: { fileSize: fileSizeLimit } })
  .single("kathaDocument");

// Plot: max 2 images
const uploadPlotImages = multer({ storage: plotImageStorage, limits: { fileSize: fileSizeLimit } })
  .fields([
    { name: "images", maxCount: 2 },
  ]);

module.exports = {
  uploadKYCDocs,
  uploadProjectDocs,
  uploadProjectImages,
  uploadKathaDoc,
  uploadPlotImages,
};
