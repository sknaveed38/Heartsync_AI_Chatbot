from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
model_path = os.path.join(os.path.dirname(__file__), 'heart_model.pkl')
if not os.path.exists(model_path):
    # Train model if it doesn't exist
    from model import train_model
    train_model()

model = joblib.load(model_path)

class HealthData(BaseModel):
    age: int
    sex: int
    cp: int
    trestbps: int
    chol: int
    fbs: int
    restecg: int
    thalach: int
    exang: int
    oldpeak: float
    slope: int
    ca: int
    thal: int

@app.get("/")
def read_root():
    return {"message": "HeartSync AI Backend is running"}

@app.post("/predict")
def predict(data: HealthData):
    try:
        input_data = data.dict()
        df = pd.DataFrame([input_data])
        prediction = model.predict(df)[0]
        probability = model.predict_proba(df)[0][1]
        
        # Explainable AI: Identify top contributing factors using Feature Importance
        importances = model.feature_importances_
        feature_names = df.columns
        
        # Calculate contributions (importance * presence of factor)
        # For simplicity, we'll just use feature importance directly as the ranking metric
        contributions = []
        for i, name in enumerate(feature_names):
            contributions.append({"feature": name, "importance": importances[i]})
        
        # Sort by importance
        top_factors_data = sorted(contributions, key=lambda x: x['importance'], reverse=True)[:3]
        
        # Map technical names to user-friendly names
        friendly_names = {
            "age": "Age",
            "sex": "Gender",
            "cp": "Chest Pain Type",
            "trestbps": "Resting Blood Pressure",
            "chol": "Cholesterol Level",
            "fbs": "Fasting Blood Sugar",
            "restecg": "ECG Results",
            "thalach": "Max Heart Rate",
            "exang": "Exercise Angina",
            "oldpeak": "ST Depression",
            "slope": "ST Slope",
            "ca": "Major Vessels",
            "thal": "Thalassemia Type"
        }
        
        explained_factors = [friendly_names.get(f['feature'], f['feature']) for f in top_factors_data]

        return {
            "prediction": int(prediction),
            "probability": float(probability),
            "risk_level": "High" if probability > 0.5 else "Low",
            "top_factors": explained_factors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
