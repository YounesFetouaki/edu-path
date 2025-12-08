# Conception et Architecture EduPath-MS

Ce document regroupe les éléments de conception demandés : Architecture globale, Diagrammes BPMN des processus métiers, et conception détaillée (Classes, Cas d'utilisation) pour chaque microservice.

## 1. Architecture Microservices

### Vue d'ensemble
Le système EduPath-MS est composé de services autonomes communiquant principalement via API REST (Synchrone) et partageant des bases de données PostgreSQL et un stockage MinIO.

```mermaid
graph TD
    User[Étudiant/Professeur] --> Gateway[API Gateway :8000]
    
    subgraph "Frontends"
        TC[Teacher Console :3000] --> Gateway
        SC[Student Coach Mobile] --> Gateway
    end
    
    Gateway --> Auth[AuthService :3005]
    Gateway --> LMS[LMSConnector :3001]
    Gateway --> CoachBE[StudentCoach Backend :5000]
    
    subgraph "Data Processing Pipelines"
        LMS --> DB[(PostgreSQL)]
        Prepa[PrepaData] --> DB
        Prepa --> Profiler[StudentProfiler :5001]
        Prepa --> Predictor[PathPredictor :5002]
        Prepa --> Reco[RecoBuilder :5003]
    end
    
    CoachBE --> Reco
    CoachBE --> Predictor
    
    Reco --> MinIO[(MinIO Object Store)]
```

### Tableau Récapitulatif

| Microservice | Rôle | Technologies | Base de Données | Communication |
| :--- | :--- | :--- | :--- | :--- |
| **AuthService** | Gestion de l'authentification (Login, JWT) | Node.js (Express) | PostgreSQL | REST (Sync) |
| **APIGateway** | Point d'entrée unique, routage, validation JWT | Node.js (Express), Http-Proxy | - | REST (Sync) |
| **LMSConnector** | Synchronisation des données depuis LMS externes (Moodle) | Node.js (Express) | PostgreSQL | REST (Sync) |
| **PrepaData** | ETL : Extraction, Transformation, Chargement des logs | Python (Pandas) | PostgreSQL | Script/Batch |
| **StudentProfiler** | Clustering des étudiants (K-Means) | Python (Flask, Scikit-learn) | PostgreSQL | REST (Sync) |
| **PathPredictor** | Prédiction de risques d'échec (XGBoost) | Python (Flask, XGBoost) | - (Lit PostgreSQL) | REST (Sync) |
| **RecoBuilder** | Recommandation de contenu (RAG/Vector Search) | Python (Flask, FAISS) | PostgreSQL / MinIO | REST (Sync) |
| **StudentCoach** | Chatbot & Interaction Élève | Python (FastAPI), Flutter | - | REST (Sync) |
| **TeacherConsole** | Dashboard Professeur | React (CRA) | - | REST (Sync) |

---

## 2. Conception par Microservice

### 2.1 AuthService

**Rôle** : Vérifie les identifiants et délivre des tokens JWT.

#### Cas d'Utilisation
*   **Acteur** : Tout utilisateur (Étudiant, Professeur)
*   **Cas** : "Se connecter", "Se déconnecter", "Valider Token".

#### Diagramme de Classes
```mermaid
classDiagram
    class User {
        +int id
        +string email
        +string password_hash
        +string role
        +login()
        +verifyToken()
    }
    class AuthController {
        +login(req, res)
        +validate(req, res)
    }
    AuthController ..> User : uses
```

#### Diagramme BPMN : Processus d'Authentification
```mermaid
sequenceDiagram
    participant User
    participant Gateway
    participant AuthService
    participant DB
    
    User->>Gateway: POST /auth/login (email, pass)
    Gateway->>AuthService: Forward Request
    AuthService->>DB: SELECT * FROM users WHERE email=?
    DB-->>AuthService: User Data
    
    alt Password Invalid
        AuthService-->>Gateway: 401 Unauthorized
        Gateway-->>User: Erreur Login
    else Password Valid
        AuthService->>AuthService: Generate JWT
        AuthService-->>Gateway: 200 OK (Token)
        Gateway-->>User: Token JWT
    end
```

---

### 2.2 LMSConnector

**Rôle** : Récupère les cours, notes et logs depuis le LMS (simulé) et les stocke en local.

#### Diagramme BPMN : Processus de Synchronisation
```mermaid
graph TD
    Start((Début Sync)) --> FetchUsers[Récupérer Utilisateurs LMS]
    FetchUsers --> SaveUsers[Sauvegarder dans DB Locale]
    SaveUsers --> FetchGrades[Récupérer Notes/Scores]
    FetchGrades --> SaveGrades[Sauvegarder Notes]
    SaveGrades --> FetchLogs[Récupérer Logs d'activité]
    FetchLogs --> SaveLogs[Sauvegarder Logs]
    SaveLogs --> End((Fin Sync))
```

---

### 2.3 PrepaData (ETL)

**Rôle** : Nettoie les données brutes pour l'analyse.

#### BPMN / Flow de Données
```mermaid
graph LR
    Raw[Données Brutes (Logs, Notes)] -->|Extract| Clean[Nettoyage & Agrégation]
    Clean -->|Transform| Feat[Calcul Indicateurs (Temps passé, Moyenne)]
    Feat -->|Load| AnalyticsTable[Table 'student_analytics']
```

---

### 2.4 StudentProfiler

**Rôle** : Analyse les comportements pour segmenter les étudiants.

#### Diagramme de Classes
```mermaid
classDiagram
    class Profiler {
        +run_profiler()
        +get_profiles()
    }
    class KMeansModel {
        +fit(data)
        +predict(data)
    }
    Profiler ..> KMeansModel : uses
```

#### BPMN : Processus de Profilage
```mermaid
stateDiagram-v2
    [*] --> FetchData: Lire Analytics Table
    FetchData --> Normalize: Normaliser Données
    Normalize --> Cluster: Appliquer K-Means
    Cluster --> Label: Assigner Labels (Risque, Standard, Elite)
    Label --> Save: Mettre à jour 'student_profiles'
    Save --> [*]
```

---

### 2.5 PathPredictor

**Rôle** : Estime la probabilité d'échec d'un étudiant.

#### Cas d'Utilisation
*   **Acteur** : Système (Automatique) ou Professeur (Consultation)
*   **Cas** : "Prédire Risque Échec"

#### BPMN : Prédiction
```mermaid
sequenceDiagram
    participant Client
    participant PathPredictor
    participant Model
    
    Client->>PathPredictor: GET /predict/{student_id}
    PathPredictor->>PathPredictor: Fetch Student Features
    PathPredictor->>Model: predict_proba(features)
    Model-->>PathPredictor: probability (0.85)
    PathPredictor-->>Client: { "at_risk": true, "prob": 0.85 }
```

---

### 2.6 RecoBuilder

**Rôle** : Recommande des ressources pédagogiques adaptées.

#### Diagramme de Classes
```mermaid
classDiagram
    class Recommender {
        +recommend(query)
        +build_index()
    }
    class VectorStore {
        +search(vector, k)
        +add(vector)
    }
    class Resource {
        +string title
        +string type
        +float difficulty
    }
    Recommender ..> VectorStore : usesFAISS
    VectorStore "1" *-- "*" Resource : contains
```

---

### 2.7 StudentCoach (Backend & Mobile)

**Rôle** : Compagnon d'apprentissage interactif (Chatbot).

#### Cas d'Utilisation
*   **Acteur** : Étudiant
*   **Cas** : "Poser une question", "Demander un Quiz", "Voir sa progression".

#### BPMN : Interaction Chat
```mermaid
sequenceDiagram
    actor Student
    participant MobileApp
    participant CoachBackend
    participant OpenAI_Or_Offline
    
    Student->>MobileApp: "Explique-moi le SQL"
    MobileApp->>CoachBackend: POST /chat
    
    alt API Key Present
        CoachBackend->>OpenAI_Or_Offline: Call GPT-3.5
        OpenAI_Or_Offline-->>CoachBackend: Response text
    else Offline Mode
        CoachBackend->>CoachBackend: Select local heuristic response
    end
    
    CoachBackend-->>MobileApp: "SQL est un langage..."
    MobileApp-->>Student: Affiche Réponse
```

---

### 2.8 TeacherConsole

**Rôle** : Tableau de bord pour la supervision.

#### Diagramme de Navigation (Conception UI)
```mermaid
graph TD
    Login[Page Login] --> Dashboard
    Dashboard --> StudentList[Liste Étudiants]
    Dashboard --> Analytics[Vue Globale Analytics]
    StudentList --> StudentDetail[Détail Étudiant + Préductions]
    Dashboard --> CourseMgr[Gestion des Cours]
```
