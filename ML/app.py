"""
AI Skill Gap Analyzer — Flask ML API
=====================================
Run AFTER training:
    python app.py

Server starts at: http://localhost:5001

Endpoints:
    POST /predict        → predict job role from skills
    POST /gap-analysis   → compare skills to a target role
    GET  /roles          → list all supported job roles
    GET  /health         → check server is running
"""

import pickle
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allows your React/Node.js frontend to call this API

# ─────────────────────────────────────────────
# LOAD SAVED MODEL FILES
# ─────────────────────────────────────────────
print("Loading ML model files...")
try:
    with open("model.pkl", "rb") as f:
        model = pickle.load(f)

    with open("vectorizer.pkl", "rb") as f:
        vectorizer = pickle.load(f)

    with open("label_encoder.pkl", "rb") as f:
        label_encoder = pickle.load(f)

    print("-> ML model loaded successfully!")
    all_roles = [str(role) for role in label_encoder.classes_]
    print(f"   Supported roles: {all_roles}")

except FileNotFoundError:
    print("[Error] Model files not found! Run train_model.py first.")
    model = None
    vectorizer = None
    label_encoder = None
    all_roles = []

# ─────────────────────────────────────────────
# SKILL DATABASE — role requirements
# Used for gap analysis: what skills does each role need?
# ─────────────────────────────────────────────
ROLE_REQUIREMENTS = {
    "Frontend Developer": [
        "html", "css", "javascript", "react", "typescript",
        "git", "responsive design", "tailwind", "figma", "rest api"
    ],
    "Backend Developer": [
        "node.js", "express.js", "python", "rest api", "mongodb",
        "postgresql", "docker", "jwt", "authentication", "sql"
    ],
    "Full Stack Developer": [
        "react", "node.js", "mongodb", "express.js", "javascript",
        "html", "css", "rest api", "git", "docker"
    ],
    "Data Scientist": [
        "python", "pandas", "numpy", "scikit-learn", "machine learning",
        "statistics", "matplotlib", "tensorflow", "data analysis", "sql"
    ],
    "Data Analyst": [
        "sql", "excel", "python", "tableau", "power bi",
        "data visualization", "statistics", "pandas", "reporting", "dashboard"
    ],
    "DevOps Engineer": [
        "docker", "kubernetes", "aws", "ci/cd", "linux",
        "terraform", "bash", "git", "jenkins", "monitoring"
    ],
    "ML Engineer": [
        "python", "tensorflow", "pytorch", "scikit-learn", "docker",
        "mlops", "model deployment", "rest api", "kubernetes", "mlflow"
    ],
    "Cybersecurity Analyst": [
        "network security", "linux", "penetration testing", "python",
        "firewall", "siem", "ethical hacking", "vulnerability assessment", "splunk", "owasp"
    ],
    "Mobile Developer": [
        "react native", "flutter", "javascript", "dart",
        "ios", "android", "firebase", "rest api", "git", "ui design"
    ],
    "UI/UX Designer": [
        "figma", "user research", "wireframing", "prototyping",
        "adobe xd", "ux design", "usability testing", "design systems", "accessibility", "interaction design"
    ],
    "Cloud Architect": [
        "aws", "azure", "gcp", "terraform", "kubernetes",
        "microservices", "serverless", "docker", "networking", "security"
    ],
    "Database Administrator": [
        "sql", "mysql", "postgresql", "mongodb", "performance tuning",
        "backup", "replication", "indexing", "database design", "nosql"
    ],
}

