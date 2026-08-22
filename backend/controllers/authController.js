const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Notification = require("../models/Notification");
const { ensureCurrentUserAccess } = require("../utils/requestAccess");

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, skills, certifications, careerGoal } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required ❌" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered ❌" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      skills: skills || [],
      certifications: certifications || [],
      careerGoal: careerGoal || "",
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "skillgap_secret", {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User Registered ✅",
      userId: user._id,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        certifications: user.certifications,
        careerGoal: user.careerGoal,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed ❌", error: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required ❌" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found ❌" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials ❌" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "skillgap_secret", {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful ✅",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        certifications: user.certifications,
        careerGoal: user.careerGoal,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed ❌", error: error.message });
  }
};

// PUT /api/auth/profile/:userId  — Update skills, certifications, career goal
exports.updateProfile = async (req, res) => {
  try {
    const userId = ensureCurrentUserAccess(req, res, req.params.userId);
    if (!userId) return;
    const { skills, certifications, careerGoal, name } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found ❌" });

    if (typeof name === "string" && name.trim()) user.name = name.trim();
    if (skills !== undefined && Array.isArray(skills)) user.skills = skills;
    if (certifications !== undefined && Array.isArray(certifications)) user.certifications = certifications;
    if (careerGoal !== undefined) user.careerGoal = careerGoal;

    await user.save();

    // Create Notification
    try {
      await Notification.create({
        userId,
        text: "Your career profile has been successfully updated.",
        icon: "account_circle"
      });
    } catch (err) {
      // Silent fail for notification log
    }

    res.json({
      message: "Profile updated ✅",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        certifications: user.certifications,
        careerGoal: user.careerGoal,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Profile update failed ❌", error: error.message });
  }
};

// GET /api/auth/profile/:userId
exports.getProfile = async (req, res) => {
  try {
    const userId = ensureCurrentUserAccess(req, res, req.params.userId);
    if (!userId) return;

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found ❌" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to get profile ❌", error: error.message });
  }
};

// PUT /api/auth/profile/:userId/resume
exports.updateResume = async (req, res) => {
  try {
    const userId = ensureCurrentUserAccess(req, res, req.params.userId);
    if (!userId) return;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded ❌" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found ❌" });

    // Update resume filename
    user.resume = req.file.filename;
    await user.save();

    // Create Notification
    try {
      await Notification.create({
        userId,
        text: "Your resume has been successfully updated.",
        icon: "description"
      });
    } catch (err) {
      // Silent fail
    }

    res.json({
      message: "Resume updated ✅",
      resume: user.resume,
    });
  } catch (error) {
    res.status(500).json({ message: "Resume update failed ❌", error: error.message });
  }
};
