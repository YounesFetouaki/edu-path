from flask import Flask, request, jsonify
import pickle
import pandas as pd
import numpy as np

app = Flask(__name__)
model = None

# Load model on startup
try:
    # In a real scenario, we load from a file or MLflow
    # model = pickle.load(open("model.pkl", "rb"))
    pass
except:
    model = None

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        features = pd.DataFrame([data])
        # Mock model if not loaded
        if not model:
            return jsonify({"is_at_risk": False, "risk_probability": 0.1, "note": "Mock Model"})
            
        features = features[['avg_score', 'total_actions', 'total_time']] # Ensure order
        
        prediction = model.predict(features)[0]
        prob = model.predict_proba(features)[0].tolist()
        
        result = {
            "is_at_risk": bool(prediction),
            "risk_probability": prob[1] # Prob of class 1 (At Risk)
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
