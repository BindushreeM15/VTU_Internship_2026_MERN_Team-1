const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {

  try {

    const { name, email, password, phone, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};