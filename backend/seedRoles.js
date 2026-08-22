require("dotenv").config();
const mongoose = require("mongoose");
const JobRole = require("./models/JobRole");

const seedRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB ✅");

    const rolesToAdd = [
      {
        role: "Frontend Developer",
        description: "Builds user interfaces and client-side logic with a focus on performance and accessibility.",
        skills: ["HTML5", "CSS3", "JavaScript (ES6+)", "React.js", "TypeScript", "Next.js", "Redux", "Tailwind CSS", "SASS", "Responsive Design", "Jest/Cypress", "Git", "Webpack", "REST APIs", "Browser Performance"],
        recommendations: [
          { skill: "TypeScript", courses: ["Ultimate TypeScript - CodeWithMosh"], certifications: ["Microsoft Certified: JavaScript Developer"], learningPath: "Learn types, interfaces, and advanced generics." },
          { skill: "Next.js", courses: ["Next.js App Router Course"], certifications: ["Vercel Certified Developer"], learningPath: "Master Server Components and SSR." }
        ]
      },
      {
        role: "Backend Developer",
        description: "Develops server-side logic, optimizes database performance, and designs scalable APIs.",
        skills: ["Node.js", "Express.js", "Python", "Django/Flask", "MongoDB", "PostgreSQL", "Redis", "REST APIs", "GraphQL", "Docker", "Microservices", "Unit Testing", "System Design", "Git", "CI/CD"],
        recommendations: [
          { skill: "Redis", courses: ["Redis University"], certifications: ["Redis Certified Developer"], learningPath: "Learn caching strategies and data structures." },
          { skill: "PostgreSQL", courses: ["SQL Masterclass"], certifications: ["Postgres Professional"], learningPath: "Master indexing and query optimization." }
        ]
      },
      {
        role: "Data Scientist",
        description: "Extracts insights from data using statistical models and machine learning algorithms.",
        skills: ["Python", "R", "SQL", "Statistics", "Machine Learning", "Deep Learning", "NLP", "Pandas", "NumPy", "Scikit-Learn", "TensorFlow/PyTorch", "Big Data (Spark)", "Data Visualization (Tableau/D3)", "Feature Engineering", "A/B Testing"],
        recommendations: [
          { skill: "PyTorch", courses: ["Deep Learning with PyTorch"], certifications: ["Google Professional Data Engineer"], learningPath: "Master neural networks and computer vision." },
          { skill: "Statistics", courses: ["Inferential Statistics - Coursera"], certifications: ["Harvard Statistics Certificate"], learningPath: "Learn hypothesis testing and probability." }
        ]
      },
      {
        role: "DevOps Engineer",
        description: "Bridging the gap between development and operations through automation and cloud orchestration.",
        skills: ["Linux/Unix", "AWS", "Azure/GCP", "Docker", "Kubernetes", "Terraform", "Ansible/Chef", "Jenkins", "GitHub Actions", "Prometheus/Grafana", "Python/Bash Scripting", "Networking", "IAM", "Security Compliance"],
        recommendations: [
          { skill: "Kubernetes", courses: ["CKA Course"], certifications: ["Certified Kubernetes Administrator"], learningPath: "Master cluster orchestration." },
          { skill: "Terraform", courses: ["Infrastructure as Code with Terraform"], certifications: ["HashiCorp Certified: Terraform Associate"], learningPath: "Learn state management and modules." }
        ]
      },
      {
        role: "Cloud Architect",
        description: "Designs high-level cloud strategies and manages enterprise cloud infrastructure.",
        skills: ["AWS", "Cloud Design Patterns", "Serverless Architecture", "VPC/Networking", "Identity & Access Management", "Cost Optimization", "Disaster Recovery", "Microservices", "API Gateways", "Cloud Security"],
        recommendations: [
          { skill: "AWS", courses: ["AWS Solutions Architect Professional"], certifications: ["AWS Certified Solutions Architect"], learningPath: "Learn enterprise-grade architecture." }
        ]
      },
      {
        role: "Cybersecurity Analyst",
        description: "Secures organization data and responds to security breaches.",
        skills: ["Network Security", "Ethical Hacking", "SIEM", "Vulnerability Assessment", "Firewalls", "IDS/IPS", "Incident Response", "Penetration Testing", "Security Auditing", "Compliance (GDPR/HIPAA)"],
        recommendations: [
          { skill: "Penetration Testing", courses: ["OSCP Prep"], certifications: ["Offensive Security Certified Professional"], learningPath: "Master active exploitation techniques." }
        ]
      },
      {
        role: "Data Analyst",
        description: "Processes and analyzes large datasets to drive business intelligence.",
        skills: ["Excel", "SQL", "Tableau", "PowerBI", "Python for Data Analysis", "ETL Processes", "Data Cleaning", "Critical Thinking", "Communication", "KPI Dashboarding"],
        recommendations: [
          { skill: "PowerBI", courses: ["Advanced PowerBI"], certifications: ["Microsoft Certified: Data Analyst Associate"], learningPath: "Master DAX and reporting." }
        ]
      },
      {
        role: "Full Stack Developer",
        description: "End-to-end web application development from DB design to UX.",
        skills: ["React/Vue", "Node.js", "Express", "Database Management", "Auth (JWT/OAuth)", "API Design", "Testing", "Deployment", "Version Control", "System Design"],
        recommendations: [
          { skill: "System Design", courses: ["Grokking the System Design Interview"], certifications: ["Full Stack Specialization"], learningPath: "Learn scalability and high availability." }
        ]
      },
      {
        role: "ML Engineer",
        description: "Deploys and optimizes machine learning models in production environments.",
        skills: ["Python", "TensorFlow", "MLOps", "Model Deployment", "Model Optimization", "Mathematical Modeling", "Algorithm Design", "Big Data Pipelines", "KServe", "MLflow"],
        recommendations: [
          { skill: "MLOps", courses: ["MLOps Specialization"], certifications: ["Google ML Engineer"], learningPath: "Master the ML lifecycle." }
        ]
      },
      {
        role: "Mobile Developer",
        description: "Creates high-performance mobile experiences for iOS and Android.",
        skills: ["React Native", "Flutter", "Swift (iOS)", "Kotlin (Android)", "Mobile UI Design", "App Store Deployment", "Firebase", "Local Storage", "Push Notifications", "Performance Profiling"],
        recommendations: [
          { skill: "Swift", courses: ["iOS & Swift Masterclass"], certifications: ["Apple Certified App Developer"], learningPath: "Master SwiftUI and Combine." }
        ]
      },
      {
        role: "UI/UX Designer",
        description: "Designs intuitive and visually stunning user experiences.",
        skills: ["Figma", "Adobe Creative Suite", "User Research", "Wireframing", "Prototyping", "Design Systems", "Typography", "Color Theory", "Interaction Design", "Usability Testing"],
        recommendations: [
          { skill: "Figma", courses: ["Advanced Figma Components"], certifications: ["Google UX Design Certificate"], learningPath: "Master auto-layout and prototyping." }
        ]
      },
      {
        role: "Database Administrator",
        description: "Manages complex database environments for uptime and performance.",
        skills: ["Oracle/MySQL/PostgreSQL", "Database Security", "Recovery & Backup", "Clustering", "Query Tuning", "NoSQL Management", "Data Warehousing", "Schema Migrations", "Storage Management"],
        recommendations: [
          { skill: "Query Tuning", courses: ["Database Performance Tuning"], certifications: ["Oracle Database Administrator"], learningPath: "Learn execution plans and indexing." }
        ]
      }
    ];

    for (const roleData of rolesToAdd) {
      // Upsert (Update if exists, insert if not)
      await JobRole.findOneAndUpdate(
        { role: roleData.role },
        { $set: roleData },
        { new: true, upsert: true }
      );
      console.log(`Updated/Seeded role: ${roleData.role}`);
    }

    console.log("All roles seeded successfully! 🎉");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding roles:", error);
    process.exit(1);
  }
};

seedRoles();
