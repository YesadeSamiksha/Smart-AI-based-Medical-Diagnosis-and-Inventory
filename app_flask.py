"""
MedAI Flask Backend - ML-based Medical Diagnosis API
Uses pre-trained models for diabetes, lung cancer, and blood pressure prediction

Run with: python app_flask.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ==================================================
# Configuration
# ==================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Try to import ML libraries, fallback to rule-based if not available
try:
    import joblib
    import pickle
    import pandas as pd
    import numpy as np
    ML_AVAILABLE = True
except ImportError as e:
    print(f"ML libraries not available: {e}")
    print("Using rule-based predictions only")
    ML_AVAILABLE = False

# ==================================================
# Helper Functions
# ==================================================
def safe_float(value, default=0.0):
    """Safely convert a value to float."""
    if value == '' or value is None:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_int(value, default=0):
    """Safely convert a value to int."""
    if value == '' or value is None:
        return default
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return default

def calculate_bmi(weight: float, height: float):
    """Calculate BMI (weight in kg, height in cm)."""
    try:
        if height is None or height <= 0:
            return None
        height_m = height / 100 if height > 3 else height
        bmi = weight / (height_m ** 2)
        return round(bmi, 2)
    except Exception:
        return None

def get_bmi_category(bmi):
    """Get BMI category based on value."""
    if bmi is None:
        return "Unknown"
    bmi = float(bmi)
    if bmi < 18.5:
        return "Underweight"
    elif 18.5 <= bmi < 25:
        return "Normal weight"
    elif 25 <= bmi < 30:
        return "Overweight"
    else:
        return "Obese"

# ==================================================
# Load Models (if available)
# ==================================================
diabetes_model = None
diabetes_encoders = None
diabetes_features = None
lung_rf = None
lung_scaler = None
lung_features = None
bp_model = None
bp_scaler = None
bp_features = None

if ML_AVAILABLE and os.path.exists(MODELS_DIR):
    try:
        diabetes_model = joblib.load(os.path.join(MODELS_DIR, "diabetes_model.pkl"))
        diabetes_encoders = joblib.load(os.path.join(MODELS_DIR, "diabetes_encoders.pkl"))
        diabetes_features = joblib.load(os.path.join(MODELS_DIR, "diabetes_features.pkl"))
        print("✅ Diabetes model loaded")
    except Exception as e:
        print(f"⚠ Diabetes model not found: {e}")

    try:
        lung_rf = joblib.load(os.path.join(MODELS_DIR, "lungcancer_rf_model.pkl"))
        lung_scaler = joblib.load(os.path.join(MODELS_DIR, "lungcancer_scaler.pkl"))
        lung_features = joblib.load(os.path.join(MODELS_DIR, "lungcancer_features.pkl"))
        print("✅ Lung cancer model loaded")
    except Exception as e:
        print(f"⚠ Lung cancer model not found: {e}")

    try:
        bp_model = joblib.load(os.path.join(MODELS_DIR, "bp_awareness_model.pkl"))
        bp_scaler = joblib.load(os.path.join(MODELS_DIR, "bp_awareness_scaler.pkl"))
        bp_features = joblib.load(os.path.join(MODELS_DIR, "bp_awareness_features.pkl"))
        print("✅ Blood pressure model loaded")
    except Exception as e:
        print(f"⚠ Blood pressure model not found: {e}")

# ==================================================
# Rule-Based Prediction Functions
# ==================================================
def rule_based_diabetes_prediction(data):
    """Rule-based diabetes risk assessment."""
    score = 0
    
    # Age risk
    age = safe_int(data.get('age', 0))
    if age > 60:
        score += 3
    elif age > 45:
        score += 2
    elif age > 35:
        score += 1
    
    # BMI risk
    bmi = safe_float(data.get('bmi', 0))
    if bmi > 35:
        score += 4
    elif bmi > 30:
        score += 3
    elif bmi > 25:
        score += 2
    elif bmi > 22:
        score += 1
    
    # Family history
    if str(data.get('family_history', '')).lower() == 'yes':
        score += 3
    
    # Physical activity
    activity = str(data.get('physical_activity', '')).lower()
    if activity in ['sedentary', 'none']:
        score += 2
    elif activity == 'light':
        score += 1
    
    # Diet quality
    diet = str(data.get('diet_quality', '')).lower()
    if diet == 'poor':
        score += 2
    elif diet == 'fair':
        score += 1
    
    # Smoking
    if str(data.get('smoking', '')).lower() == 'yes':
        score += 1
    
    # Symptoms scoring
    symptoms = ['frequent_urination', 'excessive_thirst', 'tiredness', 
                'blurred_vision', 'slow_healing', 'dark_skin_patches', 'frequent_infections']
    for symptom in symptoms:
        if str(data.get(symptom, '')).lower() == 'yes':
            score += 1
    
    # Determine risk level
    max_score = 22
    probability = min(score / max_score, 1.0)
    
    if probability >= 0.55:
        risk_level = "High Risk"
    elif probability >= 0.3:
        risk_level = "Medium Risk"
    else:
        risk_level = "Low Risk"
    
    return {
        'prediction': risk_level,
        'probability': round(probability * 100, 1),
        'risk_level': risk_level.lower().replace(' ', '_'),
        'score': score,
        'max_score': max_score,
        'model_type': 'rule_based'
    }

def rule_based_lung_prediction(data):
    """Rule-based lung cancer risk assessment."""
    score = 0
    
    # Age risk
    age = safe_int(data.get('age', 0))
    if age > 65:
        score += 3
    elif age > 55:
        score += 2
    elif age > 40:
        score += 1
    
    # Gender (males have slightly higher risk)
    if str(data.get('gender', '')).lower() == 'male':
        score += 1
    
    # Smoking (most significant factor)
    smoking = str(data.get('smoking', '')).lower()
    if smoking in ['current', 'yes', '2']:
        score += 5
    elif smoking in ['former', '1']:
        score += 3
    
    # Genetic risk / Family history
    genetic = str(data.get('genetic_risk', '')).lower()
    if genetic in ['high', '2', 'yes']:
        score += 3
    elif genetic in ['medium', '1']:
        score += 2
    
    # Chronic lung disease
    if str(data.get('chronic_lung_disease', '')).lower() in ['yes', '2', '1']:
        score += 2
    
    # Alcohol use
    alcohol = str(data.get('alcohol_use', '')).lower()
    if alcohol in ['high', '2']:
        score += 1
    
    # Dust allergy
    if str(data.get('dust_allergy', '')).lower() in ['yes', '2', '1']:
        score += 1
    
    # Symptoms
    if str(data.get('chest_pain', '')).lower() in ['yes', '2', '1']:
        score += 2
    if str(data.get('coughing_blood', '')).lower() in ['yes', '2', '1']:
        score += 4
    if str(data.get('fatigue', '')).lower() in ['yes', '2', '1']:
        score += 1
    if str(data.get('weight_loss', '')).lower() in ['yes', '2', '1']:
        score += 2
    if str(data.get('shortness_of_breath', '')).lower() in ['yes', '2', '1']:
        score += 2
    if str(data.get('wheezing', '')).lower() in ['yes', '2', '1']:
        score += 1
    if str(data.get('swallowing_difficulty', '')).lower() in ['yes', '2', '1']:
        score += 2
    
    # Determine risk level
    max_score = 32
    probability = min(score / max_score, 1.0)
    
    if probability >= 0.5:
        risk_level = "High"
    elif probability >= 0.25:
        risk_level = "Medium"
    else:
        risk_level = "Low"
    
    return {
        'prediction': risk_level,
        'probability': round(probability * 100, 1),
        'risk_level': risk_level.lower(),
        'score': score,
        'max_score': max_score,
        'model_type': 'rule_based'
    }

def rule_based_bp_prediction(data):
    """Blood pressure classification (AHA Guidelines)."""
    systolic = safe_int(data.get('systolic', 120))
    diastolic = safe_int(data.get('diastolic', 80))
    
    # AHA Classification
    if systolic < 120 and diastolic < 80:
        category = "Normal"
        risk = "low"
        probability = 10
        description = "Your blood pressure is in the healthy range."
        recommendations = ["Maintain healthy lifestyle", "Regular exercise", "Balanced diet"]
    elif systolic < 130 and diastolic < 80:
        category = "Elevated"
        risk = "medium"
        probability = 35
        description = "Blood pressure is slightly elevated. May progress to hypertension if not addressed."
        recommendations = ["Reduce sodium intake", "Increase physical activity", "Monitor regularly"]
    elif systolic < 140 or diastolic < 90:
        category = "Hypertension Stage 1"
        risk = "medium"
        probability = 55
        description = "High blood pressure stage 1. Lifestyle changes recommended, medication may be needed."
        recommendations = ["Consult doctor", "Reduce stress", "DASH diet recommended", "Regular monitoring"]
    elif systolic >= 180 or diastolic >= 120:
        category = "Hypertensive Crisis"
        risk = "critical"
        probability = 95
        description = "URGENT: Dangerously high blood pressure. Seek immediate medical attention!"
        recommendations = ["SEEK IMMEDIATE MEDICAL CARE", "Call emergency services if having symptoms"]
    else:
        category = "Hypertension Stage 2"
        risk = "high"
        probability = 75
        description = "High blood pressure stage 2. Medication and lifestyle changes likely needed."
        recommendations = ["See doctor immediately", "Medication may be required", "Strict lifestyle changes"]
    
    # Heart rate analysis
    heart_rate = safe_int(data.get('heart_rate', 72))
    hr_status = "Normal"
    if heart_rate < 60:
        hr_status = "Low (Bradycardia)"
    elif heart_rate > 100:
        hr_status = "High (Tachycardia)"
    
    return {
        'prediction': category,
        'probability': probability,
        'risk_level': risk,
        'systolic': systolic,
        'diastolic': diastolic,
        'heart_rate': heart_rate,
        'heart_rate_status': hr_status,
        'description': description,
        'recommendations': recommendations,
        'model_type': 'rule_based'
    }

# ==================================================
# API Routes
# ==================================================
@app.route('/')
def home():
    return jsonify({
        'message': 'MedAI Backend API',
        'version': '1.0.0',
        'endpoints': ['/api/health', '/api/diabetes', '/api/lung', '/api/bp', '/api/symptoms']
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'ml_available': ML_AVAILABLE,
        'models': {
            'diabetes': diabetes_model is not None,
            'lung_cancer': lung_rf is not None,
            'blood_pressure': bp_model is not None
        }
    })

@app.route('/api/diabetes', methods=['POST'])
def predict_diabetes():
    """Diabetes prediction endpoint."""
    try:
        data = request.json
        
        # Calculate BMI if not provided
        if 'bmi' not in data or not data['bmi']:
            weight = safe_float(data.get('weight', 0))
            height = safe_float(data.get('height', 0))
            if weight > 0 and height > 0:
                data['bmi'] = calculate_bmi(weight, height)
            else:
                data['bmi'] = 25.0
        
        # Use rule-based prediction (can be enhanced with ML model later)
        result = rule_based_diabetes_prediction(data)
        result['bmi'] = data.get('bmi')
        result['bmi_category'] = get_bmi_category(data.get('bmi'))
        
        return jsonify(result)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lung', methods=['POST'])
def predict_lung_cancer():
    """Lung cancer prediction endpoint."""
    try:
        data = request.json
        return jsonify(rule_based_lung_prediction(data))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bp', methods=['POST'])
def predict_blood_pressure():
    """Blood pressure prediction endpoint."""
    try:
        data = request.json
        return jsonify(rule_based_bp_prediction(data))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/symptoms', methods=['POST'])
def analyze_symptoms():
    """Symptom checker endpoint."""
    try:
        data = request.json
        symptoms = data.get('symptoms', [])
        
        if isinstance(symptoms, str):
            symptoms = [s.strip() for s in symptoms.split(',')]
        
        # Symptom-to-condition mapping
        symptom_map = {
            'fever': ['flu', 'infection', 'covid-19', 'malaria'],
            'cough': ['flu', 'cold', 'bronchitis', 'covid-19', 'asthma'],
            'headache': ['migraine', 'tension headache', 'flu', 'dehydration'],
            'fatigue': ['anemia', 'diabetes', 'thyroid disorder', 'depression'],
            'chest pain': ['heart disease', 'anxiety', 'muscle strain', 'acid reflux'],
            'shortness of breath': ['asthma', 'heart disease', 'anxiety', 'pneumonia'],
            'nausea': ['gastritis', 'food poisoning', 'pregnancy', 'migraine'],
            'vomiting': ['food poisoning', 'gastritis', 'pregnancy', 'infection'],
            'dizziness': ['vertigo', 'low blood pressure', 'dehydration', 'anemia'],
            'joint pain': ['arthritis', 'injury', 'infection', 'lupus'],
            'skin rash': ['allergy', 'eczema', 'infection', 'psoriasis'],
            'abdominal pain': ['gastritis', 'appendicitis', 'ibs', 'food poisoning'],
            'back pain': ['muscle strain', 'herniated disc', 'kidney stones', 'arthritis'],
            'sore throat': ['cold', 'flu', 'strep throat', 'tonsillitis'],
            'runny nose': ['cold', 'flu', 'allergies', 'sinusitis'],
            'muscle pain': ['flu', 'overexertion', 'fibromyalgia', 'infection'],
            'frequent urination': ['diabetes', 'uti', 'prostate issues', 'pregnancy'],
            'weight loss': ['diabetes', 'thyroid disorder', 'cancer', 'depression'],
            'blurred vision': ['diabetes', 'eye strain', 'migraine', 'glaucoma']
        }
        
        conditions = []
        for symptom in symptoms:
            symptom_lower = symptom.lower().strip()
            for key, diseases in symptom_map.items():
                if key in symptom_lower or symptom_lower in key:
                    conditions.extend(diseases)
        
        # Count occurrences
        from collections import Counter
        condition_counts = Counter(conditions)
        
        if condition_counts:
            most_common = condition_counts.most_common(5)
            total_matches = sum(count for _, count in most_common)
            
            return jsonify({
                'success': True,
                'possible_conditions': [
                    {
                        'condition': c.title(), 
                        'likelihood': round(count / total_matches * 100),
                        'matches': count
                    } for c, count in most_common
                ],
                'recommendation': 'These are possible conditions based on your symptoms. Please consult a healthcare professional for proper diagnosis and treatment.',
                'symptom_count': len(symptoms),
                'disclaimer': 'This is not a medical diagnosis. Always consult with a qualified healthcare provider.'
            })
        else:
            return jsonify({
                'success': True,
                'possible_conditions': [],
                'recommendation': 'Unable to match symptoms to known conditions. Please consult a healthcare professional.',
                'symptom_count': len(symptoms)
            })
            
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

# ==================================================
# Run Server
# ==================================================
if __name__ == '__main__':
    print("\n" + "="*60)
    print("   🏥 MedAI Backend Server")
    print("="*60)
    print(f"\n📁 Base Directory: {BASE_DIR}")
    print(f"📦 Models Directory: {MODELS_DIR}")
    print(f"🔬 ML Libraries: {'Available' if ML_AVAILABLE else 'Not Available'}")
    print(f"\n🌐 Server: http://localhost:5000")
    print("\n📌 API Endpoints:")
    print("   GET  /           - API info")
    print("   GET  /api/health - Health check")
    print("   POST /api/diabetes - Diabetes risk prediction")
    print("   POST /api/lung   - Lung cancer risk prediction")
    print("   POST /api/bp     - Blood pressure analysis")
    print("   POST /api/symptoms - Symptom checker")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
