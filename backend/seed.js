/**
 * seed.js - Seeds the database with job roles and their skill recommendations
 * Run: node seed.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const JobRole = require("./models/JobRole");

const jobRoles = [
  {
    role: "Frontend Developer",
    description: "Builds user-facing web interfaces using modern frameworks and tools.",
    skills: ["HTML", "CSS", "JavaScript", "React", "Git", "REST API", "Responsive Design"],
    recommendations: [
      {
        skill: "React",
        courses: ["React - The Complete Guide (Udemy)", "Full Stack Open (Helsinki University)"],
        certifications: ["Meta Front-End Developer Certificate (Coursera)"],
        learningPath: "Learn React fundamentals → Hooks → Context API → Redux → Build 2 projects",
      },
      {
        skill: "JavaScript",
        courses: ["JavaScript: The Complete Guide (Udemy)", "javascript.info (Free)"],
        certifications: ["JavaScript Algorithms and Data Structures (freeCodeCamp)"],
        learningPath: "ES6+ → DOM Manipulation → Async/Await → Fetch API → Projects",
      },
      {
        skill: "Git",
        courses: ["Git & GitHub Crash Course (YouTube)", "Pro Git Book (Free)"],
        certifications: [],
        learningPath: "Learn basic git commands → Branching → Pull Requests → CI/CD basics",
      },
      {
        skill: "REST API",
        courses: ["REST API Design (Pluralsight)", "Postman API Fundamentals (Postman Academy)"],
        certifications: ["Postman API Fundamentals Student Expert"],
        learningPath: "Understand HTTP methods → CRUD operations → Consume APIs in React",
      },
      {
        skill: "Responsive Design",
        courses: ["CSS Flexbox & Grid (YouTube - Kevin Powell)", "Responsive Web Design (freeCodeCamp)"],
        certifications: ["Responsive Web Design (freeCodeCamp)"],
        learningPath: "CSS Flexbox → CSS Grid → Media Queries → Mobile-first design",
      },
    ],
  },
  {
    role: "Backend Developer",
    description: "Builds server-side logic, APIs, and database integrations.",
    skills: ["Node.js", "Express", "MongoDB", "REST API", "Git", "Authentication", "Docker"],
    recommendations: [
      {
        skill: "Node.js",
        courses: ["Node.js Complete Guide (Udemy)", "The Odin Project - NodeJS"],
        certifications: ["OpenJS Node.js Application Developer (LF)"],
        learningPath: "Node fundamentals → File system → Express → MongoDB → JWT → Deploy",
      },
      {
        skill: "Authentication",
        courses: ["Auth0 University (Free)", "JWT & OAuth2 (Udemy)"],
        certifications: [],
        learningPath: "Session-based auth → JWT → OAuth2 → bcrypt → Middleware",
      },
      {
        skill: "Docker",
        courses: ["Docker & Kubernetes (Udemy - Stephen Grider)", "Play with Docker (Free)"],
        certifications: ["Docker Certified Associate"],
        learningPath: "Docker basics → Dockerfile → docker-compose → Kubernetes intro",
      },
    ],
  },
  {
    role: "Full Stack Developer",
    description: "Works across both frontend and backend layers of a web application.",
    skills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "Express", "MongoDB", "Git", "REST API"],
    recommendations: [
      {
        skill: "MongoDB",
        courses: ["MongoDB University (Free)", "Complete MongoDB with Mongoose (Udemy)"],
        certifications: ["MongoDB Certified Developer Associate"],
        learningPath: "CRUD → Schema design → Indexes → Aggregation → Atlas",
      },
    ],
  },
  {
    role: "Data Scientist",
    description: "Analyzes data using statistical methods and machine learning to derive insights.",
    skills: ["Python", "Machine Learning", "Pandas", "NumPy", "Scikit-learn", "SQL", "Data Visualization", "Statistics"],
    recommendations: [
      {
        skill: "Machine Learning",
        courses: ["Machine Learning Specialization (Andrew Ng, Coursera)", "Fast.ai (Free)"],
        certifications: ["Google Professional ML Engineer", "AWS Certified ML Specialty"],
        learningPath: "Linear Regression → Classification → Clustering → Neural Networks → Projects",
      },
      {
        skill: "Python",
        courses: ["Python Bootcamp (Udemy)", "Python.org official docs (Free)"],
        certifications: ["PCEP – Certified Entry-Level Python Programmer"],
        learningPath: "Basics → OOP → Data structures → Libraries (NumPy, Pandas) → Projects",
      },
      {
        skill: "Pandas",
        courses: ["Data Analysis with Python (freeCodeCamp)", "Kaggle Pandas Course (Free)"],
        certifications: [],
        learningPath: "DataFrames → Filtering → GroupBy → Merging → EDA projects",
      },
      {
        skill: "Data Visualization",
        courses: ["Data Visualization with Python (Coursera)", "Matplotlib & Seaborn (Kaggle)"],
        certifications: ["Tableau Desktop Specialist"],
        learningPath: "Matplotlib → Seaborn → Plotly → Tableau/Power BI",
      },
      {
        skill: "SQL",
        courses: ["SQL for Data Science (Coursera)", "SQLZoo (Free)"],
        certifications: ["Google Data Analytics Certificate"],
        learningPath: "Basic queries → Joins → Subqueries → Window functions → Optimization",
      },
    ],
  },
  {
    role: "AI/ML Engineer",
    description: "Designs and builds machine learning models and AI systems for production.",
    skills: ["Python", "Machine Learning", "Deep Learning", "Natural Language Processing", "TensorFlow", "PyTorch", "Scikit-learn", "Statistics", "Git"],
    recommendations: [
      {
        skill: "Deep Learning",
        courses: ["Deep Learning Specialization (Andrew Ng, Coursera)", "Fast.ai (Free)"],
        certifications: ["TensorFlow Developer Certificate (Google)"],
        learningPath: "Neural Networks → CNNs → RNNs → Transformers → Deploy models",
      },
      {
        skill: "Natural Language Processing",
        courses: ["NLP with Python (Udemy)", "Hugging Face NLP Course (Free)"],
        certifications: ["Hugging Face NLP Certificate"],
        learningPath: "Text preprocessing → Word embeddings → Transformers → BERT → Fine-tuning",
      },
      {
        skill: "TensorFlow",
        courses: ["TensorFlow Developer Certificate Course (Coursera)", "TF official tutorials"],
        certifications: ["TensorFlow Developer Certificate"],
        learningPath: "Tensors → Layers → Model building → Training → Deployment (TF Serving)",
      },
      {
        skill: "PyTorch",
        courses: ["PyTorch for Deep Learning (Udemy)", "fast.ai (Free)"],
        certifications: [],
        learningPath: "Tensors → Autograd → nn.Module → Training loop → torchvision",
      },
    ],
  },
  {
    role: "DevOps Engineer",
    description: "Manages CI/CD pipelines, cloud infrastructure, and system reliability.",
    skills: ["Linux", "Docker", "Kubernetes", "CI/CD", "Git", "AWS", "Terraform", "Bash Scripting", "Monitoring"],
    recommendations: [
      {
        skill: "Kubernetes",
        courses: ["Kubernetes for Beginners (KodeKloud)", "Certified Kubernetes Administrator prep (Udemy)"],
        certifications: ["Certified Kubernetes Administrator (CKA)"],
        learningPath: "Pods → Deployments → Services → ConfigMaps → Helm → Monitoring",
      },
      {
        skill: "AWS",
        courses: ["AWS Certified Solutions Architect (Udemy)", "AWS Skill Builder (Free)"],
        certifications: ["AWS Certified Cloud Practitioner", "AWS Solutions Architect Associate"],
        learningPath: "IAM → EC2 → S3 → RDS → VPC → Lambda → CloudFormation",
      },
      {
        skill: "CI/CD",
        courses: ["GitHub Actions Tutorial (YouTube)", "Jenkins Full Course (Udemy)"],
        certifications: [],
        learningPath: "Git basics → GitHub Actions → Jenkins → Automated testing → Deployment",
      },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");

    // Clear existing job roles
    await JobRole.deleteMany({});
    console.log("Cleared existing job roles");

    // Insert fresh data
    await JobRole.insertMany(jobRoles);
    console.log(`Seeded ${jobRoles.length} job roles ✅`);

    jobRoles.forEach((jr) => {
      console.log(`  → ${jr.role} (${jr.skills.length} skills, ${jr.recommendations.length} recommendations)`);
    });

    await mongoose.connection.close();
    console.log("\nDatabase seeded successfully 🎉");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed ❌", err.message);
    process.exit(1);
  }
}

seed();
