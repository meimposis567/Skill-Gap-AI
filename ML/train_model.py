"""
AI Skill Gap Analyzer — Job Role Predictor
==========================================
Run this ONCE to train and save the model:
    python train_model.py
"""

import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

dataset = [
    # ── Frontend Developer ──
    ("html css javascript react redux tailwind responsive design figma", "Frontend Developer"),
    ("html css javascript vue.js webpack sass bootstrap", "Frontend Developer"),
    ("react typescript tailwind css figma git rest api", "Frontend Developer"),
    ("javascript html css angular material ui rxjs", "Frontend Developer"),
    ("html css jquery javascript bootstrap responsive web design", "Frontend Developer"),
    ("react hooks context api css modules styled components", "Frontend Developer"),
    ("vue nuxt javascript css html webpack vite", "Frontend Developer"),
    ("javascript typescript react graphql apollo css", "Frontend Developer"),
    ("html css javascript react vite eslint prettier git", "Frontend Developer"),
    ("svelte javascript css html rollup", "Frontend Developer"),

    # ── Backend Developer ──
    ("node.js express.js mongodb rest api jwt authentication", "Backend Developer"),
    ("python django postgresql rest api docker", "Backend Developer"),
    ("java spring boot hibernate mysql microservices", "Backend Developer"),
    ("node.js express mongodb mongoose jwt bcrypt", "Backend Developer"),
    ("python flask sqlalchemy postgresql redis", "Backend Developer"),
    ("php laravel mysql rest api composer", "Backend Developer"),
    ("ruby rails postgresql redis sidekiq", "Backend Developer"),
    ("golang gin postgresql docker kubernetes", "Backend Developer"),
    ("node.js fastify prisma postgresql typescript", "Backend Developer"),
    ("java spring security oauth2 postgresql docker", "Backend Developer"),

    # ── Full Stack Developer — ORIGINAL 10 ──
    ("react node.js express mongodb html css javascript rest api git", "Full Stack Developer"),
    ("vue.js django postgresql python javascript html css", "Full Stack Developer"),
    ("angular node.js typescript mongodb express html css", "Full Stack Developer"),
    ("react python flask postgresql javascript html css docker", "Full Stack Developer"),
    ("next.js node.js mongodb tailwind typescript prisma", "Full Stack Developer"),
    ("react express.js mysql javascript html css jwt", "Full Stack Developer"),
    ("nuxt.js node.js postgresql vuex tailwind css", "Full Stack Developer"),
    ("react django rest framework postgresql python javascript", "Full Stack Developer"),
    ("svelte node.js postgresql javascript html css", "Full Stack Developer"),
    ("remix react node.js prisma postgresql typescript", "Full Stack Developer"),

    # ── Full Stack Developer — 15 NEW ROWS ──
    ("react node.js express mongodb javascript html css jwt rest api git docker", "Full Stack Developer"),
    ("next.js express postgresql prisma typescript tailwind css jwt authentication", "Full Stack Developer"),
    ("react redux node.js mongodb express html css javascript axios git", "Full Stack Developer"),
    ("vue.js node.js express mysql javascript html css rest api git", "Full Stack Developer"),
    ("angular node.js typescript postgresql express html css rest api", "Full Stack Developer"),
    ("react context api node.js mongodb express tailwind css vite git", "Full Stack Developer"),
    ("next.js node.js mongodb mongoose tailwind typescript vercel deployment", "Full Stack Developer"),
    ("react node.js express mysql javascript html css bcrypt jwt upload", "Full Stack Developer"),
    ("svelte node.js postgresql javascript html css rest api git vite", "Full Stack Developer"),
    ("react python django postgresql javascript html css rest api git", "Full Stack Developer"),
    ("nuxt.js express mongodb vue javascript css html axios jwt", "Full Stack Developer"),
    ("react typescript node.js prisma postgresql tailwind shadcn git", "Full Stack Developer"),
    ("mern stack react express mongodb node.js javascript html css", "Full Stack Developer"),
    ("react node.js socket.io mongodb express javascript real-time chat", "Full Stack Developer"),
    ("next.js fastapi postgresql python react typescript tailwind css", "Full Stack Developer"),

    # ── Data Scientist — ORIGINAL 10 ──
    ("python pandas numpy scikit-learn matplotlib machine learning statistics", "Data Scientist"),
    ("python tensorflow keras deep learning neural networks data analysis", "Data Scientist"),
    ("r python statistics data visualization machine learning regression", "Data Scientist"),
    ("python scikit-learn xgboost data analysis feature engineering nlp", "Data Scientist"),
    ("python pytorch transformers nlp bert fine-tuning", "Data Scientist"),
    ("python pandas seaborn matplotlib statistical analysis hypothesis testing", "Data Scientist"),
    ("machine learning python scikit-learn random forest classification clustering", "Data Scientist"),
    ("python deep learning cnn image classification tensorflow keras", "Data Scientist"),
    ("python time series forecasting arima prophet pandas", "Data Scientist"),
    ("python nlp spacy nltk text classification sentiment analysis", "Data Scientist"),

    # ── Data Scientist — 15 NEW ROWS ──
    ("python pandas numpy scikit-learn machine learning statistics jupyter matplotlib seaborn", "Data Scientist"),
    ("python tensorflow keras deep learning neural networks classification regression", "Data Scientist"),
    ("python scikit-learn random forest xgboost feature engineering cross validation", "Data Scientist"),
    ("python pytorch nlp transformers bert text classification sentiment analysis", "Data Scientist"),
    ("python pandas data cleaning eda exploratory data analysis visualization seaborn", "Data Scientist"),
    ("python statistics hypothesis testing a/b testing pandas numpy scipy", "Data Scientist"),
    ("python time series arima lstm forecasting pandas matplotlib", "Data Scientist"),
    ("python clustering k-means dbscan dimensionality reduction pca scikit-learn", "Data Scientist"),
    ("python computer vision opencv cnn image classification tensorflow keras", "Data Scientist"),
    ("python recommendation system collaborative filtering matrix factorization", "Data Scientist"),
    ("python sql pandas data wrangling model evaluation scikit-learn statistics", "Data Scientist"),
    ("r python ggplot2 dplyr tidyr statistics regression machine learning", "Data Scientist"),
    ("python lightgbm catboost xgboost ensemble methods feature selection", "Data Scientist"),
    ("python spacy nltk named entity recognition text processing nlp pipeline", "Data Scientist"),
    ("python anomaly detection isolation forest time series pandas scikit-learn", "Data Scientist"),

    # ── Data Analyst ──
    ("sql excel power bi tableau data visualization reporting", "Data Analyst"),
    ("python sql pandas data cleaning visualization excel pivot", "Data Analyst"),
    ("tableau sql excel statistics data analysis dashboard", "Data Analyst"),
    ("power bi dax sql excel data modeling reporting", "Data Analyst"),
    ("sql python excel google sheets data analysis reporting kpi", "Data Analyst"),
    ("looker sql data studio business intelligence reporting", "Data Analyst"),
    ("excel sql access pivot tables vlookup data analysis", "Data Analyst"),
    ("python sql matplotlib seaborn statistics business analysis", "Data Analyst"),
    ("r sql ggplot2 dplyr data wrangling visualization", "Data Analyst"),
    ("sql postgresql excel power bi statistics dashboards", "Data Analyst"),

    # ── DevOps Engineer ──
    ("docker kubernetes aws ci/cd jenkins linux bash scripting", "DevOps Engineer"),
    ("terraform ansible aws infrastructure as code devops", "DevOps Engineer"),
    ("linux docker kubernetes helm ci/cd gitlab pipelines", "DevOps Engineer"),
    ("aws cloudformation terraform ec2 s3 iam devops", "DevOps Engineer"),
    ("azure devops pipelines docker kubernetes powershell", "DevOps Engineer"),
    ("gcp kubernetes terraform ci/cd github actions monitoring", "DevOps Engineer"),
    ("jenkins docker kubernetes aws ecs ecr bash linux", "DevOps Engineer"),
    ("ansible terraform aws vpc rds ec2 auto scaling", "DevOps Engineer"),
    ("kubernetes helm prometheus grafana monitoring alerting", "DevOps Engineer"),
    ("docker-compose nginx linux bash ci/cd github actions aws", "DevOps Engineer"),

    # ── ML Engineer ──
    ("python tensorflow pytorch scikit-learn mlops model deployment", "ML Engineer"),
    ("python machine learning mlflow docker kubernetes model serving", "ML Engineer"),
    ("pytorch transformers huggingface model fine-tuning deployment", "ML Engineer"),
    ("python tensorflow keras model optimization quantization tflite", "ML Engineer"),
    ("python scikit-learn feature engineering model evaluation mlops", "ML Engineer"),
    ("python pytorch lightning distributed training gpu optimization", "ML Engineer"),
    ("python onnx model deployment rest api docker flask", "ML Engineer"),
    ("mlops airflow kubeflow model registry feature store", "ML Engineer"),
    ("python tensorflow serving triton inference server optimization", "ML Engineer"),
    ("python ray distributed computing hyperparameter tuning optuna", "ML Engineer"),

    # ── Cybersecurity Analyst ──
    ("network security penetration testing ethical hacking linux firewall", "Cybersecurity Analyst"),
    ("kali linux metasploit wireshark nmap vulnerability assessment", "Cybersecurity Analyst"),
    ("siem splunk incident response threat hunting network security", "Cybersecurity Analyst"),
    ("python cybersecurity scripting network scanning penetration testing", "Cybersecurity Analyst"),
    ("iso 27001 risk assessment security policies compliance", "Cybersecurity Analyst"),
    ("owasp web application security burp suite sql injection xss", "Cybersecurity Analyst"),
    ("forensics log analysis incident response threat intelligence", "Cybersecurity Analyst"),
    ("aws security iam policies cloudtrail config compliance", "Cybersecurity Analyst"),
    ("zero trust architecture network security vpn firewall ids ips", "Cybersecurity Analyst"),
    ("ctf challenges reverse engineering binary exploitation assembly", "Cybersecurity Analyst"),

    # ── Mobile Developer ──
    ("react native javascript ios android mobile development", "Mobile Developer"),
    ("flutter dart mobile development ios android ui", "Mobile Developer"),
    ("swift xcode ios development cocoapods mvvm", "Mobile Developer"),
    ("kotlin android development jetpack compose mvvm", "Mobile Developer"),
    ("react native expo javascript firebase mobile app", "Mobile Developer"),
    ("flutter dart firebase state management provider", "Mobile Developer"),
    ("swift ios swiftui combine core data", "Mobile Developer"),
    ("kotlin android room retrofit mvvm coroutines", "Mobile Developer"),
    ("xamarin c# ios android cross platform mobile", "Mobile Developer"),
    ("ionic angular typescript mobile web app", "Mobile Developer"),

    # ── UI/UX Designer ──
    ("figma adobe xd user research wireframing prototyping ux design", "UI/UX Designer"),
    ("sketch figma invision user testing interaction design", "UI/UX Designer"),
    ("ux research usability testing user journey mapping figma", "UI/UX Designer"),
    ("adobe xd illustrator photoshop ui design prototyping", "UI/UX Designer"),
    ("figma design systems component library accessibility wcag", "UI/UX Designer"),
    ("user research persona creation information architecture figma", "UI/UX Designer"),
    ("motion design after effects figma prototyping animation", "UI/UX Designer"),
    ("product design figma ux writing accessibility heuristics", "UI/UX Designer"),
    ("adobe illustrator photoshop figma branding visual design", "UI/UX Designer"),
    ("wireframing user flows figma usability testing a/b testing", "UI/UX Designer"),

    # ── Cloud Architect ──
    ("aws azure gcp cloud architecture microservices serverless", "Cloud Architect"),
    ("aws solutions architect ec2 rds vpc cloudfront lambda", "Cloud Architect"),
    ("azure cloud services arm templates aks cosmos db", "Cloud Architect"),
    ("gcp bigquery cloud run pub/sub terraform cloud architecture", "Cloud Architect"),
    ("serverless lambda api gateway dynamodb aws cloud", "Cloud Architect"),
    ("multi-cloud strategy aws azure kubernetes terraform", "Cloud Architect"),
    ("aws well-architected framework cost optimization security", "Cloud Architect"),
    ("cloud migration lift and shift replatforming aws azure", "Cloud Architect"),
    ("edge computing iot aws greengrass cloud architecture", "Cloud Architect"),
    ("cloud networking vpc peering transit gateway load balancing", "Cloud Architect"),

    # ── Database Administrator ──
    ("mysql postgresql database administration backup recovery tuning", "Database Administrator"),
    ("oracle dba sql performance tuning backup rman rac", "Database Administrator"),
    ("mongodb database administration replica sets sharding", "Database Administrator"),
    ("postgresql replication performance tuning vacuum indexing", "Database Administrator"),
    ("sql server dba ssms replication always on availability groups", "Database Administrator"),
    ("redis caching database administration clustering sentinel", "Database Administrator"),
    ("cassandra nosql database administration data modeling", "Database Administrator"),
    ("mysql innodb performance schema query optimization indexing", "Database Administrator"),
    ("elasticsearch kibana indexing search optimization cluster", "Database Administrator"),
    ("database design normalization sql erd data modeling", "Database Administrator"),
]

