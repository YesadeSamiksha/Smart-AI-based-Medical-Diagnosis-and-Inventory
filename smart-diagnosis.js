/**
 * SMART MEDICAL DIAGNOSIS SYSTEM
 * 
 * Features:
 * 1. Symptom Weighting - Each symptom has clinical significance weight
 * 2. Disease Calculation - Score-based probable disease calculation
 * 3. Gemini AI Integration - Medicine, dosage, and precautions
 */

// =====================================================
// STEP 1: DISEASE-SYMPTOM MAPPING WITH WEIGHTS
// =====================================================
// Weights represent clinical significance (1-3 scale)
// 3 = Critical/Definitive | 2 = Important | 1 = Supporting

const DISEASE_SYMPTOM_MAP = {
    // CARDIOVASCULAR DISEASES
    "Heart Disease": {
        "chest pain": 3,
        "shortness of breath": 3,
        "palpitations": 2,
        "dizziness": 2,
        "fatigue": 2,
        "sweating": 2,
        "numbness": 1,
        "nausea": 1
    },
    
    "Hypertension": {
        "headache": 2,
        "dizziness": 2,
        "fatigue": 1,
        "shortness of breath": 2,
        "chest pain": 2,
        "nausea": 1,
        "blurred vision": 2
    },
    
    // RESPIRATORY DISEASES
    "Pneumonia": {
        "cough": 3,
        "fever": 3,
        "shortness of breath": 3,
        "chest pain": 2,
        "fatigue": 2,
        "nausea": 1,
        "headache": 1
    },
    
    "Asthma": {
        "shortness of breath": 3,
        "cough": 3,
        "chest pain": 2,
        "wheezing": 3,
        "fatigue": 1
    },
    
    "Bronchitis": {
        "cough": 3,
        "fatigue": 2,
        "shortness of breath": 2,
        "fever": 2,
        "chest pain": 2,
        "headache": 1
    },
    
    // INFECTIOUS DISEASES
    "Flu": {
        "fever": 3,
        "cough": 2,
        "fatigue": 2,
        "headache": 2,
        "muscle pain": 2,
        "sore throat": 2,
        "runny nose": 1,
        "nausea": 1
    },
    
    "COVID-19": {
        "fever": 3,
        "cough": 3,
        "fatigue": 2,
        "shortness of breath": 3,
        "headache": 2,
        "loss of taste": 3,
        "loss of smell": 3,
        "muscle pain": 2
    },
    
    "Common Cold": {
        "runny nose": 3,
        "cough": 2,
        "sore throat": 2,
        "headache": 1,
        "fatigue": 1,
        "sneezing": 3
    },
    
    "Strep Throat": {
        "sore throat": 3,
        "fever": 3,
        "headache": 2,
        "fatigue": 1,
        "swollen lymph nodes": 2
    },
    
    // METABOLIC DISEASES
    "Diabetes": {
        "frequent urination": 3,
        "increased thirst": 3,
        "fatigue": 2,
        "blurred vision": 2,
        "numbness": 2,
        "weight loss": 2,
        "slow healing": 2,
        "irritability": 1
    },
    
    "Thyroid Disease": {
        "fatigue": 2,
        "weight gain": 2,
        "cold sensitivity": 2,
        "dry skin": 1,
        "constipation": 1,
        "hair loss": 1,
        "depression": 1
    },
    
    // GASTROINTESTINAL DISEASES
    "Gastritis": {
        "abdominal pain": 3,
        "nausea": 3,
        "vomiting": 2,
        "loss of appetite": 2,
        "bloating": 2,
        "indigestion": 2,
        "dark stools": 2
    },
    
    "Food Poisoning": {
        "nausea": 3,
        "vomiting": 3,
        "abdominal pain": 3,
        "diarrhea": 3,
        "fever": 2,
        "headache": 1
    },
    
    "Appendicitis": {
        "abdominal pain": 3,
        "fever": 3,
        "nausea": 3,
        "vomiting": 2,
        "loss of appetite": 2,
        "constipation": 1
    },
    
    // NEUROLOGICAL
    "Migraine": {
        "severe headache": 3,
        "nausea": 2,
        "vomiting": 2,
        "sensitivity to light": 2,
        "dizziness": 1
    },
    
    "Diabetes Neuropathy": {
        "numbness": 3,
        "tingling": 3,
        "burning sensation": 2,
        "muscle weakness": 2,
        "foot pain": 2
    },
    
    // JOINT & BONE
    "Arthritis": {
        "joint pain": 3,
        "stiffness": 3,
        "swelling": 2,
        "redness": 2,
        "reduced mobility": 2,
        "fatigue": 1
    },
    
    // ALLERGIC CONDITIONS
    "Allergy": {
        "itching": 2,
        "skin rash": 3,
        "runny nose": 2,
        "sneezing": 2,
        "watery eyes": 2,
        "swelling": 2
    },
    
    // SKIN CONDITIONS
    "Eczema": {
        "skin rash": 3,
        "itching": 3,
        "dry skin": 2,
        "redness": 2,
        "cracked skin": 2
    },
    
    // ANXIETY & DEPRESSION
    "Anxiety": {
        "palpitations": 2,
        "chest pain": 2,
        "shortness of breath": 2,
        "dizziness": 2,
        "sweating": 2,
        "trembling": 2
    },
    
    "Depression": {
        "fatigue": 3,
        "sleep disorders": 3,
        "loss of appetite": 2,
        "weight loss": 2,
        "concentration loss": 2,
        "sadness": 3
    }
};

