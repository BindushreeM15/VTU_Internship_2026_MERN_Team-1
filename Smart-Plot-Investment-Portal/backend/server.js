const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors    = require("cors");

const { connectAll }   = require("./config/db");
const authRoutes       = require("./routes/authRoutes");
const builderRoutes    = require("./routes/builderRoutes");
const projectRoutes    = require("./routes/projectRoutes");
const kycRoutes        = require("./routes/kycRoutes");
const adminRoutes      = require("./routes/adminRoutes");
const publicRoutes     = require("./routes/publicRoutes");
const interestRoutes   = require("./routes/interestRoutes");
const { authenticate } = require("./middleware/auth");

const app = express();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "https://spip-frontend-v2.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
  ],
  credentials: true,
}));
app.use(express.json());

// ── DB connection ─────────────────────────────────────────────────────────────
// Use a single shared promise so concurrent requests on a cold start all wait
// for the SAME connection attempt — no duplicate listeners, no race condition.
let dbPromise = null;

const ensureDB = () => {
  if (!dbPromise) {
    dbPromise = connectAll().catch((err) => {
      // Reset so the next request can retry
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
};

app.use(async (req, res, next) => {
  try {
    await ensureDB();
    next();
  } catch (err) {
    console.error("DB connection failed:", err.message);
    res.status(503).json({ error: "Database unavailable, please retry" });
  }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/builders",  builderRoutes);
app.use("/api/projects",  projectRoutes);
app.use("/api/kyc",       kycRoutes);
app.use("/api/admin",     adminRoutes);
app.use("/api/public",    publicRoutes);
app.use("/api/interests", interestRoutes);

// ── Health / test ─────────────────────────────────────────────────────────────
app.get("/api/protected", authenticate, (req, res) => {
  res.json({ message: "Protected", user: req.user });
});

app.get("/", (req, res) => {
  res.send("Smart Plot Investment Portal API Running");
});

// ── Local dev: connect first, then listen ─────────────────────────────────────
// Vercel serverless ignores this block entirely (module.exports = app handles it)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  ensureDB()
    .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch((err) => { console.error("Failed to start:", err); process.exit(1); });
}

// ── Export for Vercel ─────────────────────────────────────────────────────────
module.exports = app;
