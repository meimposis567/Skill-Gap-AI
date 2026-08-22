<div align="center">

# 🎯 Skill Gap AI

### AI-Based Skill Gap Analyzer for Career Readiness

**Upload a resume. Pick a dream role. Find out exactly what's missing — and how to learn it.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Flask](https://img.shields.io/badge/Flask-ML_API-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-All_Rights_Reserved-red?style=flat-square)](LICENSE)

</div>

---

## 📖 Overview

**Skill Gap AI** is a full-stack career-intelligence platform that measures the distance
between *what a candidate already knows* and *what a target job role actually demands*.

A user uploads their resume (or types their skills manually) and selects a target role.
The system parses the resume, extracts skills using a hybrid NLP + Generative-AI pipeline,
compares them against a curated role–skill database, and returns a **readiness score**, a
**matched / partial / missing** skill breakdown, and a **personalised learning path** of
courses and certifications for every gap it finds.

Unlike a plain keyword scanner, Skill Gap AI understands *relationships* between skills —
it knows that "MERN Stack" implies React, Node.js, Express and MongoDB, that "RESTful APIs"
satisfies a "REST API" requirement, and that "Tailwind CSS" demonstrates CSS proficiency.

---

## 🚨 Problem Statement

Students and early-career professionals consistently struggle with one question:

> *"I know I'm not ready for this job — but I don't know **what** I'm missing."*

The current landscape fails them in four specific ways:

| Problem | Impact |
|---|---|
| **Job descriptions are vague and inconsistent** | The same role is described with different terminology across companies, so candidates can't tell which skills genuinely matter. |
| **Resume screeners do binary keyword matching** | Writing "MERN Stack" instead of "React, Node.js, Express" gets a qualified candidate silently rejected. Nuance is lost. |
| **No actionable feedback loop** | Rejections arrive without reasons. Candidates never learn which specific gap cost them the opportunity. |
| **Learning resources aren't targeted** | Generic roadmaps waste months on skills a candidate already has, while real gaps go unaddressed. |

**Skill Gap AI closes this loop.** It converts an unstructured resume into a structured,
evidence-backed skill profile, diffs it against real role requirements with semantic
awareness, and turns every gap into a concrete, ordered learning action.

---

## ✨ Key Features

### 🔍 Analysis

- **Semantic resume parsing** — PDF text extraction with contextual skill understanding, not keyword counting.
- **Three-state skill classification** — every required skill is graded as **Matched**, **Partial**, or **Missing**, rather than a crude present/absent flag.
- **Alias & concept expansion** — "MERN", "RESTful APIs", "JS", "Tailwind" resolve to their underlying technologies automatically.
- **Anti-hallucination verification** — every AI-proposed skill is cross-checked against the raw resume text; unsupported claims are downgraded, never invented.

### 📊 Insight

- **Career readiness score** — a weighted percentage showing how close the profile is to the target role.
- **ML role prediction** — an independent Random Forest classifier suggests the role the profile *actually* fits best, with a confidence score.
- **Visual dashboard** — Recharts-powered skill distribution, progress rings and readiness graphs.
- **Progress tracking** — historical reports show how the readiness score improves as skills are mastered.

### 🎓 Action

- **Personalised learning paths** — curated courses and certifications mapped to each individual gap.
- **Skill mastery tracking** — mark a skill as mastered and watch the readiness score recalculate live.
- **AI mock interview generator** — role-specific practice questions generated from the user's own gap profile.
- **Smart notifications** — in-app alerts for milestones, new recommendations and progress updates.

### 🔐 Platform

- **JWT authentication** with bcrypt-hashed passwords.
- **Secure resume upload** via Multer, with server-side storage isolated from version control.
- **Protected routing** on the client so unauthenticated users never reach dashboard data.

---

## ⚙️ How the System Works