// SYMPTOM SEVERITY WEIGHTS (independent of disease)
const SYMPTOM_SEVERITY = {
    "chest pain": 3,
    "shortness of breath": 3,
    "severe headache": 3,
    "loss of consciousness": 3,
    "coughing blood": 3,
    "loss of taste": 3,
    "loss of smell": 3,
    "numbness": 3,
    
    "fever": 2,
    "cough": 2,
    "vomiting": 2,
    "abdominal pain": 2,
    "palpitations": 2,
    "shortness of breath": 2,
    
    "fatigue": 1,
    "headache": 1,
    "runny nose": 1,
    "cough": 1
};

// =====================================================
// STEP 2: DISEASE CALCULATION ENGINE
// =====================================================

/**
 * Calculate most probable diseases based on user symptoms
 * Returns: { topDiseases: [], confidence: %, mostCriticalSymptom: "" }
 */
function calculateMostProbableDisease(userSymptoms) {
    if (!userSymptoms || userSymptoms.length === 0) {
        return {
            topDiseases: [],
            scores: {},
            confidence: 0,
            mostCriticalSymptom: null,
            message: "No symptoms provided"
        };
    }
    
    // Normalize symptoms to lowercase
    const normalizedSymptoms = userSymptoms.map(s => 
        s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '')
    );
    
    const scores = {};
    const matchedSymptomsByDisease = {};
    
    // Score each disease based on symptom matches
    for (const [disease, symptomWeights] of Object.entries(DISEASE_SYMPTOM_MAP)) {
        let diseaseScore = 0;
        let matchedCount = 0;
        const matched = [];
        
        // Check each symptom weight for this disease
        for (const [symptom, weight] of Object.entries(symptomWeights)) {
            const normalizedSymptom = symptom.toLowerCase().replace(/[^a-z0-9\s]/g, '');
            
            // Check if user has this symptom
            if (normalizedSymptoms.some(userSym => 
                userSym.includes(normalizedSymptom) || 
                normalizedSymptom.includes(userSym)
            )) {
                diseaseScore += weight;
                matchedCount++;
                matched.push({symptom, weight});
            }
        }
        
        // Store results
        if (diseaseScore > 0) {
            scores[disease] = {
                totalScore: diseaseScore,
                matchedCount: matchedCount,
                matchedSymptoms: matched,
                maxPossibleScore: Object.values(symptomWeights).reduce((a, b) => a + b, 0)
            };
        }
    }
    
    // Sort by score and get top 3
    const sortedDiseases = Object.entries(scores)
        .sort((a, b) => b[1].totalScore - a[1].totalScore)
        .slice(0, 3)
        .map(([disease, data]) => {
            // Calculate confidence as percentage of max possible score
            const maxScore = data.maxPossibleScore;
            const confidence = Math.min(Math.round((data.totalScore / maxScore) * 100), 95);
            
            return {
                disease,
                score: data.totalScore,
                confidence,
                matchedSymptoms: data.matchedSymptoms,
                matchedCount: data.matchedCount
            };
        });
    
    // Find most critical symptom
    const symptomCriticalityMap = {};
    for (const symptom of normalizedSymptoms) {
        for (const [diseaseName, symptoms] of Object.entries(DISEASE_SYMPTOM_MAP)) {
            for (const [symptomKey, weight] of Object.entries(symptoms)) {
                const norm = symptomKey.toLowerCase().replace(/[^a-z0-9\s]/g, '');
                if (norm === symptom) {
                    const originalKey = symptomKey;
                    if (!symptomCriticalityMap[originalKey]) {
                        symptomCriticalityMap[originalKey] = 0;
                    }
                    symptomCriticalityMap[originalKey] += weight;
                }
            }
        }
    }
    
    const mostCritical = Object.entries(symptomCriticalityMap)
        .sort((a, b) => b[1] - a[1])[0];
    
    return {
        topDiseases: sortedDiseases,
        scores,
        confidence: sortedDiseases.length > 0 ? sortedDiseases[0].confidence : 0,
        primaryDisease: sortedDiseases.length > 0 ? sortedDiseases[0].disease : null,
        mostCriticalSymptom: mostCritical ? {
            symptom: mostCritical[0],
            criticality: mostCritical[1]
        } : null,
        totalSymptomsReported: userSymptoms.length,
        matchedSymptomsCount: Object.keys(scores).length
    };
}

