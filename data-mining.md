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

## 2. Full Microservices Architecture

The system is a distributed mesh of services, orchestrated by **Consul** and **Docker Compose**.

### A. Infrastructure & DevOps (The Backbone)
| Component | Technology | Role & Responsibility |
| :--- | :--- | :--- |
| **Consul** | HashiCorp Consul | **Service Discovery**: Distinct services "register" themselves here so they can find each other by name (e.g., `student-coach`) instead of hardcoded IPs. |
| **RabbitMQ** | Erlang | **Message Broker**: Handles **Asynchronous** communication. When a heavy event happens (like "Quiz Finished"), it's queued here so the user doesn't have to wait for the analysis to finish. |
| **Jenkins** | Java / Groovy | **CI/CD Pipeline**: Automates the building, testing, and deployment of all these containers. Defined in `Jenkinsfile`. |
| **PostgreSQL**| Database | **Primary Storage**: Holds all user data, logs, courses, and grades. |

### B. Core Application Services
| Service | Technology | Port | Role |
| :--- | :--- | :--- | :--- |
| **APIGateway** | Node.js / Express | `8000` | **The Doorman**: Single entry point. Routes all client requests to the correct internal service. Handles rate limiting. |
| **AuthService** | Node.js / JWT | `3005` | **Security**: Manages Logins, Registration, and issues **JWT Tokens** to secure the API. |
| **LMSConnector**| Node.js | `3001` | **Adapter**: Syncs data from external systems (like Moodle or Canvas) so our app has content to show. |

### C. AI & Data Intelligence Services
| Service | Model Used | Training | Role |
| :--- | :--- | :--- | :--- |
| **PrepaData** | *ETL Script* | N/A | **Generates Data**: Creates the synthetic dataset and cleans it (ETL) for the other AI services. |
| **PathPredictor**| **XGBoost** | Offline | **Risk Engine**: Predicts if a student will fail (`Risk Probability`). |
| **StudentProfiler**| **K-Means** | Offline | **Segmentation**: Groups students into "Personas" (At Risk, Standard, High Allocator). |
| **StudentCoach** | **LLM (GPT-3.5)**| Pre-trained | **Chatbot**: The AI tutor that answers student questions in real-time. |
| **RecoBuilder** | **Embeddings** | Offline | **Search**: Builds the index found relevant study resources using Vector Search. |

---

## 3. Data & Training Details

### The Data Sources
1.  **PostgreSQL**: Main DB for logs (`student_logs`), users, and grades.
2.  **CSV (`external_data.csv`)**: A simulated external dataset for enrichment.

### Data Cleaning (ETL)
*   **Missing Values**: Filled with `0`.
*   **Risk Logic**: If `Score < 50` OR `Actions < 10` → **High Risk**.

### Concepts Definitions (For Reference)
*   **LSTM**: Deep Learning for sequences. **(Not Used)**
*   **Prophet**: Time-series forecasting. **(Not Used)**
*   **Online Training**: Updating models live. **(Not Used)**