```text
┌──────────────┐   1. Upload resume    ┌──────────────────┐
│   React UI   │ ────────────────────► │  Express API     │
│   (Vite)     │   + target role       │  /api/skills/    │
└──────▲───────┘                       │     analyze      │
       │                               └────────┬─────────┘
       │                                        │
       │  7. Score + gaps                       │ 2. Parse PDF
       │     + learning path                    ▼
       │                               ┌──────────────────┐
       │                               │  pdf-parse       │
       │                               │  → raw text      │
       │                               └────────┬─────────┘
       │                                        │
       │                                        ▼
       │                     ┌──────────────────────────────────┐
       │                     │   HYBRID EXTRACTION ENGINE       │
       │                     │                                  │
       │                     │  1. Local NLP  → exact + alias   │
       │                     │  2. Gemini AI  → semantic map    │
       │                     │  3. Verifier   → evidence check  │
       │                     └────────────────┬─────────────────┘
       │                                      │
       │                    ┌─────────────────┴──────────────────┐
       │                    ▼                                    ▼
       │        ┌────────────────────┐              ┌────────────────────┐
       │        │  MongoDB           │              │  Flask ML API      │
       │        │  JobRole skills +  │              │  RandomForest      │
       │        │  recommendations   │              │  → predicted role  │
       │        └─────────┬──────────┘              └─────────┬──────────┘
       │                  │                                   │
       │                  └─────────────┬─────────────────────┘
       │                                ▼
       │                    ┌───────────────────────┐
       └────────────────────┤  SCORE CALCULATOR     │
          6. JSON response  │  matched / partial /  │
                            │  missing + readiness  │
                            └───────────────────────┘
```

### Stage by stage

**1 · Ingestion**
The resume PDF is received by Multer, stored outside the repository, and converted to raw
text by `pdf-parse`. Manually entered skills bypass this stage and enter the pipeline directly.

**2 · Deterministic extraction (Local NLP)**
A rule-based matcher scans the text against a curated skills dictionary, applying alias
expansion so that compound terms resolve to their constituent technologies:

```js
"mern stack"    → ["mongodb", "express", "react", "node.js"]
"restful apis"  → ["rest api"]
"tailwind css"  → ["css", "tailwind"]
```

**3 · Semantic extraction (Google Gemini)**
Gemini reads the resume in context to catch skills the dictionary missed and to judge
*depth* of experience — distinguishing "built a production React app" from "familiar with React".

**4 · Verification**
Every skill the AI proposes is re-checked against the raw text. If no supporting evidence
exists, the skill is demoted from Matched to Partial, or dropped entirely. This is what
keeps the output trustworthy.

**5 · Three-way comparison**
Each skill required by the target role is bucketed:

| Bucket | Meaning | Example |
|---|---|---|
| ✅ **Matched** | Exact match with strong evidence in the resume | Resume says *React* → role needs *React* |
| 🟡 **Partial** | Related, implied, or indirectly evidenced | Resume says *MERN Stack* → role needs *Node.js* |
| ❌ **Missing** | No evidence of the skill anywhere | Role needs *Docker*, resume never mentions it |

**6 · Parallel ML prediction**
Independently, the extracted skill vector is TF-IDF encoded and sent to the Flask service,
where a Random Forest classifier predicts the best-fit role and a confidence score. This acts
as a "second opinion" — if a user targets *Frontend Developer* but the model predicts
*Data Scientist* at 87% confidence, that discrepancy is itself a valuable insight.

**7 · Scoring & recommendations**
The readiness score weights matched skills fully and partial skills fractionally. Every
missing and partial skill is joined against the `recommendations` sub-document in MongoDB
to produce an ordered learning path of courses, certifications and next steps.

---

## 🛠️ Technology Stack

<table>
<tr><th align="left">Layer</th><th align="left">Technologies</th></tr>
<tr>
<td><b>Frontend</b></td>
<td>React 19 · Vite · React Router 7 · Tailwind CSS · Recharts · react-circular-progressbar · Axios</td>
</tr>
<tr>
<td><b>Backend</b></td>
<td>Node.js · Express 5 · Mongoose 9 · JWT (jsonwebtoken) · bcryptjs · Multer · pdf-parse · dotenv · CORS</td>
</tr>
<tr>
<td><b>Database</b></td>
<td>MongoDB (Atlas or local) — users, job roles, skill recommendations, notifications</td>
</tr>
<tr>
<td><b>AI / ML</b></td>
<td>Google Gemini (<code>@google/generative-ai</code>) · Python 3 · Flask · Flask-CORS · scikit-learn (TF-IDF + Random Forest) · NumPy</td>
</tr>
<tr>
<td><b>Tooling</b></td>
<td>ESLint 9 · PostCSS · Autoprefixer · Nodemon</td>
</tr>
</table>

