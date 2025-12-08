# PlantUML Diagrams

This document contains PlantUML code for Use Case and Class diagrams for each microservice in the EduPath-MS platform. You can render these using any PlantUML viewer (like PlanUML Editor, VS Code extension, or online server).

## 1. Authentication Service (AuthService)

**Use Case Diagram:**
```plantuml
@startuml
left to right direction
actor "User" as user
actor "Admin" as admin

component "AuthService" {
    usecase "Login" as UC1
    usecase "Register" as UC2
    usecase "Validate Token" as UC3
    usecase "Refresh Token" as UC4
}

user --> UC1
user --> UC2
user --> UC4

admin --> UC1
admin --> UC2
UC1 ..> UC3 : include
@enduml
```

**Class Diagram:**
```plantuml
@startuml
class User {
    +id: Integer
    +email: String
    +passwordHash: String
    +role: String
    +createdAt: DateTime
}

class AuthController {
    +register(req, res): void
    +login(req, res): void
    +validate(req, res): void
}

class AuthService {
    +hashPassword(password): String
    +verifyPassword(password, hash): Boolean
    +generateToken(user): String
}

AuthController --> AuthService
AuthService --> User
@enduml
```

## 2. LMS Connector Service

**Use Case Diagram:**
```plantuml
@startuml
left to right direction
actor "Student" as student
actor "Teacher" as teacher
actor "Data Service" as data

component "LMSConnector" {
    usecase "View Courses" as UC1
    usecase "View Course Details" as UC2
    usecase "View Assignments" as UC3
    usecase "Create Course" as UC4
    usecase "Assign Task" as UC5
    usecase "Generate Fake Data" as UC6
}

student --> UC1
student --> UC2
student --> UC3

teacher --> UC1
teacher --> UC2
teacher --> UC4
teacher --> UC5

data --> UC6
@enduml
```

**Class Diagram:**
```plantuml
@startuml
class Student {
    +id: Integer
    +name: String
    +email: String
    +persona: String
}

class Course {
    +id: Integer
    +title: String
    +description: String
    +category: String
    +thumbnail_url: String
}

class Module {
    +id: Integer
    +course_id: Integer
    +title: String
    +order_index: Integer
}

class Chapter {
    +id: Integer
    +module_id: Integer
    +title: String
    +content_type: String
    +content_url: String
}

class Assignment {
    +id: Integer
    +student_id: Integer
    +title: String
    +description: String
    +due_date: Date
    +status: String
}

class LMSController {
    +getAllCourses(): JSON
    +getCourseDetails(id): JSON
    +getAssignments(studentId): JSON
    +createCourse(data): JSON
}

Course "1" *-- "many" Module
Module "1" *-- "many" Chapter
Student "1" -- "many" Assignment
LMSController --> Course
LMSController --> Student
@enduml
```

## 3. Preparation Data Service (PrepaData)

**Use Case Diagram:**
```plantuml
@startuml
left to right direction
actor "System Timer" as timer

component "PrepaData" {
    usecase "Extract Logs" as UC1
    usecase "Transform Data" as UC2
    usecase "Calculate Metrics" as UC3
    usecase "Load to Warehouse" as UC4
}

timer --> UC1
UC1 ..> UC2 : include
UC2 ..> UC3 : include
UC3 ..> UC4 : include
@enduml
```

**Class Diagram:**
```plantuml
@startuml
class ETLJob {
    +run(): void
    +extract(): DataFrame
    +transform(df): DataFrame
    +load(df): void
}

class StudentLog {
    +student_id: Integer
    +activity_id: Integer
    +action: String
    +timestamp: DateTime
    +duration: Integer
}

class EngagementMetric {
    +student_id: Integer
    +avg_score: Float
    +total_time: Float
    +login_frequency: Integer
    +completion_rate: Float
}

ETLJob --> StudentLog : Reads
ETLJob --> EngagementMetric : Calcs
@enduml
```

## 4. Student Profiler Service

