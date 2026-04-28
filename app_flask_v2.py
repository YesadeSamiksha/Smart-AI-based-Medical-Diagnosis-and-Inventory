"""
MedAI Flask Backend v2.0 - AI-powered Medical Diagnosis API
Features:
- Gemini AI-powered Symptom Analysis
- Admin Authentication & Dashboard
- User History & Trends Tracking
- Supabase Integration for data persistence

Run with: python app_flask_v2.py
"""

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from functools import wraps
import os
import json
import hashlib
import secrets
from datetime import datetime, timedelta
from collections import Counter

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'medai-secret-key-change-in-production')
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# ==================================================
# Configuration
# ==================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load environment variables from .env file
def load_env():
    env_path = os.path.join(BASE_DIR, '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
    # Also try .env.example if .env doesn't exist
    elif os.path.exists(os.path.join(BASE_DIR, '.env.example')):
        print("⚠ Using .env.example - Please create .env with your actual keys")

load_env()

# Configuration from environment
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://ydhfwvlhwxhiivheepqo.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY', '')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@medai.com')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'MedAI@Admin2024')

# Initialize AI and Database clients
GEMINI_AVAILABLE = False
gemini_model = None
SUPABASE_AVAILABLE = False
supabase = None

try:
    import google.generativeai as genai
    if GEMINI_API_KEY and GEMINI_API_KEY != 'your_gemini_api_key_here':
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        GEMINI_AVAILABLE = True
        print("[OK] Gemini AI configured")
    else:
        print("[WARN] Gemini API key not set")
except ImportError:
    print("[WARN] Install google-generativeai: pip install google-generativeai")
except Exception as e:
    print(f"[WARN] Gemini error: {e}")

try:
    from supabase import create_client
    if SUPABASE_KEY and SUPABASE_KEY != 'your_supabase_anon_key_here':
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        SUPABASE_AVAILABLE = True
        print("[OK] Supabase connected")
except ImportError:
    print("[WARN] Install supabase: pip install supabase")
except Exception as e:
    print(f"[WARN] Supabase error: {e}")

# In-memory storage (fallback when Supabase unavailable)
memory_db = {
    'users': {},
    'diagnosis_history': [],
    'admin_sessions': {}
}

# ==================================================
# Helper Functions
# ==================================================
def safe_float(value, default=0.0):
    if value == '' or value is None: return default
    try: return float(value)
    except: return default

def safe_int(value, default=0):
    if value == '' or value is None: return default
    try: return int(float(value))
    except: return default

def generate_token():
    return secrets.token_hex(32)

# ==================================================
# Admin Authentication
# ==================================================
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)
            
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Admin authentication required'}), 401
        
        # Accept local admin tokens from frontend (admin-v2.html uses this format)
        if token.startswith('admin-authenticated-'):
            return f(*args, **kwargs)
        
        # Also accept Flask-generated session tokens
        if token in memory_db['admin_sessions']:
            session_data = memory_db['admin_sessions'][token]
            if datetime.now() > session_data['expires']:
                del memory_db['admin_sessions'][token]
                return jsonify({'error': 'Session expired'}), 401
            return f(*args, **kwargs)
        
        return jsonify({'error': 'Admin authentication required'}), 401
    return decorated

# ==================================================
# Gemini AI Symptom Analysis
# ==================================================
def analyze_with_gemini(symptoms, patient_info=None):
    """Use Gemini AI for comprehensive symptom analysis."""
    if not GEMINI_AVAILABLE or not gemini_model:
        return None
    
    try:
        symptom_list = ', '.join(symptoms) if isinstance(symptoms, list) else symptoms
        
        patient_ctx = ""
        if patient_info:
            age = patient_info.get('age', 'not specified')
            gender = patient_info.get('gender', 'not specified')
            patient_ctx = f"\nPatient: {age} years old, {gender}"
            if patient_info.get('medical_history'):
                patient_ctx += f"\nMedical History: {patient_info.get('medical_history')}"
        
        prompt = f"""You are an expert AI medical assistant. Analyze these symptoms and provide detailed assessment.

SYMPTOMS: {symptom_list}{patient_ctx}

Respond ONLY with valid JSON (no markdown, no code blocks):
{{
    "primary_conditions": [
        {{"name": "Condition", "probability": 80, "severity": "mild|moderate|severe", "description": "Brief description"}}
    ],
    "differential_diagnosis": ["Other condition 1", "Other condition 2"],
    "risk_assessment": {{
        "overall_risk": "low|medium|high|critical",
        "urgency": "routine|soon|urgent|emergency",
        "risk_factors": ["factor1", "factor2"]
    }},
    "symptom_analysis": {{
        "most_significant": "Most concerning symptom",
        "symptom_correlation": "How symptoms relate",
        "red_flags": ["warning sign 1"]
    }},
    "recommendations": {{
        "immediate_actions": ["action1", "action2"],
        "lifestyle_changes": ["change1"],
        "when_to_seek_help": "Seek help if...",
        "specialists": ["Specialist type"]
    }},
    "follow_up_questions": ["Question 1", "Question 2"],
    "confidence_score": 75,
    "analysis_notes": "Additional observations",
    "disclaimer": "AI analysis - consult healthcare professional"
}}"""

        response = gemini_model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean markdown if present
        if '```' in text:
            text = text.split('```')[1] if '```' in text else text
            text = text.replace('json', '').strip()
        
        result = json.loads(text)
        result['ai_provider'] = 'gemini'
        result['model'] = 'gemini-1.5-flash'
        return result
        
    except json.JSONDecodeError as e:
        print(f"Gemini JSON error: {e}")
        return None
    except Exception as e:
        print(f"Gemini error: {e}")
        return None

