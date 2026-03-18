const dotenv = require("dotenv");

dotenv.config();

const express = require("express");
const cors = require("cors");
const { adminConn, snipConn, connectAll } = require("./config/db");
const authRoutes = require('./routes/authRoutes');
const builderRoutes = require('./routes/builderRoutes');
const projectRoutes = require('./routes/projectRoutes');
const { authenticate, authorize } = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use("/api/auth", authRoutes);
app.use("/api/builders", builderRoutes);
app.use("/api/projects", projectRoutes);

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

// start server only after database connections are established
connectAll()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to databases, exiting", err);
        process.exit(1);
    });
