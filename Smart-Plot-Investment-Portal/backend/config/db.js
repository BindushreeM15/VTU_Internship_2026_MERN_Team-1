const mongoose = require("mongoose");

const adminUri = process.env.ADMIN_MONGO_URI;
const snipUri  = process.env.SNIP_MONGO_URI;

if (!adminUri) throw new Error("ADMIN_MONGO_URI not defined");
if (!snipUri)  throw new Error("SNIP_MONGO_URI not defined");

const connOptions = {
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_TIMEOUT_MS, 10) || 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
};

const adminConn = mongoose.createConnection(adminUri, connOptions);
const snipConn  = mongoose.createConnection(snipUri,  connOptions);

// ── Persistent logging listeners (added once at module load) ──────────────────
adminConn.on("connected", () => console.log("Admin DB Connected"));
adminConn.on("error",     (err) => console.error("Admin DB Error:", err));
snipConn.on("connected",  () => console.log("Snip DB Connected"));
snipConn.on("error",      (err) => console.error("Snip DB Error:", err));

// ── Wait for a single connection — safe to call multiple times ────────────────
function waitForConnection(conn, name) {
  return new Promise((resolve, reject) => {
    // Already connected — resolve immediately, no new listeners
    if (conn.readyState === 1) {
      return resolve(conn);
    }
    // Still connecting — wait for the existing attempt
    if (conn.readyState === 2) {
      const onOpen  = () => { cleanup(); resolve(conn); };
      const onError = (err) => { cleanup(); reject(err); };
      const cleanup = () => {
        conn.removeListener("open",  onOpen);
        conn.removeListener("error", onError);
      };
      conn.once("open",  onOpen);
      conn.once("error", onError);
      return;
    }
    // Not connected at all
    const onOpen  = () => { cleanup(); resolve(conn); };
    const onError = (err) => { cleanup(); reject(err); };
    const cleanup = () => {
      conn.removeListener("open",  onOpen);
      conn.removeListener("error", onError);
    };
    conn.once("open",  onOpen);
    conn.once("error", onError);
  });
}

// ── connectAll — safe to call multiple times ──────────────────────────────────
async function connectAll() {
  await Promise.all([
    waitForConnection(adminConn, "Admin"),
    waitForConnection(snipConn,  "Snip"),
  ]);
}

module.exports = { adminConn, snipConn, connectAll };