print(f"✅ Dataset loaded: {len(dataset)} training samples")
print(f"   Unique job roles: {len(set(d[1] for d in dataset))}")

# ─────────────────────────────────────────────
# 2. PREPARE DATA
# ─────────────────────────────────────────────
skills_text = [item[0] for item in dataset]
job_roles   = [item[1] for item in dataset]

label_encoder = LabelEncoder()
y = label_encoder.fit_transform(job_roles)

# ✅ FIXED VECTORIZER — preserves "node.js", "scikit-learn" as single tokens
vectorizer = TfidfVectorizer(
    analyzer='word',
    tokenizer=lambda x: [s.strip() for s in x.split()],  # ← KEY FIX
    lowercase=True,
    min_df=1,
    sublinear_tf=True
)
X = vectorizer.fit_transform(skills_text)

print(f"✅ Feature matrix shape: {X.shape}")
print(f"   ({X.shape[0]} samples × {X.shape[1]} unique skills)")

# ─────────────────────────────────────────────
# 3. TRAIN-TEST SPLIT
# ─────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ─────────────────────────────────────────────
# 4. TRAIN
# ─────────────────────────────────────────────
print("\n🚀 Training Random Forest model...")

model = RandomForestClassifier(
    n_estimators=300,   # increased from 200
    max_depth=None,     # let trees grow fully — better for clean skill data
    min_samples_split=2,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# ─────────────────────────────────────────────
# 5. EVALUATE
# ─────────────────────────────────────────────
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"✅ Model trained successfully!")
print(f"   Accuracy on test set: {accuracy * 100:.1f}%")

