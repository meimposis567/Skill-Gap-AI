const mongoose = require("mongoose");

const jobRoleSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, unique: true, trim: true },
    skills: [{ type: String, trim: true }],
    // Recommendations linked to each skill
    recommendations: [
      {
        skill: { type: String, trim: true },
        courses: [String],
        certifications: [String],
        learningPath: String,
      },
    ],
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobRole", jobRoleSchema);
