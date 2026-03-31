const { SnipUser } = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone, companyName } = req.body;
    const role = "builder";

    if (!name || !email || !password || !phone || !companyName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check duplicate email
    const existingEmail = await SnipUser.findOne({ email });
    if (existingEmail) return res.status(400).json({ error: "User already exists with this email" });

    // Check duplicate company name (case-insensitive)
    const existingCompany = await SnipUser.findOne({
      role: "builder",
      companyName: { $regex: `^${companyName.trim()}$`, $options: "i" },
    });
    if (existingCompany) {
      return res.status(400).json({
        error: `A builder account with company name "${companyName}" already exists. Please use a different company name or contact support if this is your company.`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await new SnipUser({
      name, email, password: hashedPassword, phone,
      role, companyName: companyName.trim(), kycStatus: "unsubmitted",
    }).save();

    res.status(201).json({ message: "Builder created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const user = await SnipUser.findOne({ email, role: "builder" });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({
      id: user._id, name: user.name, email: user.email,
      phone: user.phone, role: user.role,
      companyName: user.companyName, kycStatus: user.kycStatus,
    }, process.env.JWT_SECRET, { expiresIn: "8h" });

    res.json({
      message: "Login successful", token,
      user: { id: user._id, name: user.name, email: user.email,
        phone: user.phone, role: user.role,
        companyName: user.companyName, kycStatus: user.kycStatus },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
