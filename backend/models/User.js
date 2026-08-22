const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    skills: [{ type: String, trim: true }],
    certifications: [{ type: String, trim: true }],
    careerGoal: { type: String, trim: true },
    resume: { type: String }, // Store filename of uploaded resume
    // Progress tracking: history of analyses
    progressHistory: [
      {
        role: String,
        matchPercentage: Number,
        matched: [String],
        partialMatched: [String],
        missing: [String],
        readinessLevel: String,
        aiInsight: String,
        recommendations: [{ type: mongoose.Schema.Types.Mixed }],
        mlPrediction: { type: mongoose.Schema.Types.Mixed },
        atsAnalysis: { type: mongoose.Schema.Types.Mixed },
        analyzedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