# ─────────────────────────────────────────────
# COURSE RECOMMENDATIONS — per skill gap
# Maps a missing skill → recommended course
# ─────────────────────────────────────────────
COURSE_RECOMMENDATIONS = {
    "react": {
        "title": "React - The Complete Guide",
        "platform": "Udemy",
        "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux/",
        "duration": "48 hours",
        "level": "Beginner to Advanced"
    },
    "python": {
        "title": "Python for Everybody",
        "platform": "Coursera",
        "url": "https://www.coursera.org/specializations/python",
        "duration": "8 months",
        "level": "Beginner"
    },
    "machine learning": {
        "title": "Machine Learning Specialization",
        "platform": "Coursera",
        "url": "https://www.coursera.org/specializations/machine-learning-introduction",
        "duration": "3 months",
        "level": "Intermediate"
    },
    "docker": {
        "title": "Docker and Kubernetes: The Complete Guide",
        "platform": "Udemy",
        "url": "https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/",
        "duration": "22 hours",
        "level": "Intermediate"
    },
    "sql": {
        "title": "SQL for Data Science",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/sql-for-data-science",
        "duration": "4 weeks",
        "level": "Beginner"
    },
    "node.js": {
        "title": "The Complete Node.js Developer Course",
        "platform": "Udemy",
        "url": "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/",
        "duration": "35 hours",
        "level": "Beginner to Intermediate"
    },
    "tensorflow": {
        "title": "TensorFlow Developer Certificate",
        "platform": "Coursera",
        "url": "https://www.coursera.org/professional-certificates/tensorflow-in-practice",
        "duration": "4 months",
        "level": "Intermediate"
    },
    "aws": {
        "title": "AWS Certified Solutions Architect",
        "platform": "Udemy",
        "url": "https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/",
        "duration": "27 hours",
        "level": "Intermediate"
    },
    "kubernetes": {
        "title": "Kubernetes for the Absolute Beginners",
        "platform": "Udemy",
        "url": "https://www.udemy.com/course/learn-kubernetes/",
        "duration": "8 hours",
        "level": "Beginner"
    },
    "typescript": {
        "title": "Understanding TypeScript",
        "platform": "Udemy",
        "url": "https://www.udemy.com/course/understanding-typescript/",
        "duration": "22 hours",
        "level": "Intermediate"
    },
    "figma": {
        "title": "UI/UX Design with Figma",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/ui-ux-design",
        "duration": "6 weeks",
        "level": "Beginner"
    },
    "pandas": {
        "title": "Data Analysis with Python",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/data-analysis-with-python",
        "duration": "6 weeks",
        "level": "Beginner"
    },
    "flutter": {
        "title": "The Complete Flutter Development Bootcamp",
        "platform": "Udemy",
        "url": "https://www.udemy.com/course/flutter-bootcamp-with-dart/",
        "duration": "28 hours",
        "level": "Beginner"
    },
    "mongodb": {
        "title": "MongoDB - The Complete Developer's Guide",
        "platform": "Udemy",
        "url": "https://www.udemy.com/course/mongodb-the-complete-developers-guide/",
        "duration": "17 hours",
        "level": "Beginner to Advanced"
    },
    "default": {
        "title": "Search this skill on Coursera",
        "platform": "Coursera",
        "url": "https://www.coursera.org/search?query=",
        "duration": "Varies",
        "level": "Various"
    }
}

# ─────────────────────────────────────────────
# SKILL ALIASES — normalise versioned/variant names
# User skill           → canonical role-requirement name
# ─────────────────────────────────────────────
SKILL_ALIASES = {
    # HTML
    "html5": "html",
    "html 5": "html",
    # CSS
    "css3": "css",
    "css 3": "css",
    "tailwind css": "tailwind",
    "tailwindcss": "tailwind",
    # JavaScript
    "javascript es6+": "javascript",
    "javascript (es6+)": "javascript",
    "js es6": "javascript",
    "es6+": "javascript",
    "ecmascript": "javascript",
    "js": "javascript",
    # React
    "react.js": "react",
    "reactjs": "react",
    "react js": "react",
    # Node
    "nodejs": "node.js",
    "node js": "node.js",
    # Express
    "express.js": "express.js",
    "expressjs": "express.js",
    # REST API
    "rest apis": "rest api",
    "restful api": "rest api",
    "restful apis": "rest api",
    "api integration": "rest api",
    # Git
    "github": "git",
    "gitlab": "git",
    "version control": "git",
    # MongoDB
    "mongoose": "mongodb",
    # TypeScript
    "ts": "typescript",
    # JWT / Auth
    "jwt": "authentication",
    "json web token": "authentication",
}

def resolve_alias(skill: str) -> str:
    """Return canonical skill name, or the original if no alias found."""
    return SKILL_ALIASES.get(skill, skill)


# ═══════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════

@app.route("/health", methods=["GET"])
def health():
    """Simple health check — call this to confirm the server is running."""
    return jsonify({
        "status": "running",
        "model_loaded": model is not None,
        "supported_roles": len(all_roles)
    })


