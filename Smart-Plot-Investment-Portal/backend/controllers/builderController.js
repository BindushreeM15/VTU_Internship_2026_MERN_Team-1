const { AdminUser, SnipUser } = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getUserModel = (role) => {
    if (role === "admin") return AdminUser;
    return SnipUser;
};

exports.signup = async (req, res) => {
    try {
        const { name, email, password, phone, companyName } = req.body;
        const role = "builder"; // fixed role for builder

        if (!name || !email || !password || !phone || !companyName) {
            return res.status(400).json({ error: "All fields are required" });
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
            companyName,
        });

        await user.save();

        res.status(201).json({
            message: "Builder created successfully",
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const role = "builder"; // fixed role for builder

        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "Email and password are required" });
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

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                companyName: user.companyName,
                joinedAt: user.createdAt,
            },
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
                phone: user.phone,
                role: user.role,
                companyName: user.companyName,
                joinedAt: user.createdAt,

            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
