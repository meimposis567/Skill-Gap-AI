const User = require("../models/User");
const JobRole = require("../models/JobRole");
const Notification = require("../models/Notification");
const { PDFParse } = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { extractSkillsFromText, extractSkillEvidenceFromText, normalizeSkill, expandSkills, isPartialMatch } = require("../utils/extractSkills");
const { calculateScore } = require("../utils/scoreCalculator");
const { ensureCurrentUserAccess } = require("../utils/requestAccess");

// Real-world salary benchmarks (Est. 2024/2025)
const SALARY_MAP = {
  "Frontend Developer": { base: 85000, perPoint: 600 },
  "Backend Developer": { base: 90000, perPoint: 650 },
  "Full Stack Developer": { base: 100000, perPoint: 700 },
  "Data Scientist": { base: 110000, perPoint: 800 },
  "DevOps Engineer": { base: 105000, perPoint: 750 },
  "Cloud Architect": { base: 130000, perPoint: 900 },
  "Mobile Developer": { base: 88000, perPoint: 600 },
  "UI/UX Designer": { base: 80000, perPoint: 500 },
  "Project Manager": { base: 95000, perPoint: 700 },
  "Cybersecurity Analyst": { base: 105000, perPoint: 800 },
  "Default": { base: 75000, perPoint: 400 }
};

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const debugLog = (msg) => {
  const logMsg = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(path.join(__dirname, "../debug.log"), logMsg);
  } catch (e) {}
};

const getReadinessLevel = (matchPercentage) => {
  if (matchPercentage >= 75) return "High";
  if (matchPercentage >= 40) return "Moderate";
  return "Low";
};

const buildAiInsight = (breakdown) =>
  `You matched ${breakdown.matched} skills with ${breakdown.partial} partial matches. Focus on clearing ${breakdown.missing} missing skills.`;

const buildAnalysisPayload = ({ analysisEntry, extractedSkills, score, breakdown }) => ({
  extractedSkills,
  matched: analysisEntry.matched,
  partial: analysisEntry.partialMatched,
  partialMatched: analysisEntry.partialMatched,
  missing: analysisEntry.missing,
  score,
  breakdown,
  matchPercentage: analysisEntry.matchPercentage,
  readinessLevel: analysisEntry.readinessLevel,
  aiInsight: analysisEntry.aiInsight,
  recommendations: analysisEntry.recommendations,
  analyzedAt: analysisEntry.analyzedAt,
  timestamp: analysisEntry.analyzedAt,
  role: analysisEntry.role,
  mlPrediction: analysisEntry.mlPrediction,
  atsAnalysis: analysisEntry.atsAnalysis,
});

const extractJsonPayload = (text) => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, "").trim();
  return JSON.parse(jsonText);
};

// ── SEMANTIC ALIAS TABLE ──────────────────────────────────────────────────────
// Maps versioned/variant user skill names → canonical role-skill names.
// e.g. user profile has "HTML5", job requires "html" → should match.
const SKILL_ALIASES = {
  // HTML
  "html5": "html",
  "html 5": "html",
  // CSS
  "css3": "css",
  "css 3": "css",
  "tailwind css": "tailwind",
  "tailwindcss": "tailwind",
  "tailwind": "tailwind",
  // JavaScript
  "javascript es6+": "javascript",
  "javascript (es6+)": "javascript",
  "js es6": "javascript",
  "es6+": "javascript",
  "ecmascript": "javascript",
  "js": "javascript",
  // React
  "react.js": "react",
  "reactjs": "react",
  "react js": "react",
  // Node.js
  "node.js": "node.js",
  "nodejs": "node.js",
  "node js": "node.js",
  // Express
  "express.js": "express.js",
  "expressjs": "express.js",
  "express js": "express.js",
  // REST API
  "rest apis": "rest api",
  "restful api": "rest api",
  "restful apis": "rest api",
  "api integration": "rest api",
  // Git
  "github": "git",
  "gitlab": "git",
  "version control": "git",
  // MongoDB
  "mongoose": "mongodb",
  // TypeScript
  "typescript": "typescript",
  "ts": "typescript",
  // JWT / Auth
  "jwt": "authentication",
  "json web token": "authentication",
};

/**
 * Resolves a user-supplied skill name to its canonical form used in role requirements.
 * Falls through: alias table → normalizeSkill → as-is
 */
const resolveSkillAlias = (skill) => {
  const norm = normalizeSkill(skill);
  return SKILL_ALIASES[norm] || norm;
};

/**
 * Returns true when `userSkill` semantically satisfies `roleSkill`.
 * Checks: exact normalised match, alias resolution, and substring containment.
 */
