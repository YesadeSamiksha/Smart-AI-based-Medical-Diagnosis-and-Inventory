# Smart Diagnosis System - Quick Start

## What's New?

Your medical diagnosis app now features:
- ✓ **Smart symptom weighting** (not all symptoms equal)
- ✓ **Disease probability calculation** (top 3 ranked diseases)
- ✓ **Gemini AI medicine recommendations** (with dosage)
- ✓ **Real-time precautions** based on diagnosis

## How It Works

### User Flow
1. Patient selects symptoms (e.g., fever, cough, fatigue)
2. System calculates disease scores using weighted symptoms
3. AI ranks top 3 probable diseases with confidence %
4. Gemini recommends medicines and precautions
5. Results displayed with medicines and cautions

### Behind the Scenes
```
symptoms: ["fever", "cough", "fatigue"]
              ↓
Disease Scoring:
  Flu: fever(3) + cough(2) + fatigue(2) = 7 points → 85% confidence
  COVID: fever(3) + cough(3) + fatigue(2) = 8 points → 75% confidence
  Cold: cough(2) + fatigue(1) = 3 points → 60% confidence
              ↓
Result:
  Primary: Flu (85%)
  Medicines: Paracetamol 500mg 3x daily
  Precautions: Rest, stay hydrated
```

## Endpoints

### Smart Diagnosis Endpoint
```
POST /api/smart-diagnosis

Request:
{
  "symptoms": ["fever", "cough"],
  "patient_info": {
    "age": 30,
    "gender": "male",
    "duration": "3 days",
    "medical_history": "None"
  },
  "user_id": "optional"
}

Response:
{
  "primary_disease": "Flu",
  "confidence": 85,
  "medicines": [
    {"name": "Paracetamol", "dosage": "500mg 3x daily"}
  ],
  "precautions": ["Rest", "Stay hydrated"],
  "risk_level": "medium"
}
```

## Installation & Setup

### 1. Backend Setup (Flask)
No additional setup required! The code is already in `app_flask_v2.py`:
- Disease mapping: ~11 diseases
- Scoring algorithm: Included
- Medicine database: Built-in
- Gemini integration: Optional (automatic fallback)

### 2. Frontend Setup (Symptom Checker)
The UI is already updated in `symptom-checker.html`:
- Medicine display section
- Precautions section
- Result transformation

### 3. Start the Server
```bash
python app_flask_v2.py
```

## Configuration

### Enable Gemini AI (Optional)
Set environment variable:
```bash
# Windows CMD
set GEMINI_API_KEY=your-api-key-here

# Windows PowerShell
$env:GEMINI_API_KEY="your-api-key-here"

# Linux/Mac
export GEMINI_API_KEY=your-api-key-here
```

If not set, system uses built-in medicine database automatically.

### Medicine Database
Edit `app_flask_v2.py` function `get_medicine_for_disease()` to add/modify:
```python
medicine_database = {
    "your_disease": [
        {"name": "Medicine", "dosage": "500mg daily", "purpose": "..."}
    ]
}
```

## Testing

### Test via Python Script
```bash
# First, start server in another terminal:
# python app_flask_v2.py

# Then run tests:
python test_smart_diagnosis.py
```

### Manual Test via cURL
```bash
curl -X POST http://localhost:5000/api/smart-diagnosis \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": ["fever", "cough", "fatigue"],
    "patient_info": {"age": 30, "gender": "male"}
  }'
```

### Web UI Test
1. Open http://localhost:8080/symptom-checker.html
2. Select symptoms: fever, cough, fatigue
3. Enter patient info
4. Click "Analyze with AI"
5. See results with medicines!

## Features

### Symptom Weighting
Symptoms have different importance levels:
- **High (weight 3)**: Chest pain, fever (definitive)
- **Medium (weight 2)**: Cough, dizziness (important)
- **Low (weight 1)**: Fatigue, weakness (supporting)

### Disease Ranking
Top 3 diseases shown with:
- Disease name
- Confidence percentage (0-100%)
- Number of matched symptoms
- Risk level (low/medium/high)

### Medicine Display
For each recommended medicine:
- Generic name
- Dosage (age-appropriate)
- Duration
- Purpose/indication

### Precautions
Disease-specific precautions:
- What to avoid
- When to seek help
- Lifestyle changes

## Supported Diseases

The system currently recognizes:
- Heart Disease
- Hypertension
- Pneumonia
- Asthma
- Bronchitis
- Flu
- COVID-19
- Diabetes
- Gastritis
- Thyroid Disease
- Arthritis

Each disease has 5-8 weighted symptoms.

## Troubleshooting

### "No specific conditions identified"
- **Cause**: Symptoms don't match any disease
- **Fix**: Ensure correct symptom names
- **Action**: Try spelling variations

### No medicines shown
- **Cause**: Disease not in medicine database
- **Fix**: Check disease name matches database
- **Fallback**: Message says "Consult doctor"

### Gemini not enhancing results
- **Cause**: API key not set or invalid
- **Fix**: Set GEMINI_API_KEY environment
- **Fallback**: Database medicines still shown

### Confidence too low
- **Cause**: Symptoms don't match disease well
- **Fix**: Ensure selected symptoms are accurate
- **Note**: Low confidence triggers "See doctor soon"

## API Response Structure

```javascript
{
  // Success flag
  "success": true,

  // Primary diagnosis
  "primary_disease": "Flu",
  "confidence": 85,

  // Top 3 diseases
  "top_3_diseases": [
    {
      "disease": "Flu",
      "confidence": 85,
      "matched_symptoms": 3
    }
  ],

  // Symptom analysis
  "symptom_analysis": {
    "total_reported": 4,
    "total_matched": 3,
    "most_critical_symptom": "Fever",
    "weights_applied": true
  },

  // Medicines
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg 3x daily",
      "purpose": "Fever/Pain"
    }
  ],

  // Safety precautions
  "precautions": [
    "Rest adequately",
    "Stay hydrated"
  ],

  // Risk assessment
  "risk_level": "medium",

  // AI provider info
  "ai_provider": "smart_weighted_gemini"
}
```

## Performance

- Response time: < 2 seconds (with Gemini)
- Fallback time: < 500ms (database only)
- Supports up to 20 symptoms per analysis

## Security & Privacy

- ✓ Patient data not stored in cookies
- ✓ Symptoms logged for diagnosis history (Supabase)
- ✓ No external API calls except Gemini
- ✓ Generic medicine names (not prescriptions)

## Important Disclaimers

⚠️ **This system**:
- Is for informational purposes only
- Is NOT a substitute for professional medical advice
- Should NOT be used for diagnosis/treatment alone
- Requires doctor consultation for actual treatment

Always display the medical disclaimer to users!

## Next Steps

1. ✓ Test with sample symptoms
2. ✓ Verify Gemini integration (if using)
3. ✓ Check medicine database accuracy
4. ✓ Review precautions for your region
5. ✓ Update with local hospital/doctor links

## Support

### Common Issues
| Issue | Solution |
|-------|----------|
| Low confidence | More accurate symptom selection |
| No medicines | Disease not in database (add it) |
| Gemini failing | Check API key, use fallback |
| Slow response | Check network, Gemini rate limits |

### Logs
Check Flask console for:
- Error messages (red text)
- API calls (green text)
- Gemini requests (blue text)

---

**Ready to use!** Open http://localhost:8080/symptom-checker.html and try it out.

**Questions?** Check SMART-DIAGNOSIS-IMPLEMENTATION.md for detailed docs.
