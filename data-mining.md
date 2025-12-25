# Data Mining & Machine Learning Report

## 1. Concepts Definitions (Short Answers)

### LSTM (Long Short-Term Memory)
*   **What is it?**: A Recurrent Neural Network (RNN) designed to process sequences of data (like text or time series) and "remember" important patterns over long periods.
*   **Status in Project**: **NOT USED**. We do not use deep learning for sequences in this version.

### Prophet
*   **What is it?**: A forecasting tool by Meta (Facebook) that handles time-series data with strong seasonal trends and missing values.
*   **Status in Project**: **NOT USED**.

### Online vs. Offline Training
*   **Offline Training (Batch)**:
    *   **Definition**: Training the model on the **entire dataset** at once. The model is static until the next full retrain.
    *   **Status in Project**: **USED**. We train the XGBoost and K-Means models on the full `student_analytics` table periodically.
*   **Online Training (Incremental)**:
    *   **Definition**: Updating the model continuously as individual data points arrive in real-time.
    *   **Status in Project**: **NOT USED**.

---

## 2. Project Data & Architecture
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
    *   **Content**: Enrichment attributes such as `study_hours_external` and `additional_score`.
    *   **Purpose**: Simulates data from a third-party system (like a previous school) to enhance the student profile.

### B. Data Preparation Pipeline (ETL)
The raw data is processed in `PrepaData/etl.py` to create a clean "Golden Dataset".

1.  **Ingestion**: Raw logs are extracted from Postgres and merged with the CSV.
2.  **Transformation**:
    *   **Aggregation**: Logs are compressed into summary metrics: `total_actions`, `avg_score`, `total_time`.
    *   **Risk Calculation**: A rule-based heuristic assigns a risk score:
        *   *If Score < 50 OR Actions < 10 → **High Risk (1.0)**.*
    *   **Imputation**: Missing values (`NaN`) are filled with `0`.
3.  **Loading**: The clean dataset is saved to the `student_analytics` table.

### C. Architecture & Models
The Microservices use the clean `student_analytics` table for inference.

| Service | Model | Input | Output |
| :--- | :--- | :--- | :--- |
| **PathPredictor** | **XGBoost** (Supervised) | `avg_score`, `total_actions`, `total_time` | **Risk Probability**: Chance of failing. |
| **StudentProfiler** | **K-Means** (Unsupervised) | `avg_score`, `total_actions`, `total_time` | **Persona**: "At Risk", "Standard", or "High Achiever". |
| **RecoBuilder** | **Embeddings** (FAISS) | Course Text Content | **Recommendations**: Relevant study materials. |
| **StudentCoach** | **LLM** (GPT-3.5) | User Chat Prompt | **AI Assistance**: Answers and explanations. |