@app.route("/roles", methods=["GET"])
def get_roles():
    """Returns all job roles the model can predict."""
    return jsonify({
        "roles": all_roles,
        "total": len(all_roles)
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict the best-fit job role from a list of skills.

    Request body (JSON):
    {
        "skills": ["python", "pandas", "scikit-learn", "machine learning"]
    }

    Response:
    {
        "predicted_role": "Data Scientist",
        "confidence": 87.3,
        "top_predictions": [
            { "role": "Data Scientist",   "confidence": 87.3 },
            { "role": "ML Engineer",      "confidence": 8.1  },
            { "role": "Data Analyst",     "confidence": 4.6  }
        ]
    }
    """
    if model is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 500

    data = request.get_json()

    # ── Validate input ──
    if not data or "skills" not in data:
        return jsonify({"error": "Send JSON with a 'skills' key. Example: {\"skills\": [\"python\", \"react\"]}"}), 400

    skills = data["skills"]

    if not isinstance(skills, list) or len(skills) == 0:
        return jsonify({"error": "'skills' must be a non-empty list of strings."}), 400

    # ── Convert list to string and vectorize ──
    skills_string = " ".join([str(s).lower().strip() for s in skills])
    skills_vector = vectorizer.transform([skills_string])

    # ── Predict ──
    prediction    = model.predict(skills_vector)[0]
    probabilities = model.predict_proba(skills_vector)[0]

    predicted_role = label_encoder.inverse_transform([prediction])[0]
    confidence     = round(float(max(probabilities)) * 100, 1)

    # ── Top 3 predictions ──
    top3_idx = np.argsort(probabilities)[::-1][:3]
    top_predictions = [
        {
            "role":       label_encoder.inverse_transform([idx])[0],
            "confidence": round(float(probabilities[idx]) * 100, 1)
        }
        for idx in top3_idx
    ]

    return jsonify({
        "predicted_role":  predicted_role,
        "confidence":      confidence,
        "top_predictions": top_predictions,
        "input_skills":    skills
    })


@app.route("/gap-analysis", methods=["POST"])
def gap_analysis():
    """
    Compare user's skills against a target job role.
    If no target role given, uses the ML-predicted role.

    Request body:
    {
        "skills":      ["python", "pandas", "sql"],
        "target_role": "Data Scientist"   ← optional
    }

    Response:
    {
        "target_role":      "Data Scientist",
        "match_score":      60,
        "matched_skills":   ["python", "pandas"],
        "missing_skills":   ["scikit-learn", "machine learning", ...],
        "recommendations":  [ { course objects } ]
    }
    """
    if model is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 500

    data = request.get_json()

    if not data or "skills" not in data:
        return jsonify({"error": "Send JSON with a 'skills' key."}), 400

    user_skills = [s.lower().strip() for s in data["skills"]]
    target_role = data.get("target_role", None)

    # If no target role given, predict it
    if not target_role:
        skills_string = " ".join(user_skills)
        skills_vector = vectorizer.transform([skills_string])
        prediction    = model.predict(skills_vector)[0]
        target_role   = label_encoder.inverse_transform([prediction])[0]

    # Get required skills for the target role
    required_skills = ROLE_REQUIREMENTS.get(target_role, [])

    if not required_skills:
        return jsonify({"error": f"Role '{target_role}' not found. Call /roles to see all supported roles."}), 404

    # Resolve aliases so "HTML5" → "html", "Tailwind CSS" → "tailwind" etc.
    resolved_skills = [resolve_alias(s) for s in user_skills]
    # Also keep originals so substring matching still works
    all_user_forms  = list(set(user_skills + resolved_skills))

    # Compare — three tiers: matched / partial / missing
    matched_skills = []
    partial_skills = []
    missing_skills = []

    for req_skill in required_skills:
        # Tier 1 — exact match after alias resolution
        exact = any(
            req_skill == s or req_skill == resolve_alias(s)
            for s in user_skills
        )
        if exact:
            matched_skills.append(req_skill)
            continue

        # Tier 2 — substring containment (e.g. user has "tailwind", role needs "tailwind")
        contains = any(
            req_skill in s or s in req_skill
            for s in all_user_forms
        )
        if contains:
            matched_skills.append(req_skill)   # strong enough → matched
            continue

        # Tier 3 — partial: first word of req_skill appears in any user skill
        req_first_word = req_skill.split()[0]  # e.g. "rest" from "rest api"
        partial = any(
            req_first_word in s or s in req_first_word
            for s in all_user_forms
            if len(s) > 2
        )
        if partial:
            partial_skills.append(req_skill)
        else:
            missing_skills.append(req_skill)

    total = len(required_skills)
    match_score = round(((len(matched_skills) + 0.5 * len(partial_skills)) / total) * 100) if total else 0

    # Build course recommendations for missing skills
    recommendations = []
    for skill in missing_skills[:5]:  # top 5 missing skills
        course = COURSE_RECOMMENDATIONS.get(skill, None)
        if course:
            recommendations.append({
                "skill":    skill,
                "course":   course["title"],
                "platform": course["platform"],
                "url":      course["url"],
                "duration": course["duration"],
                "level":    course["level"]
            })
        else:
            # Fallback: search Coursera
            recommendations.append({
                "skill":    skill,
                "course":   f"Learn {skill.title()} on Coursera",
                "platform": "Coursera",
                "url":      f"https://www.coursera.org/search?query={skill.replace(' ', '+')}",
                "duration": "Varies",
                "level":    "Various"
            })

    return jsonify({
        "target_role":      target_role,
        "match_score":      match_score,
        "matched_skills":   matched_skills,
        "partial_skills":   partial_skills,
        "missing_skills":   missing_skills,
        "total_required":   len(required_skills),
        "recommendations":  recommendations
    })


# ═══════════════════════════════════════════════
# START SERVER
# ═══════════════════════════════════════════════
if __name__ == "__main__":
    print("\nStarting AI Skill Gap Analyzer ML API...")
    print("   Server: http://localhost:5001")
    print("   Health: http://localhost:5001/health")
    print("   Press CTRL+C to stop\n")
    app.run(host="0.0.0.0", port=5001, debug=True)
