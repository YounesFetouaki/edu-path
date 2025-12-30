# EduPath-MS: Machine Learning & Deep Learning Architecture Report

This document provides a comprehensive technical breakdown of the AI components within the EduPath-MS microservices ecosystem. It is designed to assist in defending the project implementation to a Machine Learning / Deep Learning professor.

---

## 1. High-Level Architecture
The system uses a **collaborative microservices architecture** where distinct AI services handle specific intelligent tasks. These services operate asynchronously and independently, communicating via a shared PostgreSQL database and RabbitMQ for event orchestration.

### The AI Service Suite
| Service Name | Type | Model/Algorithm | Role |
| :--- | :--- | :--- | :--- |
| **PrepaData** | ETL & Engineering | Pandas / Statistical Heuristics | **Data Pipeline**: Aggregates raw logs into usable features. |
| **PathPredictor** | Supervised Learning | **XGBoost Classifier** | **Predictive Analytics**: Predicts if a student is "At Risk" of failing. |
| **StudentProfiler** | Unsupervised Learning | **K-Means Clustering** | **User Segmentation**: Groups students into behavioral profiles (e.g., High Achiever). |
| **RecoBuilder** | Deep Learning (NLP) | **BERT Embeddings + FAISS** | **Recommendation Engine**: Intelligent semantic search for study resources. |

---

## 2. Detailed Component Analysis

### A. PrepaData (Data Engineering & ETL)
Before any ML happens, data must be cleaned and structured.
*   **Input**: `student_logs` (Raw interaction timestamps), `student_scores`.
*   **Process**:
    1.  **Extraction**: Pulls raw SQL data.
    2.  **Transformation**:
        *   *Aggregation*: Converts time-series logs into static features: `total_actions`, `total_time` (duration sum), `avg_score`.
        *   *Label Engineering*: Manually calculates a `risk_factor` ground truth for training.
            *   *Rule*: High Risk if `avg_score < 50` OR `total_actions < 10`.
        *   *Cleaning*: Fills `NaN` values with `0`.
    3.  **Loading**: Saves to the `student_analytics` table.
*   **Why this approach?**: ML models need structured inputs. Aggregating logs allows us to use simpler, more interpretable models (like XGBoost) instead of complex sequence models (like LSTM) for the MVP phase.

### B. PathPredictor (Risk Prediction)
*   **Goal**: Predict if a student will fail (Binary Classification).
*   **Algorithm**: **XGBoost (Extreme Gradient Boosting)**.
*   **Features Used**: `avg_score`, `total_actions`, `total_time`.
*   **Training Type**: **Offline (Batch)**. The model is retrained periodically on the whole dataset.
*   **Tracking**: Integrated with **MLflow** to track accuracy metrics across experiments.
*   **Technical Justification (Defense)**:
    *   **Why XGBoost?**: It is the state-of-the-art algorithm for tabular data, usually outperforming Deep Learning on structured datasets. It handles non-linear relationships well (e.g., time spent vs. score isn't always linear).
    *   **Why not Neural Networks?**: For tabular data with few features (3-10), Neural Nets are prone to overfitting and require more tuning. XGBoost is robust and efficient.

### C. StudentProfiler (Behavioral Segmentation)
*   **Goal**: Discover hidden patterns in student behavior without pre-defined labels.
*   **Algorithm**: **K-Means Clustering**.
*   **Hyperparameters**: `k=3` (Chosen to represent: Struggling, Average, High Performing).
*   **Process**:
    1.  **Scaling**: Uses `StandardScaler` to normalize features (so `total_time` in seconds doesn't dominate `score` in 1-100 range).
    2.  **Clustering**: Groups students based on similarity.
    3.  **Label Mapping**: Automatically analyzes cluster centers. The cluster with the lowest average score is labeled "At Risk", highest is "High Achiever".
*   **Technical Justification (Defense)**:
    *   **Why K-Means?**: It is computationally efficient and provides hard assignments, which are easy to use for reliable application logic (e.g., "Send this email to Group A").

### D. RecoBuilder (Intelligent Recommendations)
*   **Goal**: Recommend valid study resources based on content similarity.
*   **Algorithm**: **Semantic Search** using **Deep Learning Embeddings**.
*   **Model**: `all-MiniLM-L6-v2` (A distilled BERT Sentence Transformer).
*   **Search Index**: **FAISS** (Facebook AI Similarity Search).
*   **Process**:
    1.  **Vectorization**: Converts resource titles (e.g., "Advanced Python Lists") into 384-dimensional dense vectors.
    2.  **Indexing**: Stores vectors in a FAISS FlatL2 index for rapid nearest-neighbor lookup.
    3.  **Querying**: When a user searches, their query is converted to a vector, and FAISS finds the closest matching resource vectors.
*   **Technical Justification (Defense)**:
    *   **Why Embeddings?**: Keyword search fails on synonyms. Embeddings capture *meaning*. "AI" and "Machine Learning" are close in vector space, even if they share no words.

---

## 3. Professor Q&A Defense Strategy

**Q1: Why did you use Offline Training instead of Online Training?**
> **Answer**: For an educational context, student patterns don't drift rapidly (minute-by-minute). Batch training nightly is sufficient and significantly more stable/easier to maintain than an online learning pipeline which requires complex monitoring for catastrophic forgetting.

**Q2: Why didn't you use LSTM or RNNs for the logs?**
> **Answer**: We aggregated the logs into summary statistics (`total_time`, etc.) to use XGBoost. While LSTMs are great for raw sequences, they are data-hungry and harder to interpret. Given our dataset size, feature engineering + XGBoost yields better interpretability and performance.

**Q3: How do you handle overfitting?**
> **Answer**: In XGBoost, we can tune parameters like `max_depth` and `subsample`. In our code, we also strictly split data into Train/Test sets (80/20 split) to validate performance on unseen data.

**Q4: How do you evaluate your clustering (Unsupervised)?**
> **Answer**: Since we don't have labels, we evaluate internally by checking the separation of the cluster centers (e.g., does the "High Achiever" cluster actually have high scores?). In a production scenario, we would use the **Silhouette Score**.

**Q5: What is the "Cold Start" problem and how do you solve it?**
> **Answer**: New students have no logs, so `total_actions` is 0. Our model handles this by defaulting them to a standard risk profile until data accumulates, or we can use demographic data (not currently implemented) to make an initial guess.
