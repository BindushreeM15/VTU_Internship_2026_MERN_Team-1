const mongoose = require("mongoose");

// ensure environment variables are loaded before calling this file
const adminUri = process.env.ADMIN_MONGO_URI;
const snipUri = process.env.SNIP_MONGO_URI;

if (!adminUri) {
  console.error("ADMIN_MONGO_URI is not defined in environment");
  // throw to prevent further application start
  throw new Error("ADMIN_MONGO_URI not defined");
}
if (!snipUri) {
  console.error("SNIP_MONGO_URI is not defined in environment");
  throw new Error("SNIP_MONGO_URI not defined");
}

// connection options that apply in both dev and production
const connOptions = {
  // wait up to 30 seconds for server selection (default 30s)
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_TIMEOUT_MS, 10) || 30000,
  // socket inactivity timeout
  socketTimeoutMS: 45000,
  // maintain up to 10 sockets in the pool
  maxPoolSize: 10,
  // other options may be added as needed
};

// create the connections but they will attempt to connect asynchronously
const adminConn = mongoose.createConnection(adminUri, connOptions);
const snipConn = mongoose.createConnection(snipUri, connOptions);

// helper that returns a promise which resolves when connection is ready
function waitForConnection(conn, name) {
  return new Promise((resolve, reject) => {
    conn.once('open', () => {
      console.log(`${name} DB Connected`);
      resolve(conn);
    });
    conn.on('error', (err) => {
      console.error(`${name} DB Error:`, err);
      reject(err);
    });
  });
}

// exported initializer to await both connections before starting the server
async function connectAll() {
  await Promise.all([
    waitForConnection(adminConn, 'Admin'),
    waitForConnection(snipConn, 'Snip'),
  ]);
}

// keep event logging in place for debugging
adminConn.on("connected", () => console.log("Admin DB Connected"));
adminConn.on("error", (err) => console.error("Admin DB Error:", err));

snipConn.on("connected", () => console.log("Snip DB Connected"));
snipConn.on("error", (err) => console.error("Snip DB Error:", err));

// final export includes the initializer helper
module.exports = { adminConn, snipConn, connectAll };
