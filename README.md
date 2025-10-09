# EduShield
# EduShield: AI-Powered Student Loan Fraud Detection

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Frontend](https://img.shields.io/badge/Frontend-JS-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Backend](https://img.shields.io/badge/Backend-Python_&_Flask-blue)](https://flask.palletsprojects.com/)
[![Database](https://img.shields.io/badge/Database-Supabase-green)](https://supabase.com/)
[![ML](https://img.shields.io/badge/ML-Scikit--learn-orange)](https://scikit-learn.org/)

**EduShield** is a full-stack web application designed to combat fraud in the student loan sector. By leveraging machine learning and advanced real-time behavioral analysis, our platform provides a secure, efficient, and intelligent solution for processing loan applications, protecting both lenders and genuine applicants.

This project was built for a hackathon to demonstrate a modern, end-to-end approach to AI-driven fraud detection.

---
## 🚀 Key Features

EduShield is more than just a form. It's an intelligent system with several layers of fraud detection.

* **🧠 AI-Powered Risk Scoring:** At its core, a `Random Forest` model trained on various user features predicts the probability of fraud, generating a real-time risk score for each application.

* **💡 Real-time Behavioral Analysis:** The system captures and analyzes how a user interacts with the form, flagging non-human or suspicious behavior. Key metrics include:
    * `Typing Speed`
    * `Error Rate` (corrections made while typing)
    * `Hesitation Time`

* **📸 Advanced Liveness Detection:** To prevent spoofing with static photos, EduShield employs a **Flashing Color Liveness Check**. The screen flashes different colors, and the camera captures the reflection on the user's face, proving they are a live person in front of a live screen. This is a lightweight, AI-free, and highly effective liveness verification method.

* **🌍 Impossible Travel & Velocity Checks:** The backend flags applications by checking for multiple submissions from the same IP address or device fingerprint in a short time frame, a common tactic used by fraudsters.

* **🔐 Secure Authentication & Role-Based Access:** Separate, secure login portals for Applicants and Loan Officers, powered by Supabase Auth.

* **👨‍💼 Officer Review Dashboard:** A dedicated dashboard for loan officers to view the applicant queue, sorted by risk. Officers can drill down into any application to see the full data, the AI-generated risk score, and the liveness verification photos side-by-side.

---

## 🛠️ Technology Stack & Architecture

This project is built with a modern, decoupled architecture.

#### Technologies Used:
* **Frontend**: HTML5, CSS3, Vanilla JavaScript
* **Backend**: Python, Flask
* **Database & Auth**: Supabase (PostgreSQL)
* **Machine Learning**: Scikit-learn, Pandas, NumPy, Joblib
* **Deployment Concept**: The frontend can be served statically. The Flask backend is a separate service that exposes a REST API.

#### Architecture Diagram:
The user's application data is sent to a Flask API, which runs the ML model and communicates with Supabase to store and retrieve data.
