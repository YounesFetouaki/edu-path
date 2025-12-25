# EduPath-MS — Learning Analytics & Recommendations

## Overview
EduPath-MS is a microservices-based platform designed to enhance student learning through analytics and personalized recommendations.
It features a Teacher Console (Web) and a Student Coach (Mobile), backed by 7+ microservices.

## Architecture
- **AuthService**: Centralized JWT Authentication (Port 3005).
- **APIGateway**: Unified entry point (Port 8000).
- **LMSConnector**: Syncs data from mock LMS (Moodle/Canvas).
- **PrepaData**: ETL pipeline for learning analytics.
- **StudentProfiler**: Clusters students into profiles (e.g., Procrastinator, Diligent).
- **PathPredictor**: Predicts success/failure probability.
- **RecoBuilder**: Generates targeted learning resources recommendations.
- **TeacherConsole**: React Dashboard for teachers (Port 3000).
- **StudentCoach**: Flutter Mobile App & Python Backend (Port 5000).

## Infrastructure
- **PostgreSQL**: Primary Relational DB (Port 5433).
- **MinIO**: Object Storage (Port 9000).

## How to Run (Using Docker)
The entire platform is containerized.

1.  **Start all services**:
    ```bash
    docker-compose up --build
    ```

2.  **Access the Applications**:
    -   **Teacher Console**: [http://localhost:3000](http://localhost:3000)
        -   Login: `admin@edupath.com` / `admin`
    -   **API Gateway**: [http://localhost:8000](http://localhost:8000)
    -   **MinIO Console**: [http://localhost:9001](http://localhost:9001)

3.  **Run Mobile App (Student Coach)**:
    Since the mobile app runs on the device/browser, run it separately:
    ```bash
    cd StudentCoach/mobile
    flutter run -d chrome
    ```

## Development
- To test the backend API manually:
    ```bash
    curl http://localhost:8000/auth/login -X POST -d '{"email":"admin@edupath.com", "password":"admin"}' -H "Content-Type: application/json"
    ```

## Technologies
- **Frontend**: React, Flutter
- **Backend**: Node.js (Express), Python (FastAPI/Flask)
- **Data**: PostgreSQL, MinIO
- **ML**: Scikit-Learn, XGBoost

## Vids : 

Watch the web application video : https://drive.google.com/file/d/1wzEcvV2ovoe-FRcIa5FCr8WuhU9oudcX/view?usp=drive_link
Watch the mobile app video : https://drive.google.com/file/d/14sj0A3I6HVZzpjuiku3mrpG3mlBDUGDQ/view?usp=drive_link