def rule_based_analysis(symptoms, patient_info=None):
    """Fallback rule-based symptom analysis."""
    symptom_db = {
        'fever': ['flu', 'covid-19', 'infection', 'malaria', 'typhoid', 'dengue'],
        'cough': ['flu', 'cold', 'bronchitis', 'covid-19', 'asthma', 'pneumonia', 'tuberculosis'],
        'headache': ['migraine', 'tension headache', 'flu', 'dehydration', 'hypertension', 'sinusitis'],
        'fatigue': ['anemia', 'diabetes', 'thyroid disorder', 'depression', 'chronic fatigue', 'sleep apnea'],
        'chest pain': ['angina', 'heart disease', 'anxiety', 'acid reflux', 'muscle strain', 'costochondritis'],
        'shortness of breath': ['asthma', 'heart failure', 'pneumonia', 'anxiety', 'copd', 'pulmonary embolism'],
        'nausea': ['gastritis', 'food poisoning', 'pregnancy', 'migraine', 'vertigo', 'appendicitis'],
        'vomiting': ['food poisoning', 'gastritis', 'infection', 'appendicitis', 'migraine'],
        'dizziness': ['vertigo', 'low blood pressure', 'dehydration', 'anemia', 'inner ear infection'],
        'joint pain': ['arthritis', 'injury', 'lupus', 'gout', 'fibromyalgia', 'lyme disease'],
        'skin rash': ['allergy', 'eczema', 'psoriasis', 'infection', 'dermatitis', 'shingles'],
        'abdominal pain': ['gastritis', 'appendicitis', 'ibs', 'ulcer', 'gallstones', 'pancreatitis'],
        'back pain': ['muscle strain', 'herniated disc', 'kidney stones', 'arthritis', 'sciatica'],
        'sore throat': ['cold', 'flu', 'strep throat', 'tonsillitis', 'mono'],
        'runny nose': ['cold', 'flu', 'allergies', 'sinusitis'],
        'muscle pain': ['flu', 'overexertion', 'fibromyalgia', 'infection', 'vitamin d deficiency'],
        'frequent urination': ['diabetes', 'uti', 'overactive bladder', 'prostate issues'],
        'weight loss': ['diabetes', 'hyperthyroidism', 'cancer', 'depression', 'celiac disease'],
        'blurred vision': ['diabetes', 'eye strain', 'migraine', 'glaucoma', 'cataracts'],
        'insomnia': ['anxiety', 'depression', 'sleep apnea', 'stress'],
        'sweating': ['infection', 'hyperthyroidism', 'anxiety', 'menopause'],
        'swelling': ['heart failure', 'kidney disease', 'injury', 'allergic reaction'],
        'numbness': ['diabetes', 'stroke', 'carpal tunnel', 'multiple sclerosis', 'b12 deficiency'],
        'palpitations': ['anxiety', 'arrhythmia', 'anemia', 'hyperthyroidism'],
        'constipation': ['ibs', 'dehydration', 'hypothyroidism', 'medication side effect'],
        'diarrhea': ['food poisoning', 'ibs', 'infection', 'celiac disease']
    }
    
    severe_symptoms = ['chest pain', 'shortness of breath', 'numbness', 'severe headache', 'coughing blood', 'fainting']
    
    all_conditions = []
    matched_symptoms = []
    
    for symptom in symptoms:
        sym_lower = symptom.lower().strip()
        for key, conditions in symptom_db.items():
            if key in sym_lower or sym_lower in key:
                all_conditions.extend(conditions)
                matched_symptoms.append(key)
    
    if not all_conditions:
        return {
            "primary_conditions": [],
            "risk_assessment": {"overall_risk": "unknown", "urgency": "routine"},
            "recommendations": {"immediate_actions": ["Consult a healthcare professional for proper evaluation"]},
            "confidence_score": 0,
            "ai_provider": "rule_based"
        }
    
    counts = Counter(all_conditions)
    total = len(symptoms)
    
    primary = []
    for condition, count in counts.most_common(5):
        prob = min(round((count / total) * 100), 90)
        severity = "severe" if any(s in [x.lower() for x in symptoms] for s in severe_symptoms) else "moderate" if count >= 2 else "mild"
        primary.append({
            "name": condition.replace('_', ' ').title(),
            "probability": prob,
            "severity": severity,
            "description": f"Matched {count} of your symptoms"
        })
    
    has_severe = any(s.lower() in [x.lower() for x in severe_symptoms] for s in symptoms)
    
    if has_severe:
        risk, urgency = "high", "urgent"
    elif len(symptoms) > 4:
        risk, urgency = "medium", "soon"
    else:
        risk, urgency = "low", "routine"
    
    return {
        "primary_conditions": primary,
        "differential_diagnosis": [c for c, _ in counts.most_common(10)[5:]],
        "risk_assessment": {
            "overall_risk": risk,
            "urgency": urgency,
            "risk_factors": [f"{len(symptoms)} symptoms reported", f"{len(matched_symptoms)} recognized patterns"]
        },
        "symptom_analysis": {
            "most_significant": matched_symptoms[0] if matched_symptoms else symptoms[0],
            "symptom_correlation": f"Analyzed {len(symptoms)} symptoms",
            "red_flags": [s for s in symptoms if s.lower() in severe_symptoms]
        },
        "recommendations": {
            "immediate_actions": ["Monitor symptoms", "Stay hydrated", "Rest adequately"],
            "lifestyle_changes": ["Maintain healthy diet", "Regular sleep schedule"],
            "when_to_seek_help": "If symptoms worsen or persist beyond 48-72 hours",
            "specialists": ["General Practitioner"] if risk == "low" else ["Specialist consultation recommended"]
        },
        "follow_up_questions": [
            "How long have you had these symptoms?",
            "Are symptoms getting better or worse?",
            "Any medications currently taking?"
        ],
        "confidence_score": min(len(matched_symptoms) * 20, 70),
        "disclaimer": "This is automated analysis. Please consult a healthcare professional.",
        "ai_provider": "rule_based"
    }

# ==================================================
# Database Operations
# ==================================================
def save_to_db(user_id, diagnosis_type, input_data, result_data, risk_level):
    record = {
        'id': generate_token()[:32],
        'user_id': user_id,
        'diagnosis_type': diagnosis_type,
        'input_data': input_data,
        'result_data': result_data,
        'risk_level': risk_level,
        'created_at': datetime.now().isoformat()
    }
    
    if SUPABASE_AVAILABLE:
        try:
            supabase.table('diagnosis_results').insert({
                'user_id': user_id,
                'diagnosis_type': diagnosis_type,
                'input_data': json.dumps(input_data) if isinstance(input_data, dict) else str(input_data),
                'result_data': json.dumps(result_data) if isinstance(result_data, dict) else str(result_data),
                'risk_level': risk_level
            }).execute()
            return {'success': True}
        except Exception as e:
            print(f"DB save error: {e}")
    
    memory_db['diagnosis_history'].append(record)
    return {'success': True}

def get_history(user_id, limit=50):
    if SUPABASE_AVAILABLE:
        try:
            result = supabase.table('diagnosis_results').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(limit).execute()
            return result.data
        except Exception as e:
            print(f"DB fetch error: {e}")
    
    return [r for r in memory_db['diagnosis_history'] if r['user_id'] == user_id][-limit:]

def get_all_stats():
    if SUPABASE_AVAILABLE:
        try:
            diagnoses = supabase.table('diagnosis_results').select('*').execute()
            profiles = supabase.table('profiles').select('*').execute()
            return {
                'total_diagnoses': len(diagnoses.data),
                'total_users': len(profiles.data),
                'diagnoses': diagnoses.data,
                'users': profiles.data
            }
        except Exception as e:
            print(f"Stats error: {e}")
    
    return {
        'total_diagnoses': len(memory_db['diagnosis_history']),
        'total_users': len(set(d['user_id'] for d in memory_db['diagnosis_history'])),
        'diagnoses': memory_db['diagnosis_history'],
        'users': []
    }