// =====================================================
// STEP 3: GEMINI AI INTEGRATION FOR MEDICINE
// =====================================================

/**
 * Get AI-powered medical advice including medicines and dosage
 * Uses Gemini API to generate comprehensive medical guidance
 */
async function getMedicalAdviceFromGemini(patientData) {
    const {
        age,
        gender,
        symptoms,
        disease,
        medicalHistory = []
    } = patientData;
    
    if (!window.GEMINI_API_KEY) {
        console.warn('Gemini API key not configured');
        return getDefaultMedicalAdvice(disease);
    }
    
    const prompt = `
You are an expert medical AI assistant. Provide detailed medical guidance.

PATIENT INFORMATION:
- Age: ${age} years
- Gender: ${gender}
- Medical History: ${medicalHistory.length > 0 ? medicalHistory.join(", ") : "None reported"}

SYMPTOMS REPORTED:
${symptoms.map(s => `• ${s}`).join('\n')}

PRELIMINARY DIAGNOSIS:
${disease}

REQUIRED OUTPUT FORMAT (MUST BE VALID JSON):
{
  "disease": "Disease name",
  "diseaseExplanation": "Brief explanation of the diagnosis (2-3 sentences)",
  "medicines": [
    {
      "name": "Generic medicine name",
      "dosage": "Dose with unit (e.g., 500mg)",
      "frequency": "How often (e.g., twice daily)",
      "duration": "Length of treatment (e.g., 7 days)",
      "purpose": "What it treats"
    }
  ],
  "precautions": [
    "Precaution 1",
    "Precaution 2"
  ],
  "lifestyle": [
    "Lifestyle recommendation 1",
    "Lifestyle recommendation 2"
  ],
  "warning": "When to seek immediate medical help",
  "followUp": "When to follow up with doctor"
}

IMPORTANT:
1. Adjust dosages based on age: children < 12 need lower doses
2. Consider gender for specific medications
3. Medicines must be GENERIC names only
4. Be specific with dosages
5. Include common OTC and prescription options
6. Return ONLY valid JSON, no additional text`;

    try {
        // Use Google's Generative AI SDK
        if (!window.genai) {
            console.warn('Google Generative AI not available');
            return getDefaultMedicalAdvice(disease);
        }
        
        const model = window.genai.getGenerativeModel({name: "gemini-pro"});
        
        const response = await model.generateContent(prompt);
        const result = await response.response;
        const text = result.text();
        
        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const advice = JSON.parse(jsonMatch[0]);
            return {
                ...advice,
                source: "gemini_ai",
                timestamp: new Date().toISOString()
            };
        }
    } catch (error) {
        console.warn('Gemini API error:', error);
    }
    
    return getDefaultMedicalAdvice(disease);
}

/**
 * Fallback medical advice when Gemini is unavailable
 */
