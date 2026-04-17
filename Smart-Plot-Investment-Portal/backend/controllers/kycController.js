const { SnipUser } = require("../models/User");
const cloudinary = require("../config/cloudinary");

const KYC_DOC_LABELS = {
  gstCertificate:    "GST Certificate",
  companyPan:        "Company PAN Card",
  incorporationCert: "Certificate of Incorporation",
  directorId:        "Director PAN / Aadhaar",
  addressProof:      "Company Address Proof",
};

const KYC_DOC_TYPES = Object.keys(KYC_DOC_LABELS);

// ── GET /api/kyc/status ───────────────────────────────────────────────────────
// Returns the builder's current KYC status and uploaded docs
exports.getKYCStatus = async (req, res) => {
  try {
    const user = await SnipUser.findById(req.user.id).select(
      "kycStatus kycDocuments kycRejectionReason kycSubmittedAt kycVerifiedAt companyName"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      kycStatus:           user.kycStatus,
      kycDocuments:        user.kycDocuments,
      kycRejectionReason:  user.kycRejectionReason,
      kycSubmittedAt:      user.kycSubmittedAt,
      kycVerifiedAt:       user.kycVerifiedAt,
      companyName:         user.companyName,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── POST /api/kyc/submit ──────────────────────────────────────────────────────
// Builder submits KYC docs for the first time OR resubmits after rejection.
// At least 3 of the 5 doc types must be provided.
exports.submitKYC = async (req, res) => {
  try {
    const user = await SnipUser.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Only allow submit/resubmit when unsubmitted or rejected
    if (user.kycStatus === "under_review") {
      return res.status(400).json({ error: "KYC is already under review" });
    }
    if (user.kycStatus === "verified") {
      return res.status(400).json({ error: "KYC is already verified" });
    }

    const uploadedFiles = req.files || {};
    const submittedDocTypes = Object.keys(uploadedFiles).filter(
      (key) => KYC_DOC_TYPES.includes(key)
    );

    if (submittedDocTypes.length < 3) {
  return res.status(400).json({
    error: "Please upload at least 3 documents for KYC verification",
  });
}

    // If resubmitting, delete old Cloudinary files first
    if (user.kycDocuments?.length) {
      for (const doc of user.kycDocuments) {
        try {
          // await cloudinary.uploader.destroy(doc.publicId, { resource_type: "raw" });
        } catch (_) { /* ignore deletion errors */ }
      }
    }

    // Build new documents array from uploaded files
    const newDocs = submittedDocTypes.map((docType) => {
      const file = uploadedFiles[docType][0];
      return {
        docType,
        label:    KYC_DOC_LABELS[docType],
        fileUrl: "/uploads/" + file.filename,       // Cloudinary secure URL
        publicId: file.filename,    // Cloudinary public_id
      };
    });

    user.kycDocuments          = newDocs;
    user.kycStatus             = "under_review";
    user.kycRejectionReason    = null;
    user.kycSubmittedAt        = new Date();
    user.kycVerifiedAt         = null;

    await user.save();

    res.json({
      message:      "KYC documents submitted successfully. Awaiting admin review.",
      kycStatus:    user.kycStatus,
      kycDocuments: user.kycDocuments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ── GET /api/kyc/refresh-token ────────────────────────────────────────────────
// Issues a fresh JWT with current kycStatus from DB.
// Builder calls this after admin approves/rejects to update their token
// without needing to log out and back in.
exports.refreshToken = async (req, res) => {
  try {
    const jwt  = require("jsonwebtoken");
    const user = await SnipUser.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const token = jwt.sign(
      {
        id:          user._id,
        name:        user.name,
        email:       user.email,
        phone:       user.phone,
        role:        user.role,
        companyName: user.companyName,
        kycStatus:   user.kycStatus,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      kycStatus: user.kycStatus,
      user: {
        id:          user._id,
        name:        user.name,
        email:       user.email,
        phone:       user.phone,
        role:        user.role,
        companyName: user.companyName,
        kycStatus:   user.kycStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};