const semanticMatch = (userSkill, roleSkill) => {
  const normRole = normalizeSkill(roleSkill);
  const normUser = normalizeSkill(userSkill);
  const resolved = resolveSkillAlias(userSkill); // e.g. "html5" → "html"
  if (normUser === normRole) return true;
  if (resolved === normRole) return true;
  // substring: "tailwind css" contains "tailwind"
  if (normUser.includes(normRole) || normRole.includes(normUser)) return true;
  return false;
};

const cleanRoleSkills = (skills, roleSkills) => {
  const validRoleSkills = roleSkills || [];
  return [...new Set((skills || []).filter((skill) =>
    validRoleSkills.some((roleSkill) => normalizeSkill(roleSkill) === normalizeSkill(skill))
  ))];
};

const normalizeAiClassification = (payload, roleSkills) => {
  const normalized = { matched: [], partial: [], missing: [] };
  if (Array.isArray(payload?.analysis)) {
    for (const item of payload.analysis) {
      if (!item?.skill || !item?.status) continue;
      const status = String(item.status).toLowerCase();
      if (status === "matched") normalized.matched.push(item.skill);
      if (status === "partial") normalized.partial.push(item.skill);
      if (status === "missing") normalized.missing.push(item.skill);
    }
  } else {
    normalized.matched = payload?.matched || [];
    normalized.partial = payload?.partial || [];
    normalized.missing = payload?.missing || [];
  }
  normalized.matched = cleanRoleSkills(normalized.matched, roleSkills);
  normalized.partial = cleanRoleSkills(normalized.partial, roleSkills);
  normalized.missing = cleanRoleSkills(normalized.missing, roleSkills);
  return normalized;
};

const buildSemanticPrompt = ({ role, roleSkills, sourceText, skillEvidence, profileSkills, certifications }) => `
You are an expert technical interviewer analyzing a resume for the role: "${role}".

Target Skills:
${JSON.stringify(roleSkills)}

User Profile:
- Profile Skills: ${JSON.stringify(profileSkills)}
- Certifications: ${JSON.stringify(certifications)}
- Resume Logic Signals: ${JSON.stringify(skillEvidence)}

Resume Content:
"""
${sourceText}
"""

Instructions:
1. Classify EVERY target skill into one of: "matched", "partial", or "missing".
2. Use SEMANTIC MATCHING:
   - "MERN" implies matching for MongoDB, Express, React, and Node.js.
   - "Frontend development" matches "React" partially or fully depending on context.
   - Tools like "Tailwind" or "Boostrap" are strong evidence for "CSS".
3. Return valid JSON only in this format:

{
  "matched": [],
  "partial": [],
  "missing": [],
  "aiInsight": "A PERSONALIZED 2-3 SENTENCE summary of user readiness and top priority gaps."
}
`;

const extractResumeText = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: dataBuffer, verbosity: 0 });
    const data = await parser.getText();
    return data.text?.trim() || "";
  } catch (err) {
    debugLog(`PDF Extraction Error: ${err.message}`);
    return "";
  }
};