---

## 🚀 Installation & Setup

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18 or higher |
| Python | 3.9 or higher |
| MongoDB | Local instance or Atlas cluster |
| Google AI Studio API key | [Get one free](https://aistudio.google.com/app/apikey) |

### 1 · Clone the repository

```bash
git clone https://github.com/meimposis567/Skill-Gap-AI.git
cd Skill-Gap-AI
```

### 2 · ML service (Python / Flask)

```bash
cd ML

# Optional but recommended
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt

# Train the classifier (only needed once — regenerates the .pkl files)
python train_model.py

# Start the ML API  ->  http://localhost:5001
python app.py
```

### 3 · Backend (Node.js / Express)

```bash
cd backend
npm install

# Create your environment file from the template
cp .env.example .env        # Windows: copy .env.example .env
```

Fill in `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/skillgapanalyzer
JWT_SECRET=your_long_random_secret_here
GEMINI_API_KEY=your_google_gemini_api_key
PORT=5000
```

Seed the role–skill database and start the server:

```bash
node seedRoles.js     # populates job roles + recommendations
npm run dev           # -> http://localhost:5000
```

### 4 · Frontend (React / Vite)

```bash
cd frontend
npm install

cp .env.example .env        # Windows: copy .env.example .env
```

Fill in `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Then start the dev server:

```bash
npm run dev           # -> http://localhost:5173
```

> ⚠️ **Security note:** `.env` files are git-ignored by design. Never commit real API keys,
> database URIs or JWT secrets. Use `.env.example` as the shared template.

### Run order

All three services should be running together:

| Service | Port | Command | Directory |
|---|---|---|---|
| ML API | 5001 | `python app.py` | `ML/` |
| Backend | 5000 | `npm run dev` | `backend/` |
| Frontend | 5173 | `npm run dev` | `frontend/` |

---

## 💡 Usage

1. **Register** an account at `http://localhost:5173/register`, or log in if you already have one.
2. **Provide your skills** — upload a resume PDF, or enter skills manually on the Skill Input page.
3. **Choose a target role** — Frontend Developer, Backend Developer, Full Stack Developer, Data Scientist, and more.
4. **Review the dashboard** — readiness score, matched / partial / missing breakdown, and the ML model's independently predicted best-fit role.
5. **Open Skill Analysis** to see the per-skill evidence behind every classification.
6. **Follow the Learning Path** — work through the recommended courses and certifications for your gaps.
7. **Mark skills as mastered** as you complete them; the readiness score recalculates immediately.
8. **Track progress** under Reports to see your score trend over time.

### Core API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Authenticate, receive JWT |
| `GET` | `/api/auth/profile/:userId` | Fetch user profile 🔒 |
| `PUT` | `/api/auth/profile/:userId/resume` | Upload / replace resume 🔒 |
| `POST` | `/api/skills/analyze` | Run the full gap analysis |
| `GET` | `/api/skills/roles` | List all target roles |
| `GET` | `/api/skills/dashboard/:userId` | Dashboard aggregate data |
| `GET` | `/api/skills/progress/:userId` | Progress history |
| `GET` | `/api/skills/reports/:userId` | Detailed reports |
| `PUT` | `/api/skills/master-skill` | Mark a skill as mastered |
| `POST` | `/api/skills/mock-interview` | Generate interview questions |
| `GET` | `/api/notifications/:userId` | Fetch notifications |

*🔒 = requires an `Authorization: Bearer <token>` header.*

**ML service endpoints** — `POST /predict` · `POST /gap-analysis` · `GET /roles` · `GET /health`

---

## 📁 Project Structure

```text
Skill-Gap-AI/
│
├── backend/                      # Node.js + Express REST API
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Register, login, profile, resume upload
│   │   ├── skillController.js    # Analysis, dashboard, progress, reports
│   │   └── notificationController.js
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification
│   ├── models/
│   │   ├── User.js               # Account, skills, mastery, history
│   │   ├── JobRole.js            # Role -> required skills + recommendations
│   │   └── Notification.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── skillRoutes.js
│   │   └── notificationRoutes.js
│   ├── utils/
│   │   ├── extractSkills.js      # PDF text -> skill extraction
│   │   ├── skillMatcher.js       # Matched / partial / missing logic
│   │   ├── scoreCalculator.js    # Readiness scoring
│   │   ├── skillsDB.js           # Curated skills dictionary + aliases
│   │   └── requestAccess.js      # Gemini API client
│   ├── uploads/                  # Resume storage (git-ignored)
│   ├── seedRoles.js              # Seeds job roles + recommendations
│   ├── seed.js
│   ├── server.js                 # Express entry point
│   └── .env.example
│
├── frontend/                     # React 19 + Vite client
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Button, Card, Input, Loader
│   │   │   ├── dashboard/        # Charts, MatchScore, AIInsight,
│   │   │   │                     #   SkillTags, Recommendations
│   │   │   ├── forms/            # AuthForm, ResumeUpload, SkillInput
│   │   │   └── layout/           # Navbar, Sidebar, Layout
│   │   ├── pages/                # Login, Register, Dashboard,
│   │   │                         #   SkillAnalysis, LearningPath,
│   │   │                         #   Progress, Reports, Profile
│   │   ├── services/api.js       # Axios client + API calls
│   │   ├── utils/helpers.js      # Auth helpers, formatters
│   │   ├── routes.jsx            # Protected route definitions
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .env.example
│
├── ML/                           # Python Flask ML microservice
│   ├── train_model.py            # TF-IDF + Random Forest training
│   ├── app.py                    # Flask API (predict / gap-analysis)
│   ├── model.pkl                 # Trained classifier
│   ├── vectorizer.pkl            # Fitted TF-IDF vectorizer
│   ├── label_encoder.pkl         # Role label encoder
│   └── requirements.txt
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## 👥 Team & Credits

Developed as a Computer Science and Engineering project at
**PSNA College of Engineering and Technology, Dindigul**.

| Member | GitHub |
|---|---|
| **Akash S M** | [@meimposis567](https://github.com/meimposis567) |
| **Akash S** | [@akash02062005](https://github.com/akash02062005) |
| **Chandru P** | [@MrChandru345](https://github.com/MrChandru345) |
| **Aaron Marshall A** | [@AaronMarshall2005](https://github.com/AaronMarshall2005) |

### Acknowledgements

Built on the shoulders of excellent open-source and public technology:
[React](https://react.dev) · [Vite](https://vitejs.dev) · [Express](https://expressjs.com) ·
[MongoDB](https://mongodb.com) · [Mongoose](https://mongoosejs.com) ·
[Flask](https://flask.palletsprojects.com) · [scikit-learn](https://scikit-learn.org) ·
[Recharts](https://recharts.org) · [Tailwind CSS](https://tailwindcss.com) ·
[Google Gemini](https://ai.google.dev)

All third-party libraries and services remain the property of their respective owners and
are used under their own licenses.

---

## 📜 License

**Copyright © 2026 Akash S M, Akash S, Chandru P, Aaron Marshall A. All Rights Reserved.**

This project is released under a **Proprietary Software License — All Rights Reserved**.
It is **not** open source.

| | |
|---|---|
| ✅ **Permitted** | Viewing and reading the source in this repository for personal study, academic assessment, peer review, or recruitment review. |
| ❌ **Not permitted** | Copying, modifying, redistributing, deploying, hosting, commercial use, incorporating into another project, or submitting as your own academic work. |

Any use beyond the permitted scope requires the prior written consent of **all four**
copyright holders. Third-party dependencies remain the property of their respective owners
and are governed by their own licenses.

See [LICENSE](LICENSE) for the full and binding terms.

---

<div align="center">

**Skill Gap AI** — *know the gap, close the gap.*

</div>