**Use Case Diagram:**
```plantuml
@startuml
left to right direction
actor "Teacher" as teacher
actor "Gateway" as gateway

component "StudentProfiler" {
    usecase "Get Student Profile" as UC1
    usecase "Train Clustering Model" as UC2
    usecase "Cluster Students" as UC3
}

gateway --> UC1
teacher --> UC1
UC2 ..> UC3 : include
@enduml
```

**Class Diagram:**
```plantuml
@startuml
class ProfilerApp {
    +get_profile(id): JSON
    +get_all_profiles(): JSON
}

class KMeansModel {
    +train(data): void
    +predict(data): Integer
    +save(): void
    +load(): void
}

class StudentProfile {
    +student_id: Integer
    +cluster_id: Integer
    +risk_level: String
    +persona_name: String
}

ProfilerApp --> StudentProfile
ProfilerApp --> KMeansModel : Uses
@enduml
```

## 5. Path Predictor Service

**Use Case Diagram:**
```plantuml
@startuml
left to right direction
actor "Student" as student
actor "System" as sys

component "PathPredictor" {
    usecase "Predict Risk" as UC1
    usecase "Recommend Intervention" as UC2
    usecase "Train XGBoost" as UC3
}

student --> UC1
sys --> UC3
UC1 ..> UC2 : extends
@enduml
```

**Class Diagram:**
```plantuml
@startuml
class PredictorApp {
    +predict(features): JSON
}

class XGBoostModel {
    +train_model(df): void
    +evaluate_model(df): void
    +save_to_mlflow(): void
}

class RiskPrediction {
    +student_id: Integer
    +is_at_risk: Boolean
    +probability: Float
    +recommended_action: String
}

PredictorApp --> XGBoostModel : Inferences
PredictorApp --> RiskPrediction : Returns
@enduml
```

## 6. Recommendation Builder (RecoBuilder)

**Use Case Diagram:**
```plantuml
@startuml
left to right direction
actor "Student" as student

component "RecoBuilder" {
    usecase "Get Recommendations" as UC1
    usecase "Index Resources" as UC2
    usecase "Search Similar Items" as UC3
}

student --> UC1
UC1 ..> UC3 : include
@enduml
```

**Class Diagram:**
```plantuml
@startuml
class RecoApp {
    +recommend(studentId): JSON
}

class VectorEngine {
    +build_index(content): void
    +search(query_vector): List<Resource>
    +load_index(): void
}

class Resource {
    +id: Integer
    +title: String
    +type: String
    +embedding: Vector
}

RecoApp --> VectorEngine
VectorEngine --> Resource
@enduml
```

## 7. Student Coach Service

**Use Case Diagram:**
```plantuml
@startuml
left to right direction
actor "Student" as student

component "StudentCoach" {
    usecase "Chat with AI" as UC1
    usecase "Generate Quiz" as UC2
    usecase "Get Advice" as UC3
}

student --> UC1
student --> UC2
UC1 ..> UC3 : include
@enduml
```

**Class Diagram:**
```plantuml
@startuml
class CoachApp {
    +chat(message): String
    +generate_quiz(topic): JSON
}

class LLMService {
    +call_openai(prompt): String
    +format_response(text): JSON
}

class Quiz {
    +topic: String
    +questions: List<Question>
}

CoachApp --> LLMService : Delegating
CoachApp --> Quiz : Generates
@enduml
```

## 8. Teacher Console

**Use Case Diagram:**
```plantuml
@startuml
left to right direction
actor "Teacher" as teacher

component "TeacherConsole" {
    usecase "View Dashboard" as UC1
    usecase "Manage Courses" as UC2
    usecase "Create AI Quiz" as UC3
    usecase "View Student Risks" as UC4
}

teacher --> UC1
teacher --> UC2
teacher --> UC3
teacher --> UC4
@enduml
```

## 9. API Gateway

**Use Case Diagram:**
```plantuml
@startuml
left to right direction
actor "Client (Web/Mobile)" as client

component "APIGateway" {
    usecase "Route Request" as UC1
    usecase "Authenticate Request" as UC2
    usecase "Load Balance" as UC3
}

client --> UC1
UC1 ..> UC2 : include
@enduml
```
