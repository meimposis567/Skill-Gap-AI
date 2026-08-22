const { SKILLS_DB } = require("./skillsDB");

const DIRECT_SKILL_ALIASES = {
  "React.js": ["react", "react js", "reactjs"],
  "React": ["react", "react js", "reactjs"],
  "Node.js": ["node", "node js", "nodejs"],
  "Express.js": ["express", "express js", "expressjs"],
  "Express": ["express", "express js", "expressjs"],
  "MongoDB": ["mongodb", "mongo db", "mongoose"],
  "JavaScript": ["javascript", "js", "ecmascript"],
  "HTML": ["html", "html5"],
  "CSS": ["css", "css3", "tailwind css", "bootstrap"],
  "Python": ["python"],
  "Java": ["java"],
  "C": ["c", "c language"],
  "Git": ["git", "github", "gitlab", "version control"],
  "REST APIs": ["rest api", "rest apis", "restful api", "restful apis", "api integration", "api development"],
  "REST API": ["rest api", "rest apis", "restful api", "restful apis", "api integration", "api development"],
  "Responsive Design": [
    "responsive design",
    "responsive ui",
    "responsive ui design",
    "responsive web design",
    "responsive layouts",
    "mobile first",
    "mobile first design",
    "mobile friendly",
    "mobile friendly ui",
  ],
  "Machine Learning": ["machine learning", "ml", "ml models", "predictive modeling", "predictive model"],
  "Deep Learning": ["deep learning", "neural network", "neural networks"],
  "Natural Language Processing": ["natural language processing", "nlp", "text processing", "text analytics"],
  "TensorFlow": ["tensorflow"],
  "PyTorch": ["pytorch"],
  "Scikit-learn": ["scikit learn", "scikit learn library", "sklearn"],
  "SQL": ["sql", "mysql", "postgresql", "postgres"],
  "Statistics": ["statistics", "statistical analysis", "probability and statistics"],
  "Docker": ["docker", "containerization", "containerisation"],
  "Kubernetes": ["kubernetes", "k8s"],
  "CI/CD": ["ci cd", "continuous integration", "continuous delivery", "continuous deployment"],
  "AWS": ["aws", "amazon web services"],
  "Linux": ["linux", "unix"],
  "Shell Scripting": ["shell scripting", "shell script", "bash scripting", "bash"],
  "Data Visualization": ["data visualization", "data visualisation", "dashboards", "dashboarding"],
  "NumPy": ["numpy"],
};

const COMPOSITE_ALIASES = [
  {
    alias: "mern",
    skills: ["MongoDB", "Express", "React", "Node.js"],
    matchType: "inferred",
  },
  {
    alias: "mern stack",
    skills: ["MongoDB", "Express", "React", "Node.js"],
    matchType: "inferred",
  },
  {
    alias: "full stack",
    skills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "Express", "MongoDB", "REST API"],
    matchType: "inferred",
  },
];

const skillRelations = {
  "mern stack": ["react", "node.js", "express", "mongodb", "react.js", "nodejs", "javascript"],
  "mern": ["react", "node.js", "express", "mongodb", "react.js", "nodejs", "javascript"],
  "restful apis": ["rest api", "api integration", "apis"],
  "tailwind css": ["css", "css3"],
  "full stack": ["react", "node.js", "express", "mongodb", "html", "css", "javascript", "rest api"]
};

function expandSkills(skills) {
  let expanded = [...skills];
  skills.forEach(skill => {
    const lower = skill.toLowerCase().trim();
    if (skillRelations[lower]) {
      expanded.push(...skillRelations[lower]);
    }
  });
  return [...new Set(expanded)];
}

const normalizeSkill = (skill = "") =>
  skill
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const unique = (items) => [...new Set(items.filter(Boolean))];

// Substring matching for Partial detection
const isPartialMatch = (userSkill, jobSkill) => {
  const u = normalizeSkill(userSkill);
  const j = normalizeSkill(jobSkill);
  if (!u || !j || u === j) return false;
  return u.includes(j) || j.includes(u);
};

const getDerivedAliases = (skill) => {
  const normalized = normalizeSkill(skill);
  const aliases = new Set([normalized]);

  if (normalized.endsWith(" js")) {
    aliases.add(normalized.replace(/ js$/, ""));
  }

  if (normalized.endsWith(" api")) {
    aliases.add(`${normalized}s`);
  }

  if (normalized.endsWith(" apis")) {
    aliases.add(normalized.replace(/ apis$/, " api"));
  }

  return [...aliases].filter(Boolean);
};

const getAliasesForSkill = (skill) =>
  unique([...(DIRECT_SKILL_ALIASES[skill] || []), ...getDerivedAliases(skill)].map(normalizeSkill));

const containsAlias = (normalizedText, alias) => {
  const paddedText = ` ${normalizedText} `;
  return paddedText.includes(` ${alias} `);
};

const extractSkillEvidenceFromText = (text, customSkills = []) => {
  const normalizedText = normalizeSkill(text);
  const skillsToCheck = unique([...SKILLS_DB, ...(customSkills || [])]);
  const evidence = new Map();

  // 1. Exact / Direct Alias Matching (Full Matched)
  for (const skill of skillsToCheck) {
    const alias = getAliasesForSkill(skill).find((candidate) => containsAlias(normalizedText, candidate));
    if (alias) {
      evidence.set(skill, {
        skill,
        evidence: alias,
        matchType: "direct",
      });
    }
  }

  // 2. Composite / Inferred Matching (Partial)
  for (const composite of COMPOSITE_ALIASES) {
    const normalizedAlias = normalizeSkill(composite.alias);
    if (!containsAlias(normalizedText, normalizedAlias)) {
      continue;
    }

    for (const skill of skillsToCheck) {
      if (evidence.has(skill)) continue;
      
      const normalizedS = normalizeSkill(skill);
      const isRelated = composite.skills.some((candidate) => normalizeSkill(candidate) === normalizedS);

      if (isRelated) {
        evidence.set(skill, {
          skill,
          evidence: composite.alias,
          matchType: "inferred",
        });
      }
    }
  }

  // 3. Substring / Relation Matching (Partial)
  // This helps catch "Tailwind CSS" -> "CSS" etc. 
  // We only check skills that weren't caught as direct matches.
  for (const skill of skillsToCheck) {
    if (evidence.has(skill)) continue;

    // Check if the text contains a partial substring match
    // we split text into words/phrases to be safe
    const textSegments = text.split(/[,\n]/).map(s => normalizeSkill(s)).filter(s => s.length > 2);
    
    for (const segment of textSegments) {
      if (isPartialMatch(segment, skill)) {
        evidence.set(skill, {
          skill,
          evidence: segment,
          matchType: "related",
        });
        break;
      }
    }
  }

  return [...evidence.values()];
};

const extractSkillsFromText = (text, customSkills = []) =>
  extractSkillEvidenceFromText(text, customSkills).map((item) => item.skill);

module.exports = { 
  extractSkillsFromText, 
  extractSkillEvidenceFromText, 
  normalizeSkill,
  expandSkills,
  isPartialMatch
};
