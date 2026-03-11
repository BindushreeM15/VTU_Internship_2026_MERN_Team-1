const { adminConn, snipConn } = require("../config/db");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    match: [/^[0-9]{10}$/, "Phone number must be 10 digits"],
  },
  role: {
    type: String,
    required: true,
    enum: ["investor", "builder", "admin"],
  },
}, { timestamps: true });

// Create models on different connections
const AdminUser = adminConn.model("User", userSchema);
const SnipUser = snipConn.model("User", userSchema);

module.exports = { AdminUser, SnipUser };
