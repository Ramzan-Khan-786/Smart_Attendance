import User from "../models/User.js";
import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "8h" });
};

export const registerUser = async (req, res) => {
  const { name, email, password, faceDescriptor } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword, faceDescriptor });
    await user.save();

    const token = generateToken(user.id, "user");
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: "user" },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = generateToken(user.id, "user");
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: "user" },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

export const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let admin = await Admin.findOne({ email });
    if (admin) return res.status(400).json({ msg: "Admin already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    admin = new Admin({ name, email, password: hashedPassword });
    await admin.save();

    const token = generateToken(admin.id, "admin");
    res.json({
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: "admin",
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    let admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = generateToken(admin.id, "admin");
    res.json({
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: "admin",
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

export const getMe = async (req, res) => {
  try {
    let user;
    if (req.user.role === "user") {
      user = await User.findById(req.user.id).select("-password");
    } else if (req.user.role === "admin") {
      user = await Admin.findById(req.user.id).select("-password");
    }

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({ ...user.toObject(), role: req.user.role });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
