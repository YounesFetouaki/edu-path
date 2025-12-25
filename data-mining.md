# Data Mining & Machine Learning Report

## 1. Direct Answers (What is used?)

### Q: Which Model is used in EduPath-MS?
**Answer: XGBoost.**
*   We use **XGBoost Classifier** (in `PathPredictor`) to predict if a student is "At Risk" based on their grades and activity.
*   *Note*: **LSTM** and **Prophet** are **NOT** used in this project. They are just alternative technologies for different types of problems (Time Series) that we are not solving here.

### Q: Is it Online or Offline Training?
**Answer: Offline Training.**
*   We use **Offline (Batch) Training**.
*   **Why?**: The `PathPredictor` service reads the **entire** `student_analytics` table from the database and trains the model from scratch. It does not update "on-the-fly".

---

## 2. Concepts Definitions

### LSTM (Long Short-Term Memory)
*   **What is it?**: A Deep Learning model (RNN) great for sequences (text, speech, time series).
*   **Status**: **NOT USED**.

### Prophet
*   **What is it?**: A Time-Series forecasting tool by Meta/Facebook, good for seasonal data.
*   **Status**: **NOT USED**.

---

## 3. Project Data & Architecture
*Based on the system implementation and data flow.*

### A. The Data Sources
The architecture relies on a **PostgreSQL** database enriched by an external **CSV** file.

1.  **Core Operational Data (PostgreSQL)**
    *   **Students & Users**: Identity management (`students`, `users`).
    *   **Academics**: Course structure (`courses`, `classes`, `assignments`).
    *   **Performance**: Grades and results (`grades`, `quizzes`).
    *   **Activity Logs**: Raw events like logins and clicks (`student_logs`).

2.  **External Dataset (CSV)**
    *   **File**: `external_data.csv`
    *   **Content**: Enrichment attributes like `study_hours_external` and `additional_score`.
    *   **Purpose**: Simulates data from a third-party system coverage.

### B. Data Preparation Pipeline (ETL)
The raw data is processed in `PrepaData/etl.py` to create a clean "Golden Dataset".

1.  **Ingestion**: Raw logs are extracted from Postgres and merged with the CSV.
2.  **Transformation**:
    *   **Aggregation**: Metrics calculated per student: `total_actions`, `avg_score`, `total_time`.
    *   **Risk Calculation**: Heuristic rule: `Score < 50` OR `Actions < 10` = **High Risk**.
    *   **Imputation**: Missing values filled with `0`.
3.  **Loading**: Saved to `student_analytics` table.

### C. Architecture & Models
The Microservices use the clean `student_analytics` table for inference.

| Service | Model Used | Training Mode | Input | Output |
| :--- | :--- | :--- | :--- | :--- |
| **PathPredictor** | **XGBoost** | **Offline** | `avg_score`, `total_actions`, `total_time` | **Risk Probability** |
| **StudentProfiler** | **K-Means** | **Offline** | `avg_score`, `total_actions`, `total_time` | **Persona** ("At Risk", etc) |
