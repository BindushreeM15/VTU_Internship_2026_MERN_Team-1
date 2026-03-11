const dotenv = require("dotenv");

dotenv.config();

const express = require("express");
const cors = require("cors");
const { adminConn, snipConn } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { authenticate, authorize } = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

// test routes
app.get("/api/public", (req, res) => {
    res.json({ message: "This is a public endpoint" });
});

app.get("/api/protected", authenticate, (req, res) => {
    res.json({ message: "You accessed a protected endpoint", user: req.user });
});

app.get("/api/admin", authenticate, authorize("admin"), (req, res) => {
    res.json({ message: "Hello Admin", user: req.user });
});

app.get("/", (req, res) => {
    res.send("Smart Plot Investment Portal API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