# ─────────────────────────────────────────────
# 6. SAVE
# ─────────────────────────────────────────────
with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

with open("vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

with open("label_encoder.pkl", "wb") as f:
    pickle.dump(label_encoder, f)

print("\n✅ Saved: model.pkl, vectorizer.pkl, label_encoder.pkl")

# ─────────────────────────────────────────────
# 7. TEST ALL 3 PROBLEM ROLES
# ─────────────────────────────────────────────
test_cases = [
    ("Full Stack Developer test",
     "react node.js express mongodb javascript html css rest api git"),
    ("Data Scientist test",
     "python pandas numpy scikit-learn machine learning matplotlib statistics"),
    ("Hari's skills from screenshot",
     "node.js express.js python mongodb rest apis git postgresql system design"),
]

print("\n🧪 Test Results:")
print("─" * 55)
for label, skills in test_cases:
    vec = vectorizer.transform([skills])
    pred = model.predict(vec)[0]
    probs = model.predict_proba(vec)[0]
    role = label_encoder.inverse_transform([pred])[0]
    conf = max(probs) * 100
    top3 = np.argsort(probs)[::-1][:3]
    print(f"\n  {label}")
    print(f"  → Predicted: {role} ({conf:.1f}% confidence)")
    print(f"  → Top 3:")
    for idx in top3:
        r = label_encoder.inverse_transform([idx])[0]
        p = probs[idx] * 100
        print(f"     {r}: {p:.1f}%")

print("\n✅ Done! Run: python app.py")
