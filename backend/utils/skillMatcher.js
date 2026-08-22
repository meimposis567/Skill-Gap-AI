/**
 * skillMatcher.js
 * 
 * Implements 3-tier skill matching as required by the project:
 *   1. Exact match   → matched
 *   2. Partial match → partialMatched (e.g., "react" ↔ "react.js", "node" ↔ "node.js")
 *   3. Missing       → missing
 *
 * Uses NLP-style normalization:
 *   - Lowercase
 *   - Strip punctuation / version numbers (js, .js suffixes)
 *   - Common alias map (e.g., "javascript" ↔ "js")
 */

// Common skill aliases for semantic matching
const SKILL_ALIASES = {
  "js": "javascript",
  "ts": "typescript",
  "py": "python",
  "reactjs": "react",
  "react.js": "react",
  "vuejs": "vue",
  "vue.js": "vue",
  "nodejs": "node",
  "node.js": "node",
  "expressjs": "express",
  "express.js": "express",
  "mongodb": "mongo",
  "postgres": "postgresql",
  "ml": "machine learning",
  "ai": "artificial intelligence",
  "nlp": "natural language processing",
  "dl": "deep learning",
  "css3": "css",
  "html5": "html",
  "scikit": "scikit-learn",
  "sklearn": "scikit-learn",
};

/**
 * Normalize a skill string for comparison
 */
function normalize(skill) {
  let s = skill.toLowerCase().trim();
  // Remove trailing version patterns like "2", "3", ".js", ".py"
  s = s.replace(/\.js$|\.py$|\.ts$/, "");
  s = s.replace(/\s+/g, " ");
  // Apply alias map
  return SKILL_ALIASES[s] || s;
}

/**
 * Check if two skills are partially related
 * (one contains the other after normalization)
 */
function isPartialMatch(userSkill, jobSkill) {
  const u = normalize(userSkill);
  const j = normalize(jobSkill);
  if (u === j) return false; // already exact
  return u.includes(j) || j.includes(u);
}

/**
 * Main skill matching function
 * @param {string[]} userSkills  - skills the user has
 * @param {string[]} jobSkills   - skills required for the job role
 * @returns {{ matched, partialMatched, missing, matchPercentage, partialScore, totalScore }}
 */
const matchSkills = (userSkills, jobSkills) => {
  const matched = [];
  const partialMatched = [];
  const missing = [];

  const normalizedUserSkills = userSkills.map(normalize);

  for (const jobSkill of jobSkills) {
    const normalizedJob = normalize(jobSkill);

    // 1. Check exact match
    if (normalizedUserSkills.includes(normalizedJob)) {
      matched.push(jobSkill);
      continue;
    }

    // 2. Check partial match
    const hasPartial = userSkills.some((us) => isPartialMatch(us, jobSkill));
    if (hasPartial) {
      partialMatched.push(jobSkill);
      continue;
    }

    // 3. Missing
    missing.push(jobSkill);
  }

  const total = jobSkills.length;

  // Score: full match = 1 point, partial = 0.5 points
  const totalScore = ((matched.length + partialMatched.length * 0.5) / total) * 100;

  // Pure exact match percentage
  const matchPercentage = (matched.length / total) * 100;

  return {
    matched,
    partialMatched,
    missing,
    matchPercentage: matchPercentage.toFixed(2),
    totalScore: totalScore.toFixed(2),      // includes partial matches
    totalMatched: matched.length,
    totalPartial: partialMatched.length,
    totalMissing: missing.length,
    totalRequired: total,
  };
};

module.exports = { matchSkills, normalize };
