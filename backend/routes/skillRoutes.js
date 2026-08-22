const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const verifyToken = require("../middleware/authMiddleware");

// Configure multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/resumes/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed! ❌"), false);
  }
};

const upload = multer({ storage, fileFilter });

const {
  analyzeSkills,
  getRoles,
  addRole,
  getProgress,
  getDashboard,
  getReports,
  masterSkill,
  unmasterSkill,
  generateMockInterview,
} = require("../controllers/skillController");

// ALL routes here are protected
router.use(verifyToken);

// PUT  /api/skills/master-skill
router.put("/master-skill", masterSkill);

// PUT  /api/skills/unmaster-skill
router.put("/unmaster-skill", unmasterSkill);

// POST /api/skills/mock-interview
router.post("/mock-interview", generateMockInterview);

// POST /api/skills/analyze
router.post("/analyze", upload.single("resume"), analyzeSkills);

// GET  /api/skills/roles
router.get("/roles", getRoles);

// POST /api/skills/roles
router.post("/roles", addRole);

// GET  /api/skills/progress/:userId
router.get("/progress/:userId", getProgress);

// GET  /api/skills/dashboard/:userId
router.get("/dashboard/:userId", getDashboard);

// GET  /api/skills/reports/:userId
router.get("/reports/:userId", getReports);

module.exports = router;
