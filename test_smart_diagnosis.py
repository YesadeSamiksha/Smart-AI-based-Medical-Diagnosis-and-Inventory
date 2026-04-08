#!/usr/bin/env python3
"""
Test the smart diagnosis endpoint
"""

import requests
import json
import time

API_URL = 'http://localhost:5000/api'

# Test cases
test_cases = [
    {
        'name': 'Flu-like symptoms',
        'data': {
            'symptoms': ['fever', 'cough', 'fatigue', 'headache', 'muscle pain'],
            'patient_info': {
                'age': 30,
                'gender': 'male',
                'duration': '3 days',
                'medical_history': 'None'
            }
        }
    },
    {
        'name': 'Heart disease symptoms',
        'data': {
            'symptoms': ['chest pain', 'shortness of breath', 'palpitations', 'dizziness'],
            'patient_info': {
                'age': 55,
                'gender': 'male',
                'duration': '1 week',
                'medical_history': 'Hypertension'
            }
        }
    },
    {
        'name': 'Respiratory symptoms',
        'data': {
            'symptoms': ['cough', 'shortness of breath', 'chest pain', 'fever'],
            'patient_info': {
                'age': 40,
                'gender': 'female',
                'duration': '5 days',
                'medical_history': 'Asthma'
            }
        }
    },
    {
        'name': 'Diabetes-like symptoms',
        'data': {
            'symptoms': ['frequent urination', 'increased thirst', 'fatigue', 'blurred vision'],
            'patient_info': {
                'age': 50,
                'gender': 'male',
                'duration': '2 weeks',
                'medical_history': 'None'
            }
        }
    }
]

def test_smart_diagnosis():
    """Test the smart diagnosis endpoint"""
    
    print("=" * 60)
    print("SMART DIAGNOSIS ENDPOINT TEST")
    print("=" * 60)
    
    for test_case in test_cases:
        print(f"\n\nTest: {test_case['name']}")
        print("-" * 40)
        
        try:
            response = requests.post(
                f'{API_URL}/smart-diagnosis',
                json=test_case['data'],
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                
                print(f"✓ Success!")
                print(f"  Primary Disease: {result.get('primary_disease', 'N/A')}")
                print(f"  Confidence: {result.get('confidence', 0)}%")
                print(f"  Risk Level: {result.get('risk_level', 'unknown')}")
                print(f"  AI Provider: {result.get('ai_provider', 'unknown')}")
                
                # Show top 3 diseases
                print(f"\n  Top 3 Diseases:")
                for i, disease in enumerate(result.get('top_3_diseases', [])[:3], 1):
                    print(f"    {i}. {disease['disease']} ({disease['confidence']}% confidence)")
                
                # Show medicines
                medicines = result.get('medicines', [])
                if medicines:
                    print(f"\n  Recommended Medicines ({len(medicines)}):")
                    for med in medicines[:3]:
                        print(f"    - {med.get('name', 'N/A')}: {med.get('dosage', 'N/A')}")
                
                # Show precautions
                precautions = result.get('precautions', [])
                if precautions:
                    print(f"\n  Precautions ({len(precautions)}):")
                    for prec in precautions[:2]:
                        print(f"    - {prec}")
                
            else:
                print(f"✗ Error ({response.status_code}): {response.text}")
                
        except Exception as e:
            print(f"✗ Exception: {str(e)}")
            print(f"  (Is the server running on {API_URL}?)")

if __name__ == '__main__':
    print("\nMake sure the Flask server is running before running this test!")
    print("Run: python app_flask_v2.py")
    input("\nPress Enter to continue...")
    
    test_smart_diagnosis()
    
    print("\n" + "=" * 60)
    print("Test completed!")