// POST /api/skills/analyze
exports.analyzeSkills = async (req, res) => {
  try {
    const userId = ensureCurrentUserAccess(req, res, req.body.userId);
    if (!userId) return;

    const { role } = req.body;
    if (!userId || !role) return res.status(400).json({ message: "userId and role are required ❌" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found ❌" });

    const job = await JobRole.findOne({ role: { $regex: new RegExp(`^${role}$`, "i") } });
    if (!job) return res.status(404).json({ message: "Role not found ❌" });

    // 1. Setup Role Skills & Baselines
    if (role.toLowerCase().includes("full stack") || role.toLowerCase().includes("fullstack")) {
      ["Testing", "Deployment", "System Design"].forEach(b => {
        if (!job.skills.includes(b)) job.skills.push(b);
      });
    }
    const roleSkills = job.skills;

    // 2. Extract Text
    const profileSections = [];
    if (user.skills.length > 0) profileSections.push(`Profile Skills: ${user.skills.join(", ")}`);
    if (user.certifications?.length > 0) profileSections.push(`Certifications: ${user.certifications.join(", ")}`);
    
    let userText = profileSections.join("\n") || "No profile skills listed.";
    if (req.file) {
      const extracted = await extractResumeText(req.file.path);
      if (extracted && extracted.length > 50) {
        // Only delete the old file if we successfully extracted text from the new one
        if (user.resume) {
          const oldPath = path.join(__dirname, "../uploads/resumes", user.resume);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
              debugLog(`Cleaned up old resume: ${user.resume}`);
            } catch (err) {
              debugLog(`Error deleting old resume: ${err.message}`);
            }
          }
        }
        
        userText += "\n\nResume Content:\n" + extracted;
        user.resume = req.file.filename;
        debugLog(`New resume text extracted: ${extracted.length} chars`);
      } else {
        // If extraction failed or file was too small, we might want to delete the newly uploaded junk file
        try {
          fs.unlinkSync(req.file.path);
          debugLog(`Deleted invalid upload: ${req.file.filename}`);
        } catch (e) {}
      }
    } else if (user.resume) {
      const oldPath = path.join(__dirname, "../uploads/resumes", user.resume);
      if (fs.existsSync(oldPath)) {
        const extracted = await extractResumeText(oldPath);
        if (extracted && extracted.length > 50) {
          userText += "\n\nResume Content:\n" + extracted;
          debugLog(`Existing resume text extracted: ${extracted.length} chars`);
        }
      }
    }

    // 3. Deterministic Evidence (Local NLP)
    const skillEvidence = extractSkillEvidenceFromText(userText, roleSkills);
    const localDirect = skillEvidence.filter(e => e.matchType === "direct").map(e => e.skill);
    const localPartial = skillEvidence.filter(e => e.matchType !== "direct").map(e => e.skill);
    
    // 4. AI Analysis
    const prompt = buildSemanticPrompt({
      role,
      roleSkills,
      sourceText: userText.substring(0, 10000),
      skillEvidence,
      profileSkills: user.skills,
      certifications: user.certifications
    });

    let aiClassification = { matched: [], partial: [], missing: [] };
    let aiInsight = "";
    let mlGapData = null;   // will hold Flask /gap-analysis response
    let mlPrediction = null;

    // ── FLASK /gap-analysis (runs BEFORE Gemini — used as fallback) ──────────
    try {
      const allUserSkills = [...new Set([
        ...user.skills,
        ...(user.certifications || [])
      ])].filter(Boolean);
      const skillsToSend = allUserSkills.length > 0 ? allUserSkills : ["general"];

      const [gapResponse, predictResponse] = await Promise.allSettled([
        axios.post("http://localhost:5001/gap-analysis", {
          skills: skillsToSend,
          target_role: role
        }, { timeout: 6000 }),
        axios.post("http://localhost:5001/predict", {
          skills: skillsToSend
        }, { timeout: 6000 })
      ]);

      if (gapResponse.status === "fulfilled" && gapResponse.value.data) {
        mlGapData = gapResponse.value.data;
        debugLog(`Flask gap-analysis: matched=${mlGapData.matched_skills?.length}, missing=${mlGapData.missing_skills?.length}, score=${mlGapData.match_score}`);
      }
      if (predictResponse.status === "fulfilled" && predictResponse.value.data) {
        const pd = predictResponse.value.data;
        mlPrediction = {
          predicted_role: pd.predicted_role,
          confidence: pd.confidence,
          top_predictions: pd.top_predictions || []
        };
        debugLog(`Flask predict: ${mlPrediction.predicted_role} (${mlPrediction.confidence}%)`);
      }
    } catch (err) {
      debugLog(`Flask API call failed: ${err.message}`);
    }

    // ── GEMINI AI (tries 3 models) ───────────────────────────────────────────
    const models = ["gemini-1.5-flash", "gemini-pro", "gemini-flash-latest"];
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const payload = extractJsonPayload(result.response.text());
        aiClassification = normalizeAiClassification(payload, roleSkills);
        aiInsight = payload.aiInsight || "";
        debugLog(`Gemini success with model: ${modelName}`);
        break;
      } catch (err) {
        debugLog(`Gemini model ${modelName} failed: ${err.message}`);
      }
    }

    // ── If ALL Gemini models failed, promote Flask gap results to aiClassification ──
    if (aiClassification.matched.length === 0 && mlGapData) {
      debugLog("Gemini failed — using Flask gap-analysis as AI classification fallback");
      // Flask matched_skills are already canonical role skill names
      aiClassification.matched = mlGapData.matched_skills || [];
      aiClassification.missing = mlGapData.missing_skills || [];
      aiClassification.partial = [];
    }

    // 5. HYBRID MERGE & VALIDATION
    const expandedUserSkills = expandSkills(user.skills || []);
    const normalizedText = normalizeSkill(userText);
    const rawUserSkills = user.skills || [];

    // --- MATCHED LAYER ---
    // Priority: localDirect > semantic profile match > AI match (with anti-hallucination)
    let matched = roleSkills.filter(skill => {
      let reason = "";

      // 1. Local NLP found direct evidence in resume text
      if (localDirect.includes(skill)) { reason = "localDirect"; }

      // 2. Semantic profile match — handles "HTML5"→"html", "Tailwind CSS"→"tailwind" etc.
      else if (!reason && rawUserSkills.some(us => semanticMatch(us, skill))) {
        reason = "semanticProfileMatch";
      }

      // 3. AI / Flask matched, AND skill token exists anywhere in the text (anti-hallucination)
      else if (!reason && aiClassification.matched.some(s => normalizeSkill(s) === normalizeSkill(skill))) {
        if (normalizedText.includes(normalizeSkill(skill))) {
          reason = "AI+AntiHallucinationPass";
        }
      }

      // 4. Flask gap-analysis explicitly matched this skill
      else if (!reason && mlGapData?.matched_skills?.some(s => normalizeSkill(s) === normalizeSkill(skill))) {
        reason = "FlaskGapMatched";
      }

      if (reason) debugLog(`[MATCH] ${skill} → ${reason}`);
      return !!reason;
    });

    // --- PARTIAL LAYER ---
    let partial = roleSkills.filter(skill => {
      if (matched.includes(skill)) return false;

      // Local partial / inferred evidence from NLP
      if (localPartial.includes(skill)) return true;

      // Expanded skill relations (e.g. MERN → React, Node, etc.)
      if (expandedUserSkills.some(us => semanticMatch(us, skill) || isPartialMatch(us, skill))) return true;

      // Certifications count as partial for related skills
      if (user.certifications?.some(c => semanticMatch(c, skill))) return true;

      // AI partial match with loose text presence guard
      if (aiClassification.partial.some(s => normalizeSkill(s) === normalizeSkill(skill))) {
        return normalizedText.includes(normalizeSkill(skill)) || normalizedText.length > 50;
      }

      return false;
    });

    const missing = roleSkills.filter(s => !matched.includes(s) && !partial.includes(s));
    debugLog(`[RESULT] matched=${matched.length}, partial=${partial.length}, missing=${missing.length}`);

    // 5.5 ATS OPTIMIZATION ANALYSIS
    const calculateAtsScore = (text, roleSkills) => {
      const lowerText = text.toLowerCase();
      let score = 0;
      const suggestions = [];
      const missingKeywords = [];

      // Check Sections (Experience, Education, Contact, Skills)
      const sections = {
        experience: ["experience", "work history", "employment"],
        education: ["education", "academic", "university", "college"],
        skills: ["skills", "technical", "competencies"],
        contact: ["contact", "email", "phone", "linkedin"]
      };

      let sectionScore = 0;
      Object.entries(sections).forEach(([name, keywords]) => {
        if (keywords.some(k => lowerText.includes(k))) sectionScore += 10;
        else suggestions.push(`Add a clear '${name.toUpperCase()}' section header.`);
      });
      score += sectionScore;

      // Keyword Matching (Role Skills)
      const matchedKeywords = roleSkills.filter(s => {
        const normS = normalizeSkill(s);
        // Direct inclusion
        if (lowerText.includes(normS)) return true;
        // Alias inclusion (e.g. if role needs "html" and text has "html5")
        // We check if any alias for 's' exists in the text
        const aliases = Object.entries(SKILL_ALIASES)
          .filter(([alias, canonical]) => canonical === normS)
          .map(([alias]) => alias);
        
        return aliases.some(a => lowerText.includes(a));
      });
      
      const keywordRatio = roleSkills.length > 0 ? (matchedKeywords.length / roleSkills.length) : 0;
      score += (keywordRatio * 50); // Up to 50 points for keywords

      roleSkills.forEach(s => {
        const normS = normalizeSkill(s);
        const hasKeyword = lowerText.includes(normS) || 
          Object.entries(SKILL_ALIASES).some(([a, c]) => c === normS && lowerText.includes(a));
        
        if (!hasKeyword) missingKeywords.push(s);
      });

      // Action Verbs Check
      const actionVerbs = ["developed", "managed", "implemented", "optimized", "built", "engineered", "led", "designed"];
      const foundVerbs = actionVerbs.filter(v => lowerText.includes(v));
      if (foundVerbs.length >= 3) score += 10;
      else suggestions.push("Use more action verbs like 'Optimized', 'Engineered', or 'Implemented'.");

      debugLog(`ATS Analysis: Score=${score}, Sections=${sectionScore}, KeywordsMatched=${matchedKeywords.length}/${roleSkills.length}, Verbs=${foundVerbs.length}`);

      return {
        score: Math.min(100, Math.round(score)),
        missingKeywords: missingKeywords.slice(0, 8),
        suggestions: suggestions.slice(0, 3)
      };
    };

    const atsAnalysis = calculateAtsScore(userText, roleSkills);

    // 6. Scoring
    let { score, breakdown } = calculateScore({ matched, partial, missing, roleSkills });

    // Prefer Flask ML score, but ONLY if it's a meaningful value.
    // If Flask returns 0 but we have matched skills, the local score is more accurate.
    const rawMlScore = mlGapData?.match_score;
    const mlScore = typeof rawMlScore === 'object' ? rawMlScore.overall : rawMlScore;
    let finalScore = score; // default to local score
    if (typeof mlScore === 'number' && mlScore > 0) {
      finalScore = mlScore;
    }
    // Safety net: if we have matched skills, score should never be 0
    if (finalScore === 0 && matched.length > 0) {
      finalScore = score > 0 ? score : Math.round((matched.length / roleSkills.length) * 100);
      debugLog(`Score safety net activated: ${finalScore}% (matched=${matched.length})`);
    }

    // 7. Recommendations
    const recommendations = [];
    [...missing, ...partial].forEach(gap => {
      const rec = job.recommendations?.find(r => normalizeSkill(r.skill) === normalizeSkill(gap));
      recommendations.push(rec ? {
        skill: gap,
        courses: rec.courses || [],
        certifications: rec.certifications || [],
        learningPath: rec.learningPath || ""
      } : {
        skill: gap,
        courses: [`Master ${gap} online`],
        certifications: [`${gap} Certification`],
        learningPath: `Learn ${gap} fundamentals.`
      });
    });

    // 8. Final Construction
    const analysisEntry = {
      role,
      matchPercentage: finalScore,
      matched,
      partialMatched: partial,
      missing,
      readinessLevel: getReadinessLevel(finalScore),
      aiInsight: aiInsight || buildAiInsight(breakdown),
      recommendations,
      mlPrediction,
      atsAnalysis,
      analyzedAt: new Date()
    };

    user.progressHistory.push(analysisEntry);
    await user.save();

    await Notification.create({
      userId: user._id,
      text: `Analysis for ${role} completed: ${score}% match.`,
      icon: "check_circle"
    }).catch(() => {});

    console.log("=== FINAL SCORE DEBUG ===");
    console.log("mlGapData:", JSON.stringify(mlGapData?.match_score));
    console.log("finalScore:", finalScore);
    console.log("score:", score);
    console.log("=========================");
    res.json(buildAnalysisPayload({ analysisEntry, extractedSkills: matched, score: finalScore, breakdown }));

  } catch (error) {
    console.error("Critical Analysis Error:", error);
    res.status(500).json({ message: "Internal Analysis Error", error: error.message });
  }
};

