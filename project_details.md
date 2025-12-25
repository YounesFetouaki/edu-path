# EduPath-MS Technical Documentation

This document provides a detailed technical overview of the AI components, Microservices Architecture, and DevOps infrastructure (Jenkins, Consul, RabbitMQ).

---

## 1. AI & Machine Learning Components

We employ a **hybrid AI strategy** that combines predictive analytics (Machine Learning) with interactive assistance (Generative AI).

### A. Models Used

| Component | Model Algorithm | Library | Purpose |
| :--- | :--- | :--- | :--- |
| **Student Profiler** | **K-Means Clustering** (`k=3`) | `scikit-learn` | **Unsupervised Learning**: Segments students into clusters (*At Risk*, *Standard*, *High Achiever*) based on behavior (time spent, scores). |
| **Path Predictor** | **XGBoost Classifier** | `xgboost` | **Supervised Learning**: A Gradient Boosted Decision Tree that predicts the probability of a student failing (`risk_factor > 0.5`) based on historical patterns. |
| **Reco Builder** | **Embeddings** (`all-MiniLM-L6-v2`) + **FAISS** | `sentence-transformers` | **Semantic Search**: Converts course content into vector embeddings to find the most relevant resources for a student's weak areas using K-Nearest Neighbors (KNN). |
| **Student Coach** | **LLM (GPT-3.5-turbo)** | `openai` | **Generative AI**: Powers the chatbot to answer questions, explain concepts, and generate custom quizzes on the fly. |

### B. Prevention of Overfitting ("Overlifting")

"Overlifting" (interpreted as **Overfitting**) occurs when a model learns noise rather than the underlying pattern. We mitigated this using:

1.  **Regularization (XGBoost)**:
    *   We utilized **L1 (Lasso)** and **L2 (Ridge)** regularization parameters within XGBoost. these penalize complex models, forcing the algorithm to select only the most impactful features.
    *   **Early Stopping**: Training stops if the validation score doesn't improve after a set number of rounds.

2.  **Data Partitioning**:
    *   Strict **80/20 Train-Test Split**. The model is trained on 80% of the data and evaluated on the hidden 20%. This ensures the accuracy metric represents performance on *unseen* students, not just memorization of the training set.

3.  **Feature Scaling (Clustering)**:
    *   We applied **StandardScaler** to normalize input data (e.g., converting 'milliseconds played' and 'exam scores' to the same scale). This prevents variables with large numbers from dominating the geometric distance in K-Means.

---

## 2. Microservices Architecture

The system is designed as a distributed mesh of specialized services.

| Service | Technology | Port | Responsibilities |
| :--- | :--- | :--- | :--- |
| **API Gateway** | Node.js / Express | `8000` | **Entry Point**: Routes client requests to backend services. Handles payload validation and rate limiting. |
| **Auth Service** | Node.js / JWT | `3005` | **Security**: Manages User Registration, Login, and JWT Token issuance. Connects to Postgres. |
| **LMS Connector** | Node.js | `3001` | **Integration**: Syncs data from external systems (Moodle/Canvas). Acts as an adapter layer. |
| **Student Coach** | Python (FastAPI) | `5000` | **AI Application**: Manages the Chat and Quiz interfaces. Calls OpenAI API and handles fallback logic. |
| **Student Profiler** | Python | `5001` | **Analytics Job**: Periodically scans engagement logs to update student profiles (Clusters). |
| **Path Predictor** | Python | `5002` | **Inference Engine**: Hosts the XGBoost model to serve real-time risk predictions for students. |
| **Reco Builder** | Python | `5003` | **Recommendation**: Re-indexes content and serves resource recommendations via FAISS vector search. |

---

## 3. DevOps & Infrastructure

### A. Consul (Service Discovery)
*   **Role**: Dynamic Service Registry.
*   **Mechanism**: Instead of hardcoding IP addresses (e.g., `http://localhost:5000`), services register with Consul on startup.
*   **Workflow**:
    1.  **Registration**: `Student Coach` starts and tells Consul "I am running at IP X, Port 5000".
    2.  **Health Check**: Consul pings the service every 10s. If it fails, it is removed from the registry.
    3.  **Discovery**: Other services query Consul to find the current active address of `Student Coach`.

### D. Consul UI Demo (What to Show)
When you open [http://localhost:8500](http://localhost:8500), you will see:
1.  **Services Tab**:
    *   `consul`: The registry service itself.
    *   `auth-service-3005`: The Node.js Authentication service (Registered via `consul` npm package).
    *   `student-coach-backend-5000`: The Python AI Coach service (Registered via `python-consul`).
    *   *Status*: All should show 🟢 **Passing** (meaning their health check URLs are reachable).
2.  **Nodes Tab**:
    *   Shows the container/node running these services (e.g., `edupath-consul`).


### B. RabbitMQ (Message Broker)
*   **Role**: Asynchronous Communication.
*   **Purpose**: Decouples services to improve performance and reliability.
*   **Use Case**:
    *   **Events**: When a student completes a quiz, the *Coach Service* publishes a `quiz_completed` event.
    *   **Consumers**: The *Profiler Service* listens for this event to immediately update the student's profile, without making the user wait for that calculation to finish.

### C. Jenkins (CI/CD Pipeline)
*   Check `Jenkinsfile` for the exact definition.

**The Pipeline Stages:**

1.  **Checkout**
    *   *Action*: Pulls the latest code from the Git repository (SCM).

2.  **Build Services**
    *   *Action*: Docker Composition.
    *   *Command*: `docker compose build`
    *   *Detail*: This stage builds the Docker images for all microservices defined in `docker-compose.yml`, ensuring all Python (`requirements.txt`) and Node (`package.json`) dependencies are installed.

3.  **Run Tests**
    *   *Action*: Integration Testing.
    *   *Command*: (Placeholder) `docker compose run --rm tests`
    *   *Detail*: Validates that the built services can start and pass basic health checks or unit tests before deployment.

4.  **Deploy**
    *   *Action*: Deployment.
    *   *Command*: `docker compose up -d`
    *   *Detail*: Spins up the containers in the target environment (e.g., Staging server), replacing old instances with the new builds.
