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

// Mongoose 6+ enables the new URL parser and unified topology by default;
// passing those options now causes a MongoParseError, so we omit them.
const adminConn = mongoose.createConnection(adminUri);

const snipConn = mongoose.createConnection(snipUri);


adminConn.on("connected", () => console.log("Admin DB Connected"));
adminConn.on("error", (err) => console.error("Admin DB Error:", err));

snipConn.on("connected", () => console.log("Snip DB Connected"));
snipConn.on("error", (err) => console.error("Snip DB Error:", err));

module.exports = { adminConn, snipConn };
