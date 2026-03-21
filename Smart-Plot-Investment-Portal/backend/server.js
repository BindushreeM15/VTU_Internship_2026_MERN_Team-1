const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors    = require("cors");

const { connectAll, adminConn, snipConn } = require("./config/db");
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

// ── DB connection middleware ───────────────────────────────────────────────────
// readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
// We reconnect if either connection is not in state 1 or 2.
let dbPromise = null;

const ensureDB = () => {
  const adminReady = adminConn.readyState === 1 || adminConn.readyState === 2;
  const snipReady  = snipConn.readyState  === 1 || snipConn.readyState  === 2;

  // If both connections are alive, no need to reconnect
  if (adminReady && snipReady && dbPromise) {
    return dbPromise;
  }

  // Otherwise reset and reconnect
  dbPromise = connectAll().catch((err) => {
    dbPromise = null; // allow retry on next request
    throw err;
  });

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

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/api/protected", authenticate, (req, res) => {
  res.json({ message: "Protected", user: req.user });
});

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Smart Plot Investment Portal API Running",
    db: {
      admin: adminConn.readyState === 1 ? "connected" : "disconnected",
      snip:  snipConn.readyState  === 1 ? "connected" : "disconnected",
    },
  });
});

// ── Local dev only ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  ensureDB()
    .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch((err) => { console.error("Failed to start:", err); process.exit(1); });
}

module.exports = app;