// GET /api/skills/roles
exports.getRoles = async (req, res) => {
  try {
    const roles = await JobRole.find({}, "role description skills");
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: "Failed to get roles ❌", error: error.message });
  }
};

// POST /api/skills/roles
exports.addRole = async (req, res) => {
  try {
    const { role, skills, recommendations, description } = req.body;
    if (!role || !skills) return res.status(400).json({ message: "role and skills are required ❌" });
    const exists = await JobRole.findOne({ role: { $regex: new RegExp(`^${role}$`, "i") } });
    if (exists) return res.status(409).json({ message: "Role already exists ❌" });
    const jobRole = new JobRole({ role, skills, recommendations: recommendations || [], description });
    await jobRole.save();
    res.status(201).json({ message: "Job role added ✅", jobRole });
  } catch (error) {
    res.status(500).json({ message: "Failed to add role ❌", error: error.message });
  }
};

// GET /api/skills/progress/:userId
exports.getProgress = async (req, res) => {
  try {
    const userId = ensureCurrentUserAccess(req, res, req.params.userId);
    if (!userId) return;
    const user = await User.findById(userId).select("name progressHistory");
    if (!user) return res.status(404).json({ message: "User not found ❌" });
    const history = [...user.progressHistory].sort((a, b) => new Date(b.analyzedAt) - new Date(a.analyzedAt));
    const timeline = {};
    for (const entry of history) {
      if (!timeline[entry.role]) timeline[entry.role] = [];
      timeline[entry.role].push({
        matchPercentage: entry.matchPercentage,
        analyzedAt: entry.analyzedAt,
        matchedCount: entry.matched?.length || 0,
        matchedSkills: entry.matched || [],
        missingCount: entry.missing?.length || 0,
      });
    }
    res.json({ userId: user._id, name: user.name, totalAnalyses: history.length, history, timeline });
  } catch (error) {
    res.status(500).json({ message: "Failed to get progress ❌", error: error.message });
  }
};

