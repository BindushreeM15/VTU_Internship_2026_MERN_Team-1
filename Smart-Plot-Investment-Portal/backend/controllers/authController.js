const { AdminUser, SnipUser } = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getUserModel = (role) => {
    if (role === "admin") return AdminUser;
    return SnipUser;
};

exports.signup = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        if (!name || !email || !password || !phone || !role) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if (!["investor", "builder", "admin"].includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }

        const UserModel = getUserModel(role);

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new UserModel({
            name,
            email,
            password: hashedPassword,
            phone,
            role,
        });

        await user.save();

        res.status(201).json({
            message: "User created successfully",
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res
                .status(400)
                .json({ error: "Email, password, and role are required" });
        }

        const UserModel = getUserModel(role);

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

    // extra safety: ensure stored role matches requested role
    if (user.role !== role) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" },
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
