const jwt = require("jsonwebtoken");

// ── Authenticate: verify JWT exists and is valid ──────────────────────────────
exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, kycStatus, ... }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ── Authorize: require specific roles ────────────────────────────────────────
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ error: "Not authenticated" });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

// ── Require KYC verified (builders only) ─────────────────────────────────────
// Use this on routes that should only be accessible to verified builders
exports.requireKYCVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ error: "Not authenticated" });
  }
  if (req.user.role === "builder" && req.user.kycStatus !== "verified") {
    return res.status(403).json({
      error: "Company not verified",
      kycStatus: req.user.kycStatus,
    });
  }
  next();
};
