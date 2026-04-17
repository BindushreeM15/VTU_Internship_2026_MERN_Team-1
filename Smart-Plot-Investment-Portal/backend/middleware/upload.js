const multer = require("multer");
const path = require("path");

// Use local storage for development (no Cloudinary needed)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileSizeLimit = 10 * 1024 * 1024; // 10 MB

// ── KYC documents ─────────────────────────────────────────────────────────────
const uploadKYCDocs = multer({ storage, limits: { fileSize: fileSizeLimit } })
  .fields([
    { name: "gstCertificate",        maxCount: 1 },
    { name: "companyPan",            maxCount: 1 },
    { name: "incorporationCert",     maxCount: 1 },
    { name: "directorId",            maxCount: 1 },
    { name: "addressProof",          maxCount: 1 },
  ]);

// Project legal docs: 5 required plus optional katha document
const uploadProjectDocs = multer({ storage, limits: { fileSize: fileSizeLimit } })
  .fields([
    { name: "reraCertificate",        maxCount: 1 },
    { name: "landTitle",              maxCount: 1 },
    { name: "dcConversion",           maxCount: 1 },
    { name: "approvedLayoutPlan",     maxCount: 1 },
    { name: "encumbranceCertificate", maxCount: 1 },
    { name: "kathaDocument",          maxCount: 1 },
  ]);

// Project creation: sketch(1) + gallery(5)
const uploadProjectImages = multer({ storage, limits: { fileSize: fileSizeLimit } })
  .fields([
    { name: "sketchImage",    maxCount: 1 },
    { name: "projectImages",  maxCount: 5 },
  ]);

module.exports = {
  uploadKYCDocs,
  uploadProjectDocs,
  uploadProjectImages,
};