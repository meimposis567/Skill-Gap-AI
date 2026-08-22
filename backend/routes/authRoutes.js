const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  register,
  login,
  updateProfile,
  getProfile,
  updateResume,
} = require("../controllers/authController");

const verifyToken = require("../middleware/authMiddleware");

// Configure multer disk storage for profile resumes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/resumes/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed!"), false);
  }
});

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// Protected routes below
router.get("/profile/:userId", verifyToken, getProfile);
router.put("/profile/:userId", verifyToken, updateProfile);
router.put("/profile/:userId/resume", verifyToken, upload.single("resume"), updateResume);

module.exports = router;
