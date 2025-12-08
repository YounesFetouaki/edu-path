import pandas as pd
from sqlalchemy import create_engine
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import mlflow
import mlflow.xgboost
import pickle

# DB Config
DB_USER = 'admin'
DB_PASS = 'adminpassword'
DB_HOST = '127.0.0.1'
DB_PORT = '5433'
DB_NAME = 'edupath_db'
DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

def train_model():
    print("Starting PathPredictor Training...")
    engine = create_engine(DATABASE_URI)
    
    # Load Data (Join analytics with profiles for labels/features)
    # Target: Let's assume 'risk_factor' >= 0.5 is 'At Risk' (Binary Classification)
    # We want to predict if a student IS at risk.
    df = pd.read_sql("SELECT * FROM student_analytics", engine)
    
    if df.empty:
        print("No training data found.")
        return

    # Features
    features = ['avg_score', 'total_actions', 'total_time']
    X = df[features].fillna(0)
    
    # Target
    y = (df['risk_factor'] > 0.5).astype(int) 

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # MLflow Tracking
    mlflow.set_experiment("PathPredictor_Risk_Model")
    
    with mlflow.start_run():
        print("Training XGBoost...")
        model = xgb.XGBClassifier(use_label_encoder=False, eval_metric='logloss')
        model.fit(X_train, y_train)
        
        preds = model.predict(X_test)
        acc = accuracy_score(y_test, preds)
        
        print(f"Accuracy: {acc}")
        mlflow.log_metric("accuracy", acc)
        mlflow.xgboost.log_model(model, "xgboost-model")
        
        # Save local pickle for easy loading in API
        with open("model.pkl", "wb") as f:
            pickle.dump(model, f)
        
    print("Model trained and saved.")

if __name__ == "__main__":
    train_model()
