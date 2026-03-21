/**
 * scripts/createAdmin.js
 *
 * One-time script to create an admin account.
 *
 * Usage:
 *   node scripts/createAdmin.js
 *
 * Set the credentials you want below before running.
 * Run from the backend/ directory so .env is picked up correctly.
 */

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ── Configure your admin credentials here ─────────────────────────────────────
const ADMIN = {
  name: "Super Admin",
  email: "admin@smartplot.com",
  password: "Admin@123",       // change this to something strong
  phone: "9999999999",
  role: "admin",
};
// ──────────────────────────────────────────────────────────────────────────────

const adminUri = process.env.ADMIN_MONGO_URI;
if (!adminUri) {
  console.error("❌  ADMIN_MONGO_URI not set in .env");
  process.exit(1);
}

const userSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:    { type: String, required: true },
    phone:       { type: String, required: true },
    role:        { type: String, required: true, enum: ["investor", "builder", "admin"] },
    companyName: { type: String },
  },
  { timestamps: true }
);

async function main() {
  const conn = await mongoose.createConnection(adminUri).asPromise();
  console.log("✅  Connected to Admin DB");

  const AdminUser = conn.model("User", userSchema);

  const existing = await AdminUser.findOne({ email: ADMIN.email });
  if (existing) {
    console.log(`⚠️   Admin with email "${ADMIN.email}" already exists. Aborting.`);
    await conn.close();
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(ADMIN.password, 10);
  const admin = new AdminUser({ ...ADMIN, password: hashedPassword });
  await admin.save();

  console.log("✅  Admin account created successfully!");
  console.log(`    Email   : ${ADMIN.email}`);
  console.log(`    Password: ${ADMIN.password}`);
  console.log("    ⚠️  Please change the password after first login.");

  await conn.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌  Error:", err.message);
  process.exit(1);
});
