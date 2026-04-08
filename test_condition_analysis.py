#!/usr/bin/env python3
"""
Test script for condition analysis endpoints
Tests the real data extraction and analysis from the database
"""

import requests
import json
from typing import Dict, Any

# Configuration
API_BASE = 'http://localhost:5000/api'
ADMIN_TOKEN = 'your-admin-token-here'  # Get this after admin login

def test_common_conditions(token: str, limit: int = 10) -> Dict[str, Any]:
    """Test common conditions endpoint"""
    print(f"\n🔍 Testing /admin/common-conditions endpoint...")
    
    try:
        url = f'{API_BASE}/admin/common-conditions?limit={limit}'
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        print(f"✅ Status: {response.status_code}")
        print(f"✅ Top condition: {data['data']['summary'].get('top_condition', 'N/A')}")
        print(f"✅ Total diagnoses: {data['data']['summary'].get('total_diagnoses', 0)}")
        print(f"✅ Unique conditions: {data['data']['summary'].get('unique_conditions', 0)}")
        
        # Display top 3
        if data['data']['most_common']:
            print("\n   Top conditions:")
            for i, cond in enumerate(data['data']['most_common'][:3], 1):
                print(f"   {i}. {cond['condition']}: {cond['count']} cases ({cond['percentage']}%) - {cond['prevalence']}")
        
        return data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        return None

def test_condition_trends(token: str) -> Dict[str, Any]:
    """Test condition trends endpoint"""
    print(f"\n🔍 Testing /admin/condition-trends endpoint...")
    
    try:
        url = f'{API_BASE}/admin/condition-trends'
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        print(f"✅ Status: {response.status_code}")
        print(f"✅ Total conditions tracked: {data['total_conditions']}")
        print(f"✅ Trends found: {len(data['trends'])}")
        
        # Display top trends
        if data['trends']:
            print("\n   Top condition trends:")
            for trend in data['trends'][:3]:
                total = trend['total']
                print(f"   • {trend['condition']}: {total} total cases")
        
        return data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        return None

def test_risk_analysis(token: str) -> Dict[str, Any]:
    """Test risk analysis endpoint"""
    print(f"\n🔍 Testing /admin/risk-analysis endpoint...")
    
    try:
        url = f'{API_BASE}/admin/risk-analysis'
        headers = {'Authorization': f'Bearer {token}'}
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        print(f"✅ Status: {response.status_code}")
        print(f"✅ Conditions analyzed: {data['total_conditions_analyzed']}")
        
        # Display risk breakdown for top condition
        if data['risk_by_condition']:
            top = data['risk_by_condition'][0]
            print(f"\n   Top condition risk breakdown:")
            print(f"   • Condition: {top['condition']}")
            print(f"   • Cases: {top['total_cases']}")
            print(f"   • Low risk: {top['risk_distribution']['low']}%")
            print(f"   • Medium risk: {top['risk_distribution']['medium']}%")
            print(f"   • High risk: {top['risk_distribution']['high']}%")
            print(f"   • Critical: {top['risk_distribution']['critical']}%")
            print(f"   • Average risk: {top['average_risk']}")
        
        return data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        return None

def run_all_tests(token: str):
    """Run all endpoint tests"""
    print("\n" + "="*60)
    print("   🏥 CONDITION ANALYSIS API TESTS")
    print("="*60)
    
    if not token or token == 'your-admin-token-here':
        print("\n❌ ERROR: Please provide a valid admin token")
        print("\nTo get your admin token:")
        print("1. Login to the admin dashboard at http://localhost:8080/admin-v2.html")
        print("2. Check localStorage for 'medai_admin_token'")
        print("3. Run this script with: python test_condition_analysis.py '<your-token>'")
        print("\nOr update ADMIN_TOKEN in this script directly.")
        return
    
    print(f"\n🔐 Using admin token: {token[:20]}...")
    
    # Run tests
    conditions = test_common_conditions(token)
    trends = test_condition_trends(token)
    risks = test_risk_analysis(token)
    
    # Summary
    print("\n" + "="*60)
    print("   TEST SUMMARY")
    print("="*60)
    
    results = {
        'Common Conditions': '✅ PASS' if conditions else '❌ FAIL',
        'Condition Trends': '✅ PASS' if trends else '❌ FAIL',
        'Risk Analysis': '✅ PASS' if risks else '❌ FAIL'
    }
    
    for test_name, result in results.items():
        print(f"{result} {test_name}")
    
    # Overall result
    passed = sum(1 for r in results.values() if '✅' in r)
    total = len(results)
    print(f"\n📊 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✅ All tests passed! The condition analysis system is working correctly.")
        print("\n📊 You can now view the analysis in the Admin Dashboard:")
        print("   → Navigate to 'Trends & Predictions' tab")
        print("   → Look for 'Most Common Conditions (Real Data)' section")
    else:
        print(f"\n⚠️ {total - passed} test(s) failed. Check the errors above.")

if __name__ == '__main__':
    import sys
    
    # Get token from command line or use default
    token = sys.argv[1] if len(sys.argv) > 1 else ADMIN_TOKEN
    
    run_all_tests(token)