def calculate_trends(user_id):
    history = get_history(user_id, 100)
    if not history:
        return {'message': 'No history available', 'total_assessments': 0}
    
    risk_levels = [h.get('risk_level', 'unknown') for h in history]
    types = [h.get('diagnosis_type', 'unknown') for h in history]
    
    risk_scores = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
    values = [risk_scores.get(r, 0) for r in risk_levels]
    avg_risk = sum(values) / len(values) if values else 0
    
    # Trend calculation
    if len(values) >= 4:
        recent = sum(values[:len(values)//2]) / (len(values)//2)
        older = sum(values[len(values)//2:]) / (len(values) - len(values)//2)
        trend = "improving" if recent < older - 0.3 else "worsening" if recent > older + 0.3 else "stable"
    else:
        trend = "insufficient_data"
    
    return {
        'total_assessments': len(history),
        'risk_distribution': dict(Counter(risk_levels)),
        'diagnosis_types': dict(Counter(types)),
        'average_risk': round(avg_risk, 2),
        'health_trend': trend,
        'most_common': Counter(types).most_common(1)[0][0] if types else None,
        'last_assessment': history[0].get('created_at') if history else None,
        'chart_data': {
            'risk_values': values[:15],
            'risk_labels': risk_levels[:15]
        }
    }

# ==================================================
# API Routes - Admin
# ==================================================
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    if data.get('email') == ADMIN_EMAIL and data.get('password') == ADMIN_PASSWORD:
        token = generate_token()
        memory_db['admin_sessions'][token] = {
            'email': data['email'],
            'expires': datetime.now() + timedelta(hours=24)
        }
        return jsonify({'success': True, 'token': token, 'expires_in': 86400})
    return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

@app.route('/api/admin/logout', methods=['POST'])
@admin_required
def admin_logout():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    memory_db['admin_sessions'].pop(token, None)
    return jsonify({'success': True})

@app.route('/api/admin/verify', methods=['GET'])
@admin_required
def admin_verify():
    return jsonify({'success': True, 'admin_email': ADMIN_EMAIL})

@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def admin_stats():
    stats = get_all_stats()
    diagnoses = stats.get('diagnoses', [])
    
    risk_dist = Counter([d.get('risk_level', 'unknown') for d in diagnoses])
    type_dist = Counter([d.get('diagnosis_type', 'unknown') for d in diagnoses])
    
    today = datetime.now().date()
    today_count = sum(1 for d in diagnoses if d.get('created_at', '').startswith(str(today)))
    
    return jsonify({
        'total_users': stats['total_users'],
        'total_diagnoses': stats['total_diagnoses'],
        'today_diagnoses': today_count,
        'risk_distribution': dict(risk_dist),
        'diagnosis_types': dict(type_dist),
        'chart_data': {
            'risk_labels': list(risk_dist.keys()),
            'risk_values': list(risk_dist.values()),
            'type_labels': list(type_dist.keys()),
            'type_values': list(type_dist.values())
        }
    })

@app.route('/api/admin/users', methods=['GET'])
@admin_required
def admin_users():
    stats = get_all_stats()
    users = stats.get('users', [])
    diagnoses = stats.get('diagnoses', [])
    
    user_diags = {}
    for d in diagnoses:
        uid = d.get('user_id')
        if uid:
            user_diags.setdefault(uid, []).append(d)
    
    enhanced = []
    for u in users:
        uid = u.get('id')
        diags = user_diags.get(uid, [])
        enhanced.append({
            **u,
            'total_assessments': len(diags),
            'last_assessment': diags[0].get('created_at') if diags else None,
            'risk_summary': dict(Counter([d.get('risk_level') for d in diags]))
        })
    
    return jsonify({'users': enhanced})

@app.route('/api/admin/user/<user_id>/history', methods=['GET'])
@admin_required
def admin_user_history(user_id):
    return jsonify({
        'user_id': user_id,
        'history': get_history(user_id, 100),
        'trends': calculate_trends(user_id)
    })

# ==================================================
# API Routes - Symptom Analysis
# ==================================================
@app.route('/api/symptoms/analyze', methods=['POST'])
def analyze_symptoms():
    try:
        data = request.json
        symptoms = data.get('symptoms', [])
        patient_info = data.get('patient_info', {})
        user_id = data.get('user_id')
        
        if isinstance(symptoms, str):
            symptoms = [s.strip() for s in symptoms.split(',') if s.strip()]
        
        if not symptoms:
            return jsonify({'error': 'No symptoms provided'}), 400
        
        # Try Gemini first
        result = analyze_with_gemini(symptoms, patient_info) if GEMINI_AVAILABLE else None
        
        # Fallback to rule-based
        if not result:
            result = rule_based_analysis(symptoms, patient_info)
        
        result['symptoms_analyzed'] = symptoms
        result['timestamp'] = datetime.now().isoformat()
        
        if user_id:
            risk = result.get('risk_assessment', {}).get('overall_risk', 'unknown')
            save_to_db(user_id, 'symptoms', {'symptoms': symptoms, 'patient_info': patient_info}, result, risk)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/symptoms/history/<user_id>', methods=['GET'])
def symptom_history(user_id):
    history = get_history(user_id)
    return jsonify({'history': [h for h in history if h.get('diagnosis_type') == 'symptoms']})

# ==================================================
# SMART DIAGNOSIS ENDPOINT (NEW)
# ==================================================
@app.route('/api/smart-diagnosis', methods=['POST'])
def smart_diagnosis():
    """
    Enhanced symptom analysis with:
    1. Smart symptom weighting
    2. Probable disease calculation
    3. Gemini AI medicine & dosage
    """
    try:
        data = request.json
        symptoms = data.get('symptoms', [])
        patient_info = data.get('patient_info', {})
        user_id = data.get('user_id')
        
        # Validate input
        if isinstance(symptoms, str):
            symptoms = [s.strip() for s in symptoms.split(',') if s.strip()]
        
        if not symptoms:
            return jsonify({'error': 'No symptoms provided'}), 400
        
        # Get smart diagnosis with weighted analysis
        diagnosis_result = perform_smart_diagnosis(symptoms, patient_info)
        
        # Save to database
        if user_id:
            risk = diagnosis_result.get('risk_level', 'unknown')
            save_to_db(user_id, 'symptoms', {
                'symptoms': symptoms,
                'patient_info': patient_info,
                'analysis_type': 'smart_weighted'
            }, diagnosis_result, risk)
        
        return jsonify(diagnosis_result)
    
    except Exception as e:
        print(f"Smart diagnosis error: {e}")
        return jsonify({'error': str(e), 'type': type(e).__name__}), 500

# ==================================================
# HELPER FUNCTIONS FOR SMART DIAGNOSIS
# ==================================================

# Disease-Symptom Mapping with weights
DISEASE_SYMPTOM_WEIGHTS = {
    "heart disease": {
        "chest pain": 3,
        "shortness of breath": 3,
        "palpitations": 2,
        "dizziness": 2,
        "fatigue": 2,
        "sweating": 2,
        "numbness": 1
    },
    "hypertension": {
        "headache": 2,
        "dizziness": 2,
        "shortness of breath": 2,
        "chest pain": 2,
        "blurred vision": 2,
        "fatigue": 1
    },
    "pneumonia": {
        "cough": 3,
        "fever": 3,
        "shortness of breath": 3,
        "chest pain": 2,
        "fatigue": 2
    },
    "asthma": {
        "shortness of breath": 3,
        "cough": 3,
        "chest pain": 2,
        "wheezing": 3,
        "fatigue": 1
    },
    "bronchitis": {
        "cough": 3,
        "fatigue": 2,
        "shortness of breath": 2,
        "fever": 2,
        "chest pain": 2
    },
    "flu": {
        "fever": 3,
        "cough": 2,
        "fatigue": 2,
        "headache": 2,
        "muscle pain": 2,
        "sore throat": 2
    },
    "covid-19": {
        "fever": 3,
        "cough": 3,
        "fatigue": 2,
        "shortness of breath": 3,
        "headache": 2
    },
    "diabetes": {
        "frequent urination": 3,
        "increased thirst": 3,
        "fatigue": 2,
        "blurred vision": 2,
        "numbness": 2,
        "weight loss": 2
    },
    "gastritis": {
        "abdominal pain": 3,
        "nausea": 3,
        "vomiting": 2,
        "loss of appetite": 2,
        "bloating": 2
    },
    "thyroid disease": {
        "fatigue": 2,
        "weight gain": 2,
        "cold sensitivity": 2,
        "dry skin": 1,
        "depression": 1
    },
    "arthritis": {
        "joint pain": 3,
        "stiffness": 3,
        "swelling": 2,
        "redness": 2
    }
}

def calculate_disease_scores(symptoms):
    """
    Calculate disease scores based on symptom weights
    Returns top 3 diseases with scores and confidence
    """
    symptoms_lower = [s.lower().strip() for s in symptoms]
    scores = {}
    
    for disease, symptom_weights in DISEASE_SYMPTOM_WEIGHTS.items():
        score = 0
        matched = []
        
        for symptom_keyword, weight in symptom_weights.items():
            for user_symptom in symptoms_lower:
                if symptom_keyword in user_symptom or user_symptom in symptom_keyword:
                    score += weight
                    matched.append({'symptom': symptom_keyword, 'weight': weight})
                    break
        
        if score > 0:
            max_score = sum(symptom_weights.values())
            confidence = min(int((score / max_score) * 100), 95)
            scores[disease] = {
                'score': score,
                'confidence': confidence,
                'matched': matched,
                'max_score': max_score
            }
    
    # Sort by score
    sorted_diseases = sorted(scores.items(), key=lambda x: x[1]['score'], reverse=True)
    
    return {
        'top_diseases': [{'disease': d, **data} for d, data in sorted_diseases[:3]],
        'primary_disease': sorted_diseases[0][0] if sorted_diseases else None,
        'all_scores': scores
    }

def get_medicine_for_disease(disease, age=None, gender=None):
    """
    Get medicine recommendations for a disease
    Adjusted based on age and gender
    """
    medicine_database = {
        "heart disease": [
            {"name": "Aspirin", "dosage": "75-100mg daily", "purpose": "Blood thinner"},
            {"name": "Atorvastatin", "dosage": "10-40mg daily", "purpose": "Cholesterol"},
            {"name": "Lisinopril", "dosage": "10-20mg daily", "purpose": "Blood pressure"}
        ],
        "hypertension": [
            {"name": "Amlodipine", "dosage": "5-10mg daily", "purpose": "Blood pressure"},
            {"name": "Lisinopril", "dosage": "10-20mg daily", "purpose": "Blood pressure"},
            {"name": "Hydrochlorothiazide", "dosage": "12.5-25mg daily", "purpose": "Diuretic"}
        ],
        "diabetes": [
            {"name": "Metformin", "dosage": "500-1000mg twice daily", "purpose": "Blood sugar"},
            {"name": "Glimepiride", "dosage": "1-4mg daily", "purpose": "Blood sugar"}
        ],
        "flu": [
            {"name": "Paracetamol", "dosage": "500mg 3x daily", "purpose": "Fever/Pain"},
            {"name": "Oseltamivir", "dosage": "75mg twice daily", "purpose": "Antiviral"}
        ],
        "pneumonia": [
            {"name": "Amoxicillin", "dosage": "500mg 3x daily", "purpose": "Antibiotic"},
            {"name": "Azithromycin", "dosage": "500mg daily", "purpose": "Antibiotic"}
        ],
        "asthma": [
            {"name": "Albuterol", "dosage": "2 puffs as needed", "purpose": "Bronchodilator"},
            {"name": "Fluticasone", "dosage": "1-2 puffs daily", "purpose": "Inhaled steroid"}
        ]
    }
    
    return medicine_database.get(disease.lower(), [
        {"name": "Consult doctor", "dosage": "As prescribed", "purpose": "Professional diagnosis"}
    ])

def perform_smart_diagnosis(symptoms, patient_info):
    """
    Main smart diagnosis function combining:
    1. Weighted symptom scoring
    2. Disease calculation
    3. Medicine recommendations
    4. Gemini AI enhancement
    """
    # Step 1: Calculate probable diseases
    disease_analysis = calculate_disease_scores(symptoms)
    primary_disease = disease_analysis['primary_disease']
    
    if not primary_disease:
        return {
            'success': False,
            'message': 'Unable to determine disease from symptoms',
            'symptoms_count': len(symptoms)
        }
    
    # Step 2: Get medicine recommendations
    age = safe_int(patient_info.get('age', 0))
    gender = patient_info.get('gender', 'unknown')
    
    medicines = get_medicine_for_disease(primary_disease, age, gender)
    
    # Step 3: Try Gemini enhancement
    gemini_result = None
    if GEMINI_AVAILABLE:
        gemini_result = try_gemini_medicine_advice(symptoms, primary_disease, age, gender)
    
    # Combine results
    result = {
        'success': True,
        'primary_disease': primary_disease.title(),
        'confidence': disease_analysis['top_diseases'][0]['confidence'] if disease_analysis['top_diseases'] else 0,
        'symptoms_analyzed': symptoms,
        'symptom_analysis': {
            'total_reported': len(symptoms),
            'total_matched': len(disease_analysis['top_diseases'][0]['matched']) if disease_analysis['top_diseases'] else 0,
            'most_critical_symptom': disease_analysis['top_diseases'][0]['matched'][0]['symptom'].title() if disease_analysis['top_diseases'] and disease_analysis['top_diseases'][0]['matched'] else None,
            'weights_applied': True
        },
        'top_3_diseases': [
            {
                'disease': d['disease'].title(),
                'confidence': d['confidence'],
                'matched_symptoms': len(d['matched'])
            }
            for d in disease_analysis['top_diseases']
        ],
        'medicines': medicines if not gemini_result else gemini_result.get('medicines', medicines),
        'precautions': gemini_result.get('precautions') if gemini_result else get_disease_precautions(primary_disease),
        'risk_level': 'high' if disease_analysis['top_diseases'][0]['confidence'] > 70 else 'medium' if disease_analysis['top_diseases'][0]['confidence'] > 40 else 'low',
        'ai_provider': 'smart_weighted_gemini' if gemini_result else 'smart_weighted',
        'timestamp': datetime.now().isoformat()
    }
    
    return result

def try_gemini_medicine_advice(symptoms, disease, age, gender):
    """Try to get enhanced advice from Gemini API"""
    try:
        if not gemini_model:
            return None
        
        prompt = f"""Patient: {age}yr {gender}
Symptoms: {', '.join(symptoms)}
Disease: {disease}

Provide JSON:
{{
  "medicines": [
    {{"name": "...", "dosage": "...", "duration": "..."}}
  ],
  "precautions": [...]
}}"""
        
        response = gemini_model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean markdown if present
        if '```' in text:
            text = text.split('```')[1] if len(text.split('```')) > 1 else text
            text = text.replace('json', '').strip()
            
        import json
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
    except Exception as e:
        print(f"Gemini medicine advice error: {e}")
    
    return None

def get_disease_precautions(disease):
    """Get precautions for a disease"""
    precautions = {
        "heart disease": [
            "Avoid strenuous activities",
            "Monitor blood pressure regularly",
            "Follow salt-restricted diet",
            "Seek emergency help if chest pain continues"
        ],
        "diabetes": [
            "Monitor blood sugar regularly",
            "Maintain healthy diet",
            "Regular exercise (30 mins daily)",
            "Check feet daily for injuries"
        ],
        "flu": [
            "Rest adequately",
            "Stay hydrated",
            "Avoid contact with others",
            "Monitor fever"
        ],
        "pneumonia": [
            "Rest and avoid exertion",
            "Stay hydrated",
            "Use humidifier",
            "Elevate head while sleeping"
        ]
    }
    
    return precautions.get(disease.lower(), ["Consult healthcare professional"])

# ==================================================
@app.route('/api/diabetes', methods=['POST'])
def diabetes():
    data = request.json
    user_id = data.get('user_id')
    
    if not data.get('bmi'):
        w, h = safe_float(data.get('weight')), safe_float(data.get('height'))
        if w > 0 and h > 0:
            data['bmi'] = round(w / ((h/100)**2), 2)
    
    # Scoring
    score = 0
    if safe_int(data.get('age')) > 60: score += 3
    elif safe_int(data.get('age')) > 45: score += 2
    
    bmi = safe_float(data.get('bmi', 25))
    if bmi > 35: score += 4
    elif bmi > 30: score += 3
    elif bmi > 25: score += 2
    
    if str(data.get('family_history', '')).lower() == 'yes': score += 3
    if str(data.get('physical_activity', '')).lower() in ['sedentary', 'none']: score += 2
    
    for s in ['frequent_urination', 'excessive_thirst', 'tiredness', 'blurred_vision', 'slow_healing']:
        if str(data.get(s, '')).lower() == 'yes': score += 1
    
    prob = min((score / 20) * 100, 100)
    risk = 'high' if prob >= 55 else 'medium' if prob >= 30 else 'low'
    
    result = {
        'prediction': f"{risk.title()} Risk",
        'probability': round(prob, 1),
        'risk_level': risk,
        'bmi': bmi,
        'bmi_category': 'Underweight' if bmi < 18.5 else 'Normal' if bmi < 25 else 'Overweight' if bmi < 30 else 'Obese'
    }
    
    if user_id:
        save_to_db(user_id, 'diabetes', data, result, risk)
    
    return jsonify(result)

@app.route('/api/lung', methods=['POST'])
def lung():
    data = request.json
    user_id = data.get('user_id')
    
    score = 0
    if safe_int(data.get('age')) > 65: score += 3
    elif safe_int(data.get('age')) > 55: score += 2
    
    smoking = str(data.get('smoking', data.get('smokingHistory', ''))).lower()
    if smoking in ['current', 'yes']: score += 5
    elif smoking == 'former': score += 3
    
    if str(data.get('familyHistory', data.get('genetic_risk', ''))).lower() == 'yes': score += 3
    if str(data.get('chest_pain', data.get('chestPain', ''))).lower() in ['yes', 'frequent']: score += 2
    if str(data.get('weight_loss', data.get('weightLoss', ''))).lower() == 'yes': score += 2
    if str(data.get('shortness_of_breath', data.get('breathShortness', ''))).lower() in ['yes', 'rest']: score += 2
    
    prob = min((score / 20) * 100, 100)
    risk = 'high' if prob >= 50 else 'medium' if prob >= 25 else 'low'
    
    result = {'prediction': f"{risk.title()} Risk", 'probability': round(prob, 1), 'risk_level': risk}
    
    if user_id:
        save_to_db(user_id, 'lung', data, result, risk)
    
    return jsonify(result)

@app.route('/api/bp', methods=['POST'])
def bp():
    data = request.json
    user_id = data.get('user_id')
    
    sys, dia = safe_int(data.get('systolic', 120)), safe_int(data.get('diastolic', 80))
    
    if sys < 120 and dia < 80:
        cat, risk, prob = "Normal", "low", 10
    elif sys < 130 and dia < 80:
        cat, risk, prob = "Elevated", "medium", 35
    elif sys >= 180 or dia >= 120:
        cat, risk, prob = "Hypertensive Crisis", "critical", 95
    elif sys >= 140 or dia >= 90:
        cat, risk, prob = "Hypertension Stage 2", "high", 75
    else:
        cat, risk, prob = "Hypertension Stage 1", "medium", 55
    
    result = {'prediction': cat, 'probability': prob, 'risk_level': risk, 'systolic': sys, 'diastolic': dia}
    
    if user_id:
        save_to_db(user_id, 'bp', data, result, risk)
    
    return jsonify(result)

# ==================================================
# API Routes - User Data
# ==================================================
@app.route('/api/user/<user_id>/history', methods=['GET'])
def user_history(user_id):
    return jsonify({'history': get_history(user_id)})

@app.route('/api/user/<user_id>/trends', methods=['GET'])
def user_trends(user_id):
    return jsonify(calculate_trends(user_id))

# ==================================================
# API Routes - Common Conditions Analysis
# ==================================================
def extract_conditions_from_diagnosis(diagnosis_result):
    """Extract condition names from diagnosis result data."""
    conditions = []
    
    if isinstance(diagnosis_result, dict):
        # Extract from primary_conditions
        if 'primary_conditions' in diagnosis_result:
            for cond in diagnosis_result['primary_conditions']:
                if isinstance(cond, dict):
                    conditions.append(cond.get('name', ''))
                else:
                    conditions.append(str(cond))
        
        # Extract from result_data if it contains condition info
        if 'result_data' in diagnosis_result:
            result_data = diagnosis_result['result_data']
            if isinstance(result_data, str):
                try:
                    result_data = json.loads(result_data)
                except:
                    pass
            
            if isinstance(result_data, dict):
                if 'primary_conditions' in result_data:
                    for cond in result_data['primary_conditions']:
                        if isinstance(cond, dict):
                            conditions.append(cond.get('name', ''))
                        else:
                            conditions.append(str(cond))
                
                # For specific diagnosis types
                if 'prediction' in result_data:
                    conditions.append(result_data['prediction'])
                if 'name' in result_data:
                    conditions.append(result_data['name'])
    
    # Filter out empty strings
    return [c.strip() for c in conditions if c and c.strip()]

def analyze_common_conditions(limit=10, diagnosis_type=None):
    """Analyze most common conditions from all user data."""
    stats = get_all_stats()
    diagnoses = stats.get('diagnoses', [])
    
    if not diagnoses:
        return {
            'success': False,
            'message': 'No diagnosis data available',
            'data': {
                'most_common': [],
                'total_conditions_tracked': 0,
                'conditions_count': 0,
                'data_points': 0
            }
        }
    
    # Filter by diagnosis type if specified
    if diagnosis_type:
        diagnoses = [d for d in diagnoses if d.get('diagnosis_type') == diagnosis_type]
    
    all_conditions = []
    
    # Extract conditions from each diagnosis
    for diagnosis in diagnoses:
        # Get from result_data
        result_data = diagnosis.get('result_data')
        if result_data:
            if isinstance(result_data, str):
                try:
                    result_data = json.loads(result_data)
                except:
                    result_data = {}
            
            conditions = extract_conditions_from_diagnosis({'result_data': result_data})
            all_conditions.extend(conditions)
        
        # Also try to get from diagnosis_type specific fields
        diagnosis_type_val = diagnosis.get('diagnosis_type', '')
        if diagnosis_type_val == 'diabetes':
            all_conditions.append('Diabetes Risk Assessment')
        elif diagnosis_type_val == 'lung':
            all_conditions.append('Lung Disease Risk')
        elif diagnosis_type_val == 'bp':
            all_conditions.append('Blood Pressure Assessment')
    
    # Count conditions
    condition_counts = Counter(all_conditions)
    
    if not condition_counts:
        return {
            'success': False,
            'message': 'Could not extract conditions from diagnosis data',
            'data': {
                'most_common': [],
                'total_conditions_tracked': 0,
                'conditions_count': 0,
                'data_points': len(diagnoses)
            }
        }
    
    # Get top conditions
    most_common = condition_counts.most_common(limit)
    total_conditions = sum(condition_counts.values())
    
    # Format response
    conditions_data = []
    for condition, count in most_common:
        percentage = round((count / total_conditions) * 100, 2)
        conditions_data.append({
            'condition': condition,
            'count': count,
            'percentage': percentage,
            'prevalence': 'High' if percentage > 20 else 'Medium' if percentage > 10 else 'Low'
        })
    
    return {
        'success': True,
        'data': {
            'most_common': conditions_data,
            'total_conditions_tracked': len(condition_counts),
            'conditions_count': len(condition_counts),
            'data_points': len(diagnoses),
            'summary': {
                'total_diagnoses': len(diagnoses),
                'unique_conditions': len(condition_counts),
                'top_condition': most_common[0][0] if most_common else None,
                'top_condition_count': most_common[0][1] if most_common else 0
            }
        }
    }

@app.route('/api/admin/common-conditions', methods=['GET'])
@admin_required
def get_common_conditions():
    """Get the most common conditions from all users."""
    limit = request.args.get('limit', 10, type=int)
    diagnosis_type = request.args.get('type', None)
    
    result = analyze_common_conditions(limit, diagnosis_type)
    return jsonify(result)

@app.route('/api/admin/condition-trends', methods=['GET'])
@admin_required
def get_condition_trends():
    """Get condition trends over time."""
    stats = get_all_stats()
    diagnoses = stats.get('diagnoses', [])
    
    if not diagnoses:
        return jsonify({
            'success': False,
            'message': 'No diagnosis data available',
            'trends': []
        })
    
    # Group by date and count
    trends_by_date = {}
    all_conditions = Counter()
    
    for diagnosis in diagnoses:
        created_at = diagnosis.get('created_at', '')
        date = created_at.split('T')[0] if created_at else 'unknown'
        
        # Extract conditions
        result_data = diagnosis.get('result_data')
        if result_data:
            if isinstance(result_data, str):
                try:
                    result_data = json.loads(result_data)
                except:
                    result_data = {}
            
            conditions = extract_conditions_from_diagnosis({'result_data': result_data})
            all_conditions.update(conditions)
            
            if date not in trends_by_date:
                trends_by_date[date] = Counter()
            trends_by_date[date].update(conditions)
    
    # Get top 5 conditions
    top_conditions = [c[0] for c in all_conditions.most_common(5)]
    
    # Format trend data
    trend_data = []
    for condition in top_conditions:
        trend_points = []
        for date in sorted(trends_by_date.keys()):
            count = trends_by_date[date].get(condition, 0)
            if count > 0 or trend_points:  # Include if it has any count or already started
                trend_points.append({
                    'date': date,
                    'count': count
                })
        
        if trend_points:
            trend_data.append({
                'condition': condition,
                'trend': trend_points,
                'total': sum(p['count'] for p in trend_points)
            })
    
    return jsonify({
        'success': True,
        'trends': trend_data,
        'total_conditions': len(all_conditions),
        'top_conditions': top_conditions
    })

@app.route('/api/admin/risk-analysis', methods=['GET'])
@admin_required
def get_risk_analysis():
    """Analyze risk distribution across most common conditions."""
    stats = get_all_stats()
    diagnoses = stats.get('diagnoses', [])
    
    if not diagnoses:
        return jsonify({
            'success': False,
            'message': 'No diagnosis data available',
            'risk_by_condition': []
        })
    
    # Map conditions to risk levels
    condition_risks = {}
    
    for diagnosis in diagnoses:
        risk_level = diagnosis.get('risk_level', 'unknown')
        result_data = diagnosis.get('result_data')
        
        if result_data:
            if isinstance(result_data, str):
                try:
                    result_data = json.loads(result_data)
                except:
                    result_data = {}
            
            conditions = extract_conditions_from_diagnosis({'result_data': result_data})
            
            for condition in conditions:
                if condition not in condition_risks:
                    condition_risks[condition] = {
                        'low': 0,
                        'medium': 0,
                        'high': 0,
                        'critical': 0,
                        'total': 0
                    }
                
                if risk_level in condition_risks[condition]:
                    condition_risks[condition][risk_level] += 1
                condition_risks[condition]['total'] += 1
    
    # Format response - get top conditions by frequency
    top_conditions = sorted(condition_risks.items(), key=lambda x: x[1]['total'], reverse=True)[:10]
    
    risk_analysis = []
    for condition, risks in top_conditions:
        total = risks['total']
        risk_analysis.append({
            'condition': condition,
            'risk_distribution': {
                'low': round((risks['low'] / total) * 100, 2) if total > 0 else 0,
                'medium': round((risks['medium'] / total) * 100, 2) if total > 0 else 0,
                'high': round((risks['high'] / total) * 100, 2) if total > 0 else 0,
                'critical': round((risks['critical'] / total) * 100, 2) if total > 0 else 0
            },
            'total_cases': total,
            'average_risk': 'High' if risks['high'] + risks['critical'] > total/2 else 'Medium' if risks['medium'] > total/4 else 'Low'
        })
    
    return jsonify({
        'success': True,
        'risk_by_condition': risk_analysis,
        'total_conditions_analyzed': len(condition_risks)
    })

# ==================================================
# AI Inventory Agent - Gemini-powered demand analysis
# ==================================================
@app.route('/api/admin/ai-agent/run', methods=['POST'])
@admin_required
def run_ai_inventory_agent():
    """AI Agent that analyzes disease trends and recommends inventory actions."""
    try:
        # Step 1: Gather diagnosis data
        stats = get_all_stats()
        diagnoses = stats.get('diagnoses', [])
        
        # Step 2: Analyze disease prevalence
        condition_counts = Counter()
        risk_counts = Counter()
        recent_conditions = Counter()
        
        now = datetime.now()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)
        
        for diagnosis in diagnoses:
            risk_level = diagnosis.get('risk_level', 'unknown')
            risk_counts[risk_level] += 1
            
            result_data = diagnosis.get('result_data')
            if result_data:
                if isinstance(result_data, str):
                    try:
                        result_data = json.loads(result_data)
                    except:
                        result_data = {}
                
                conditions = extract_conditions_from_diagnosis({'result_data': result_data})
                condition_counts.update(conditions)
                
                # Check if recent
                created_at = diagnosis.get('created_at', '')
                if created_at:
                    try:
                        diag_date = datetime.fromisoformat(created_at.replace('Z', '+00:00').replace('+00:00', ''))
                    except:
                        try:
                            diag_date = datetime.strptime(created_at[:19], '%Y-%m-%dT%H:%M:%S')
                        except:
                            diag_date = None
                    
                    if diag_date and diag_date > thirty_days_ago.replace(tzinfo=None):
                        recent_conditions.update(conditions)
        
        # Step 3: Build context for Gemini
        top_conditions = condition_counts.most_common(10)
        recent_top = recent_conditions.most_common(5)
        
        disease_summary = ""
        for condition, count in top_conditions:
            recent_count = recent_conditions.get(condition, 0)
            trend = "RISING" if recent_count > count * 0.5 else "STABLE" if recent_count > 0 else "DECLINING"
            disease_summary += f"- {condition}: {count} total cases, {recent_count} in last 30 days ({trend})\n"
        
        risk_summary = f"""
Risk Distribution:
- Low: {risk_counts.get('low', 0)} cases
- Medium: {risk_counts.get('medium', 0)} cases  
- High: {risk_counts.get('high', 0)} cases
- Critical: {risk_counts.get('critical', 0)} cases
"""
        
        # Step 4: Get current inventory from request (sent by frontend)
        data = request.json or {}
        current_inventory = data.get('inventory', [])
        
        inventory_summary = "Current Inventory:\n"
        if current_inventory:
            for item in current_inventory[:20]:
                inventory_summary += f"- {item.get('name', 'Unknown')}: {item.get('stock', 0)} units, Category: {item.get('category', 'N/A')}\n"
        else:
            inventory_summary += "- No inventory data provided\n"
        
        # Step 5: Call Gemini for intelligent recommendations
        if GEMINI_API_KEY and GEMINI_API_KEY != 'your_gemini_api_key_here':
            import urllib.request
            import urllib.error
            
            prompt = f"""You are an AI medical inventory management agent for MedAI hospital platform.

DISEASE TRENDS (from {len(diagnoses)} total diagnoses):
{disease_summary}

{risk_summary}

{inventory_summary}

Based on these disease trends and risk patterns, provide inventory management recommendations.

Respond ONLY with valid JSON (no markdown, no code blocks):
{{
    "recommendations": [
        {{
            "medicine": "Medicine name",
            "action": "REORDER|INCREASE_STOCK|REDUCE|MONITOR",
            "urgency": "HIGH|MEDIUM|LOW",
            "suggested_quantity": 100,
            "reason": "Brief reason based on disease trends",
            "related_conditions": ["condition1", "condition2"]
        }}
    ],
    "insights": [
        "Insight about disease trends and inventory impact"
    ],
    "risk_alert": "Summary of any concerning trends requiring immediate attention",
    "seasonal_note": "Any seasonal patterns observed",
    "overall_status": "HEALTHY|NEEDS_ATTENTION|CRITICAL"
}}

Generate 5-8 medicine recommendations based on the actual disease data. Map diseases to their most common treatments:
- Diabetes -> Metformin, Insulin, Glipizide, Blood glucose strips
- Hypertension/High BP -> Amlodipine, Losartan, Lisinopril
- Flu/Cold -> Paracetamol, Ibuprofen, Cetirizine
- Infections -> Amoxicillin, Azithromycin
- Heart conditions -> Aspirin, Atorvastatin, Clopidogrel
- Lung conditions -> Salbutamol inhaler, Montelukast
- Anxiety/Depression -> As needed with doctor supervision
- General -> First aid supplies, PPE, Thermometers"""

            request_body = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.3,
                    "maxOutputTokens": 1200,
                    "topP": 0.8
                }
            }
            
            models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite']
            ai_result = None
            
            for model_name in models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
                try:
                    req = urllib.request.Request(
                        url,
                        data=json.dumps(request_body).encode('utf-8'),
                        headers={'Content-Type': 'application/json'},
                        method='POST'
                    )
                    with urllib.request.urlopen(req, timeout=30) as resp:
                        resp_data = json.loads(resp.read().decode('utf-8'))
                    
                    text = resp_data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                    
                    if text:
                        # Clean markdown if present
                        if '```' in text:
                            parts = text.split('```')
                            text = parts[1] if len(parts) > 1 else text
                            text = text.replace('json', '').strip()
                        
                        ai_result = json.loads(text)
                        ai_result['ai_model'] = model_name
                        break
                except Exception as e:
                    print(f"AI Agent Gemini error ({model_name}): {e}")
                    continue
            
            if ai_result:
                return jsonify({
                    'success': True,
                    'agent_type': 'gemini_ai',
                    'total_diagnoses_analyzed': len(diagnoses),
                    'top_conditions': [{'name': c, 'count': n} for c, n in top_conditions[:5]],
                    'risk_distribution': dict(risk_counts),
                    **ai_result,
                    'timestamp': datetime.now().isoformat()
                })
        
        # Fallback: Rule-based recommendations if Gemini unavailable
        recommendations = []
        condition_medicine_map = {
            'diabetes': [('Metformin 500mg', 'medicines'), ('Blood Glucose Strips', 'supplies'), ('Insulin Pens', 'medicines')],
            'hypertension': [('Amlodipine 5mg', 'medicines'), ('Losartan 50mg', 'medicines'), ('BP Monitor', 'equipment')],
            'flu': [('Paracetamol 500mg', 'medicines'), ('Cetirizine 10mg', 'medicines')],
            'cold': [('Paracetamol 500mg', 'medicines'), ('Cetirizine 10mg', 'medicines')],
            'infection': [('Amoxicillin 500mg', 'medicines'), ('Azithromycin 250mg', 'medicines')],
            'asthma': [('Salbutamol Inhaler', 'medicines'), ('Montelukast 10mg', 'medicines')],
            'heart disease': [('Aspirin 75mg', 'medicines'), ('Atorvastatin 10mg', 'medicines')],
            'covid-19': [('Paracetamol 500mg', 'medicines'), ('Pulse Oximeter', 'equipment'), ('N95 Masks', 'supplies')],
        }
        
        seen_medicines = set()
        for condition, count in top_conditions[:5]:
            cond_lower = condition.lower()
            for key, medicines in condition_medicine_map.items():
                if key in cond_lower:
                    for med_name, med_category in medicines:
                        if med_name not in seen_medicines:
                            seen_medicines.add(med_name)
                            urgency = 'HIGH' if count > 5 or risk_counts.get('high', 0) > 3 else 'MEDIUM' if count > 2 else 'LOW'
                            recommendations.append({
                                'medicine': med_name,
                                'action': 'REORDER' if count > 3 else 'MONITOR',
                                'urgency': urgency,
                                'suggested_quantity': max(20, count * 10),
                                'reason': f'{count} cases of {condition} detected - stock {med_name}',
                                'related_conditions': [condition],
                                'category': med_category
                            })
        
        # Add general supplies
        if risk_counts.get('high', 0) + risk_counts.get('critical', 0) > 2:
            recommendations.append({
                'medicine': 'Emergency First Aid Kit',
                'action': 'INCREASE_STOCK',
                'urgency': 'HIGH',
                'suggested_quantity': 10,
                'reason': f"{risk_counts.get('high', 0) + risk_counts.get('critical', 0)} high/critical risk cases detected",
                'related_conditions': ['emergency preparedness'],
                'category': 'first-aid'
            })
        
        overall = 'CRITICAL' if risk_counts.get('critical', 0) > 2 else 'NEEDS_ATTENTION' if risk_counts.get('high', 0) > 3 else 'HEALTHY'
        
        return jsonify({
            'success': True,
            'agent_type': 'rule_based',
            'total_diagnoses_analyzed': len(diagnoses),
            'top_conditions': [{'name': c, 'count': n} for c, n in top_conditions[:5]],
            'risk_distribution': dict(risk_counts),
            'recommendations': recommendations,
            'insights': [
                f"Analyzed {len(diagnoses)} total diagnoses across {len(condition_counts)} conditions",
                f"Top condition: {top_conditions[0][0] if top_conditions else 'N/A'} with {top_conditions[0][1] if top_conditions else 0} cases",
                f"High/Critical risk cases: {risk_counts.get('high', 0) + risk_counts.get('critical', 0)}",
                f"Recent trend: {len(recent_conditions)} conditions seen in last 30 days"
            ],
            'risk_alert': f"{'ALERT: ' + str(risk_counts.get('critical', 0)) + ' critical cases detected!' if risk_counts.get('critical', 0) > 0 else 'No critical alerts'}",
            'seasonal_note': 'Monitor flu and respiratory conditions during season changes',
            'overall_status': overall,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"AI Agent error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================================================
# Health Check
# ==================================================
@app.route('/')
def home():
    return jsonify({
        'service': 'MedAI Backend API',
        'version': '2.0.0',
        'status': 'running',
        'features': {'gemini_ai': GEMINI_AVAILABLE, 'supabase': SUPABASE_AVAILABLE}
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'gemini': GEMINI_AVAILABLE,
        'supabase': SUPABASE_AVAILABLE,
        'admin_email': ADMIN_EMAIL
    })

# ==================================================
# API Routes - Chat Proxy (Gemini via .env key)
# ==================================================
@app.route('/api/chat', methods=['POST'])
def chat_proxy():
    """Proxy chatbot requests to Gemini API using server-side API key from .env"""
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        if not GEMINI_API_KEY or GEMINI_API_KEY == 'your_gemini_api_key_here':
            return jsonify({'error': 'Gemini API key not configured on server'}), 503
        
        system_prompt = """You are MedAI Assistant, an AI-powered health chatbot embedded in the MedAI medical diagnosis platform.

About MedAI:
- MedAI is an AI-powered medical diagnosis and inventory management platform
- It offers health assessments for diabetes, lung cancer, and blood pressure
- It uses machine learning models with 94% accuracy
- It has a medicine inventory management system with automated reordering
- Built with HTML/CSS/JS frontend, Python Flask backend, Supabase database, and Google Gemini AI
- Users can navigate the platform using voice commands

Your role:
- Answer health and medical questions accurately and helpfully
- Provide general medical information, symptoms, prevention tips, and wellness advice
- Recommend users to consult a real doctor for serious conditions
- When asked about MedAI, describe the platform's features and capabilities
- Keep responses concise (under 200 words) and use bullet points where helpful
- Use relevant emojis to make responses friendly
- Always add a disclaimer for medical advice: "Please consult a healthcare professional for personalized medical advice."
- NEVER diagnose or prescribe specific medications for individual cases
- For emergencies, direct users to call emergency services (911/112/108)"""

        request_body = {
            "contents": [{
                "parts": [
                    {"text": system_prompt + "\n\nUser question: " + user_message}
                ]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 500,
                "topP": 0.9
            },
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"}
            ]
        }
        
        import urllib.request
        import urllib.error
        
        models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite']
        last_error = None
        
        for model_name in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
            
            for attempt in range(2):
                try:
                    req = urllib.request.Request(
                        url,
                        data=json.dumps(request_body).encode('utf-8'),
                        headers={'Content-Type': 'application/json'},
                        method='POST'
                    )
                    
                    with urllib.request.urlopen(req, timeout=30) as resp:
                        resp_data = json.loads(resp.read().decode('utf-8'))
                        
                    reply = resp_data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                    
                    if reply:
                        return jsonify({'reply': reply, 'model': model_name})
                        
                except urllib.error.HTTPError as e:
                    last_error = f"HTTP {e.code}"
                    if e.code == 429:
                        import time
                        time.sleep(2 * (attempt + 1))
                        continue
                except Exception as e:
                    last_error = str(e)
                    continue
        
        return jsonify({'error': f'All models failed: {last_error}'}), 502
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================================================
# Run
# ==================================================
if __name__ == '__main__':
    print("\n" + "="*60)
    print("   MedAI Backend Server v2.0")
    print("="*60)
    print(f"\nAdmin: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    print(f"Gemini AI: {'Ready' if GEMINI_AVAILABLE else 'Not configured'}")
    print(f"Supabase: {'Connected' if SUPABASE_AVAILABLE else 'Using memory storage'}")
    print(f"\nServer: http://localhost:5000")
    print("\nKey Endpoints:")
    print("   POST /api/admin/login")
    print("   POST /api/symptoms/analyze")
    print("   POST /api/chat")
    print("   GET  /api/user/<id>/trends")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