function getDefaultMedicalAdvice(disease) {
    const medicineDatabase = {
        "Heart Disease": {
            disease: "Heart Disease",
            diseaseExplanation: "Cardiovascular disease affecting heart function and blood flow. Immediate medical consultation recommended.",
            medicines: [
                {
                    name: "Aspirin",
                    dosage: "75-100mg",
                    frequency: "Once daily",
                    duration: "As prescribed",
                    purpose: "Blood thinner"
                },
                {
                    name: "Atorvastatin",
                    dosage: "10-40mg",
                    frequency: "Once daily",
                    duration: "Ongoing",
                    purpose: "Cholesterol management"
                }
            ],
            precautions: [
                "Seek emergency help if chest pain continues",
                "Avoid strenuous activities",
                "Monitor blood pressure regularly",
                "Follow salt-restricted diet"
            ],
            warning: "SEEK EMERGENCY HELP if experiencing severe chest pain, fainting, or severe shortness of breath",
            followUp: "Follow-up with cardiologist within 1 week"
        },
        
        "Flu": {
            disease: "Flu (Influenza)",
            diseaseExplanation: "Viral respiratory infection causing fever, cough, and body aches. Usually self-limiting within 7-10 days.",
            medicines: [
                {
                    name: "Paracetamol",
                    dosage: "500mg",
                    frequency: "Three times daily",
                    duration: "3-5 days",
                    purpose: "Fever and pain relief"
                },
                {
                    name: "Oseltamivir (Tamiflu)",
                    dosage: "75mg",
                    frequency: "Twice daily",
                    duration: "5 days",
                    purpose: "Antiviral (if started early)"
                }
            ],
            precautions: [
                "Rest adequately",
                "Stay hydrated",
                "Avoid contact with others",
                "Maintain hygiene"
            ],
            warning: "Seek medical help if difficulty breathing, persistent chest pain, or confusion develops",
            followUp: "Follow-up if symptoms persist beyond 10 days"
        },
        
        "Diabetes": {
            disease: "Diabetes Mellitus",
            diseaseExplanation: "Metabolic disorder affecting blood sugar regulation. Requires lifestyle changes and medication management.",
            medicines: [
                {
                    name: "Metformin",
                    dosage: "500-1000mg",
                    frequency: "Twice daily",
                    duration: "Ongoing",
                    purpose: "Blood sugar control"
                }
            ],
            precautions: [
                "Monitor blood sugar regularly",
                "Maintain healthy diet",
                "Regular exercise (30 mins daily)",
                "Avoid sugary foods",
                "Regular foot checks"
            ],
            warning: "Seek help if blood sugar extremely high or low, vision changes, or signs of infection",
            followUp: "Regular follow-ups every 3 months with endocrinologist"
        },
        
        "Pneumonia": {
            disease: "Pneumonia",
            diseaseExplanation: "Lung infection causing inflammation of air sacs. Requires antibiotic treatment.",
            medicines: [
                {
                    name: "Amoxicillin",
                    dosage: "500mg",
                    frequency: "Three times daily",
                    duration: "7-10 days",
                    purpose: "Antibiotic"
                }
            ],
            precautions: [
                "Rest and avoid exertion",
                "Stay hydrated",
                "Use humidifier",
                "Elevate head while sleeping"
            ],
            warning: "Seek emergency help if severe shortness of breath, cyanosis, or confusion develops",
            followUp: "Follow-up after 1 week to monitor recovery"
        }
    };
    
    return medicineDatabase[disease] || {
        disease: disease || "Unknown",
        diseaseExplanation: "Please consult with a healthcare professional for accurate diagnosis.",
        medicines: [],
        precautions: ["Consult a doctor"],
        warning: "Please seek professional medical advice",
        followUp: "Schedule appointment with doctor"
    };
}

// =====================================================
// STEP 4: UI INTEGRATION HELPER
// =====================================================

/**
 * Comprehensive diagnosis analysis combining all steps
 */
async function performComprehensiveDiagnosis(userSymptoms, patientInfo) {
    // Step 1 & 2: Calculate probable diseases
    const diseaseAnalysis = calculateMostProbableDisease(userSymptoms);
    
    if (!diseaseAnalysis.primaryDisease) {
        return {
            success: false,
            message: "Unable to determine probable disease from symptoms"
        };
    }
    
    // Step 3: Get medical advice (with Gemini)
    const medicalAdvice = await getMedicalAdviceFromGemini({
        age: patientInfo.age,
        gender: patientInfo.gender,
        symptoms: userSymptoms,
        disease: diseaseAnalysis.primaryDisease,
        medicalHistory: patientInfo.medicalHistory || []
    });
    
    return {
        success: true,
        diagnosis: diseaseAnalysis.primaryDisease,
        confidence: diseaseAnalysis.confidence,
        topDiseases: diseaseAnalysis.topDiseases,
        mostCriticalSymptom: diseaseAnalysis.mostCriticalSymptom,
        medicalAdvice: medicalAdvice,
        analysis: diseaseAnalysis
    };
}

// =====================================================
// EXPORTS
// =====================================================

window.SmartDiagnosis = {
    calculateMostProbableDisease,
    getMedicalAdviceFromGemini,
    performComprehensiveDiagnosis,
    DISEASE_SYMPTOM_MAP,
    SYMPTOM_SEVERITY
};

console.log('✅ Smart Diagnosis System Loaded');
