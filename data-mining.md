# Data Mining & Machine Learning Overview

## 1. Concepts Definitions

### What is LSTM (Long Short-Term Memory)?
**LSTM** is a specialized type of Recurrent Neural Network (RNN) designed to learn long-term dependencies in sequential data.
*   **Problem Solved**: Standard RNNs suffer from the "vanishing gradient" problem, making them forget earlier inputs in long sequences.
*   **Mechanism**: LSTMs use a system of **gates** (Input, Forget, and Output gates) to control the flow of information. They can explicitly decide what to remember and what to discard over long periods.
*   **Use Cases**: Time-series forecasting, text generation, speech recognition, and analyzing student learning trajectories over prolonged courses.

### What is Prophet?
**Prophet** is an open-source forecasting procedure developed by Facebook (Meta).
*   **Mechanism**: It is based on an **additive model** that fits non-linear trends with yearly, weekly, and daily seasonality, plus holiday effects. It works best with time series that have strong seasonal effects and several seasons of historical data.
*   **Key Advantage**: unlike Arima or LSTM, Prophet is robust to missing data and shifts in the trend, and typically handles outliers well. It is very user-friendly features for tuning "changepoints" in trends.

### Online vs. Offline Training

| Feature | **Offline Training** (Batch Learning) | **Online Training** (Incremental Learning) |
| :--- | :--- | :--- |
| **Data Usage** | Trains on the **entire dataset** at once. | Trains on **individual data points** or mini-batches as they arrive. |
| **Model Updates** | Static model (e.g., v1.0). Must simply retrain on the whole new dataset to update. | Dynamic model (e.g., v1.0 -> v1.01). Updates weights continuously in real-time. |
| **Cost** | Computationally expensive peaks (retraining takes hours/days). | Constant low computation, but requires complex infrastructure. |
| **Use Case in EduPath** | **Used in EduPath**. We retrain the `PathPredictor` XGBoost model nightly/weekly based on collected logs. | Used in high-velocity systems like stock trading or ad bidding. |

### Difficulties and Perspectives (Challenges)
*   **Data Quality**: "Garbage In, Garbage Out". Inconsistent formats from different LMS sources (Moodle vs Canvas) require heavy cleaning.
*   **Cold Start**: New students have no history, making early predictions difficult.
*   **Scalability**: processing millions of logs for thousands of students requires distributed computing (like Spark) rather than simple Pandas scripts.
*   **Overfitting**: Models might memorize a specific semester's pattern rather than general learning behaviors.

---

## 2. EduPath-MS Project Specifics

### Data Origin
In this project (`EduPath-MS`), the data is **Synthetic / Simulated**.
We do not use real-world private student data for this prototype. Instead, we generate it using the **`PrepaData`** microservice.
*   **Source Code**: `PrepaData/generate_dataset.py`
*   **Method**: We use the **Faker** library and `random` module to generate realistic `student_logs` (login, take_quiz, etc.) and profiles.
*   **External Data**: The system simulates an "External Dataset" (e.g., certificates from Kaggle) by generating a CSV file named `external_data.csv` locally during the setup process.

### Data Cleaning Process
Data cleaning is handled by the **`PrepaData/etl.py`** script (Extract, Transform, Load) and the specific model services.

1.  **Extraction**: Raw logs are pulled from the Postgres `student_logs` table.
2.  **Transformation (Aggregations)**:
    *   We group raw logs by `student_id`.
    *   We calculate metrics: `total_actions`, `avg_score`, `total_time`.
3.  **Handling Missing Values**:
    *   `fillna(0)` is used for students with no activity (replacing `NaN` with 0).
4.  **Feature Engineering (Risk Calculation)**:
    *   A heuristic is applied: If `avg_score < 50` or `total_actions < 10`, `risk_factor` is set to **1.0 (High Risk)**.
5.  **Normalization (Standard Scaling)**:
    *   **Specific to StudentProfiler**: Before running K-Means clustering, we use `StandardScaler` from `scikit-learn` to normalize features (making `total_time` in seconds comparable to `avg_score` 0-100).
    *   *Note*: The `PathPredictor` (XGBoost) uses the raw features without scaling, as tree-based models are robust to unscaled data.

### Microservices & Models Architecture
The system follows a **Microservices Architecture**, orchestrated via **Docker Compose** and **Consul**.

| Service Name | Technology | Role | Model / Logic |
| :--- | :--- | :--- | :--- |
| **PrepaData** | Python | **ETL Pipeline**: Generates and cleans data. | N/A |
| **StudentProfiler** | Python | **Unsupervised Learning**: Segments students. | **K-Means Clustering** (`k=3`) |
| **PathPredictor** | Python | **Supervised Learning**: Predicts failure risk. | **XGBoost Classifier** |
| **StudentCoach** | Python (FastAPI) | **GenAI**: Chatbot & Quiz Generator. | **LLM (GPT-3.5-turbo)** |
| **RecoBuilder** | Python | **Recommender System**: Finds relevant content. | **Embeddings (MiniLM) + FAISS** |
| **APIGateway** | Node.js | **Routing**: Single entry point for all clients. | N/A |
| **AuthService** | Node.js | **Security**: JWT Authentication. | N/A |
| **LMSConnector** | Node.js | **Integration**: Adapter for external LMS. | N/A |
| **RabbitMQ** | Erlang | **Messaging**: Async event bus (e.g., "Quiz Finished" events). | N/A |

#### Architecture Diagram Summary
1.  **Client** hits **APIGateway**.
2.  **APIGateway** routes to **StudentCoach** (for chat) or **AuthService** (for login).
3.  **RabbitMQ** decouples the heavy AI jobs:
    *   When a student finishes a quiz, **StudentCoach** publishes a message.
    *   **StudentProfiler** consumes it to update the student's cluster in the background.
    *   **PathPredictor** re-evaluates the risk score offline or on-demand.