// GET /api/skills/dashboard/:userId
exports.getDashboard = async (req, res) => {
  try {
    const userId = ensureCurrentUserAccess(req, res, req.params.userId);
    if (!userId) return;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found ❌" });
    const latestByRole = {};
    for (const entry of user.progressHistory) {
      if (!latestByRole[entry.role] || new Date(entry.analyzedAt) > new Date(latestByRole[entry.role].analyzedAt)) {
        latestByRole[entry.role] = entry;
      }
    }
    const rolesSummary = Object.values(latestByRole).map(e => ({
      role: e.role,
      matchPercentage: e.matchPercentage,
      lastAnalyzed: e.analyzedAt,
      readiness: getReadinessLevel(e.matchPercentage),
    })).sort((a,b) => new Date(b.lastAnalyzed) - new Date(a.lastAnalyzed));
    const latestAnalysis = user.progressHistory.length > 0 ? user.progressHistory[user.progressHistory.length - 1] : null;
    
    if (latestAnalysis) {
      debugLog(`Dashboard - Latest analysis for ${latestAnalysis.role} has ATS score: ${latestAnalysis.atsAnalysis?.score}`);
    }

    res.json({
      user: { id: user._id, name: user.name, email: user.email, totalSkills: user.skills.length, totalCertifications: user.certifications.length, careerGoal: user.careerGoal, skills: user.skills, certifications: user.certifications },
      totalAnalyses: user.progressHistory.length,
      rolesSummary,
      latestAnalysis: latestAnalysis ? { 
        ...latestAnalysis.toObject(), 
        mlPrediction: latestAnalysis.mlPrediction,
        atsAnalysis: latestAnalysis.atsAnalysis 
      } : null 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get dashboard ❌", error: error.message });
  }
};

// GET /api/skills/reports/:userId
exports.getReports = async (req, res) => {
  try {
    const userId = ensureCurrentUserAccess(req, res, req.params.userId);
    if (!userId) return;
    const { role } = req.query; // Optional role filter

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found ❌" });

    // Global stats
    const allHistory = [...user.progressHistory].sort((a, b) => new Date(a.analyzedAt) - new Date(b.analyzedAt));
    const availableRoles = Array.from(new Set(allHistory.map(e => e.role)));

    // Filter by role if requested
    const history = role 
      ? allHistory.filter(e => e.role === role)
      : allHistory;

    const latest = history[history.length - 1] || null;
    const scoreTrend = history.map(e => ({ date: e.analyzedAt, role: e.role, score: e.matchPercentage }));
    const avgScore = history.length ? history.reduce((sum, e) => sum + e.matchPercentage, 0) / history.length : 0;

    const missingFrequency = {};
    for (const entry of history) {
      for (const skill of entry.missing || []) {
        missingFrequency[skill] = (missingFrequency[skill] || 0) + 1;
      }
    }
    const topMissingSkills = Object.entries(missingFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count }));

    const improvement = history.length > 1 ? history[history.length - 1].matchPercentage - history[0].matchPercentage : 0;
    
    // Use target role for salary calculation
    const reportRole = role || latest?.role || "Default";
    const roleStats = SALARY_MAP[reportRole] || SALARY_MAP["Default"];
    
    const currentScore = latest?.matchPercentage || 0;
    const currentSalary = roleStats.base + (currentScore * roleStats.perPoint);
    const maxPotential = roleStats.base + (100 * roleStats.perPoint);
    const potentialLift = maxPotential - currentSalary;

    res.json({
      totalAnalyses: allHistory.length,
      roleAnalyses: history.length,
      availableRoles,
      selectedRole: role || null,
      avgScore: parseFloat(avgScore.toFixed(1)),
      improvement: parseFloat(improvement.toFixed(1)),
      currentScore: currentScore,
      currentRole: latest?.role || null,
      currentSalary: Math.round(currentSalary),
      potentialLift: Math.round(potentialLift),
      scoreTrend,
      topMissingSkills,
      matchedCount: latest?.matched?.length || 0,
      missingCount: latest?.missing?.length || 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get reports ❌", error: error.message });
  }
};

// PUT /api/skills/master-skill
exports.masterSkill = async (req, res) => {
  try {
    const userId = ensureCurrentUserAccess(req, res, req.body.userId);
    if (!userId) return;
    const { skillName, role } = req.body;
    console.log(`[MasterSkill] Request: userId=${userId}, skill=${skillName}, role=${role}`);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found ❌" });
    if (user.progressHistory.length === 0) return res.status(400).json({ message: "No analysis context found ❌" });
    
    // Find specific role analysis or default to latest
    const trimmedRole = role?.trim();
    const analysisIndex = trimmedRole 
      ? user.progressHistory.findLastIndex(h => h.role?.trim() === trimmedRole)
      : user.progressHistory.length - 1;

    const targetAnalysis = analysisIndex !== -1 ? user.progressHistory[analysisIndex] : user.progressHistory[user.progressHistory.length - 1];
    
    // Convert Mongoose arrays to plain JS arrays for manipulation
    let matched = [...(targetAnalysis.matched || [])];
    let missing = [...(targetAnalysis.missing || [])];
    let partialMatched = [...(targetAnalysis.partialMatched || [])];

    const skillNorm = normalizeSkill(skillName);
    const skillIdxMissing = missing.findIndex(s => normalizeSkill(s) === skillNorm);
    const skillIdxPartial = partialMatched.findIndex(s => normalizeSkill(s) === skillNorm);

    if (skillIdxMissing === -1 && skillIdxPartial === -1) {
        console.log(`[MasterSkill] Skill "${skillName}" (normalized: "${skillNorm}") already mastered or not found`);
        if (matched.some(s => normalizeSkill(s) === skillNorm)) {
            return res.json({ message: "Skill already mastered ✅", latest: targetAnalysis });
        }
        return res.status(400).json({ message: "Skill not found in gaps ❌" });
    }
    
    // Perform Move
    const movingSkill = skillIdxMissing !== -1 ? missing[skillIdxMissing] : partialMatched[skillIdxPartial];
    missing = missing.filter((_, i) => i !== skillIdxMissing);
    partialMatched = partialMatched.filter((_, i) => i !== skillIdxPartial);
    
    if (!matched.some(s => normalizeSkill(s) === skillNorm)) {
        matched.push(movingSkill || skillName);
    }
    
    // Update targetAnalysis with plain arrays
    targetAnalysis.matched = matched;
    targetAnalysis.missing = missing;
    targetAnalysis.partialMatched = partialMatched;
    // Keep recommendations so the UI doesn't jump; the frontend can decide how to display them
    // targetAnalysis.recommendations = (targetAnalysis.recommendations || []).filter(r => (r.skill || '').toLowerCase() !== skillLower);
    
    const roleSkills = [...new Set([...matched, ...partialMatched, ...missing])];
    const { score, breakdown } = calculateScore({ matched, partial: partialMatched, missing, roleSkills });
    
    targetAnalysis.matchPercentage = score;
    targetAnalysis.readinessLevel = getReadinessLevel(score);
    targetAnalysis.aiInsight = buildAiInsight(breakdown);
    
    user.markModified('progressHistory');
    await user.save();
    
    console.log(`[MasterSkill] Success! New Score: ${score}%`);
    await Notification.create({ userId, text: `Congratulations! You have mastered the skill: ${skillName} 🎓`, icon: "school" }).catch(() => {});
    res.json({ message: "Skill mastered! ✅", latest: targetAnalysis });
  } catch (error) {
    res.status(500).json({ message: "Failed to update skill ❌", error: error.message });
  }
};

// PUT /api/skills/unmaster-skill
exports.unmasterSkill = async (req, res) => {
  try {
    const userId = ensureCurrentUserAccess(req, res, req.body.userId);
    if (!userId) return;
    const { skillName, role } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found ❌" });
    if (user.progressHistory.length === 0) return res.status(400).json({ message: "No analysis context found ❌" });
    
    // Find specific role analysis or default to latest
    const trimmedRole = role?.trim();
    const analysisIndex = trimmedRole 
      ? user.progressHistory.findLastIndex(h => h.role?.trim() === trimmedRole)
      : user.progressHistory.length - 1;

    const targetAnalysis = analysisIndex !== -1 ? user.progressHistory[analysisIndex] : user.progressHistory[user.progressHistory.length - 1];
    
    const skillIdxMatched = targetAnalysis.matched.findIndex(s => s.toLowerCase() === skillName.toLowerCase());
    if (skillIdxMatched === -1) return res.status(400).json({ message: "Skill not in matched list ❌" });
    
    // Move skill from matched back to missing
    targetAnalysis.matched = targetAnalysis.matched.filter((s) => s.toLowerCase() !== skillName.toLowerCase());
    if (!targetAnalysis.missing.some(s => s.toLowerCase() === skillName.toLowerCase())) {
        targetAnalysis.missing.push(skillName);
    }
    
    // Recalculate score
    const roleSkills = [...new Set([...targetAnalysis.matched, ...targetAnalysis.partialMatched, ...targetAnalysis.missing])];
    const { score, breakdown } = calculateScore({ matched: targetAnalysis.matched, partial: targetAnalysis.partialMatched, missing: targetAnalysis.missing, roleSkills });
    targetAnalysis.matchPercentage = score;
    targetAnalysis.readinessLevel = getReadinessLevel(score);
    targetAnalysis.aiInsight = buildAiInsight(breakdown);
    
    user.markModified('progressHistory');
    await user.save();
    const plainLatest = {
      role: targetAnalysis.role, matchPercentage: targetAnalysis.matchPercentage,
      matched: targetAnalysis.matched.toObject ? targetAnalysis.matched.toObject() : [...targetAnalysis.matched],
      partialMatched: targetAnalysis.partialMatched.toObject ? targetAnalysis.partialMatched.toObject() : [...targetAnalysis.partialMatched],
      missing: targetAnalysis.missing.toObject ? targetAnalysis.missing.toObject() : [...targetAnalysis.missing],
      readinessLevel: targetAnalysis.readinessLevel, aiInsight: targetAnalysis.aiInsight, recommendations: targetAnalysis.recommendations, analyzedAt: targetAnalysis.analyzedAt,
      mlPrediction: targetAnalysis.mlPrediction,
      atsAnalysis: targetAnalysis.atsAnalysis
    };
    res.json({ message: "Skill unmastered ✅", latest: plainLatest });
  } catch (error) {
    res.status(500).json({ message: "Failed to update skill ❌", error: error.message });
  }
};

// POST /api/skills/mock-interview
exports.generateMockInterview = async (req, res) => {
  try {
    const userId = ensureCurrentUserAccess(req, res, req.body.userId);
    if (!userId) return;

    const { role, missingSkills, partialSkills } = req.body;
    
    if (!missingSkills || !partialSkills) {
      return res.status(400).json({ message: "Missing and partial skills are required." });
    }

    const targetSkills = [...partialSkills, ...missingSkills].slice(0, 5); // Pick top 5 gap skills
    if (targetSkills.length === 0) {
      return res.json({ questions: [] });
    }

    const prompt = `
      You are an expert technical interviewer for a ${role || "Software Engineering"} position.
      The candidate is currently learning these specific skills: ${targetSkills.join(", ")}.
      
      Generate exactly 3 to 5 realistic, high-quality technical interview questions that specifically test their knowledge on these specific gap skills.
      For each question, provide a short "hint" AND a concise "suggestedAnswer" (2-3 sentences explaining the ideal response).

      You must return ONLY a JSON array of objects with this exact structure:
      [
        {
          "skill": "The skill being tested",
          "question": "The interview question",
          "hint": "A 1-sentence hint or key concept to study",
          "suggestedAnswer": "A concise explanation of the ideal answer"
        }
      ]
      No markdown, no backticks, just the JSON array.
    `;

    let result = null;
    let modelUsed = "";
    const models = ["gemini-pro", "gemini-flash-latest"];
    
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(prompt);
        modelUsed = modelName;
        break; // Break on success
      } catch (e) {
        debugLog(`Mock Interview - Model ${modelName} failed: ${e.message}`);
      }
    }

    let questions = [];

    if (!result) {
      debugLog("All AI models failed, using hard fallback questions");
      questions = targetSkills.map(s => ({
        skill: s,
        question: `Can you explain the core architecture and fundamental principles of ${s}?`,
        hint: `Focus on why ${s} is used and its primary benefits in a production environment.`,
        suggestedAnswer: `${s} is a powerful tool used in modern development. To answer this well, you should explain its primary function, how it solves specific pain points (like scalability or efficiency), and give a quick example of a real-world scenario where it is essential.`
      }));
    } else {
      const textResult = result.response.text();
      const jsonMatch = textResult.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? jsonMatch[0] : textResult;
      
      try {
        questions = JSON.parse(jsonText);
      } catch (e) {
        debugLog("JSON Parse failed for mock interview, returning fallback");
        questions = targetSkills.map(s => ({
          skill: s,
          question: `Explain the core concepts and use cases of ${s}.`,
          hint: `Study the fundamentals of ${s}.`,
          suggestedAnswer: `A good answer for ${s} should cover its basic definition, key features, and why it is preferred over alternatives in its field.`
        }));
      }
    }

    res.json({ questions });
  } catch (error) {
    console.error("Mock Interview generation error:", error);
    res.status(500).json({ message: "Failed to generate mock interview", error: error.message });
  }
};
