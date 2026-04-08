# Architecture Diagram - Most Common Conditions Analysis

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      MEDICAL AI SYSTEM                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼────────┐  ┌───────▼────────┐
            │   USER SIDE    │  │   ADMIN SIDE   │
            │                │  │                │
            │ • Symptom      │  │ • Dashboard    │
            │   Checker      │  │ • Analytics    │
            │ • Diagnosis    │  │ • Reporting    │
            │   Tools        │  │                │
            └───────┬────────┘  └───────┬────────┘
                    │                   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼──────────┐
                    │  FLASK BACKEND     │
                    │  (app_flask_v2.py) │
                    └────────┬───────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐      ┌─────▼─────┐    ┌─────▼──────────┐
    │  Diagnosis│      │ Condition │    │   Common       │
    │  Endpoints│      │ Analysis  │    │   Conditions   │
    │           │      │  Endpoints│    │   Endpoints    │
    │ • /symptoms│     │           │    │ (NEW)          │
    │ • /diabetes│     │ GET /admin│    │                │
    │ • /lung    │     │  /common- │    │ • /admin/      │
    │ • /bp      │     │  conditions│   │   common-      │
    │           │      │ GET /admin│    │   conditions   │
    │           │      │  /condition│   │ • /admin/      │
    │           │      │  -trends  │    │   condition-   │
    │           │      │ GET /admin│    │   trends       │
    │           │      │  /risk-   │    │ • /admin/      │
    │           │      │  analysis │    │   risk-analysis│
    └─────┬─────┘      └─────┬─────┘    └─────┬──────────┘
          │                  │                │
          └──────────────────┼────────────────┘
                             │
                    ┌────────▼────────┐
                    │  SUPABASE DB    │
                    │  (PostgreSQL)   │
                    │                 │
                    │ Tables:         │
                    │ • profiles      │
                    │ • diagnosis_    │
                    │   results       │
                    │ • inventory     │
                    │ • orders        │
                    └────────┬────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
    ┌───▼──────────────┐          ┌──────────────▼──┐
    │  Diagnosis Data  │          │   Analysis      │
    │                 │          │   Results       │
    │ • diagnosis_type│          │                 │
    │ • result_data   │          │ • Conditions    │
    │ • risk_level    │          │ • Prevalence    │
    │ • created_at    │          │ • Trends        │
    │ • user_id       │          │ • Risk Dist     │
    └───┬──────────────┘          └──────────┬──────┘
        │                                   │
        └───────────────┬───────────────────┘
                        │
                    ┌───▼───────────────┐
                    │  FRONTEND (HTML)  │
                    │  (admin-v2.html)  │
                    │                   │
                    │ Charts:           │
                    │ • Bar Chart       │
                    │   (Conditions)    │
                    │ • Line Chart      │
                    │   (Trends)        │
                    │ • Doughnut Chart  │
                    │   (Risk)          │
                    │ • List View       │
                    │   (Breakdown)     │
                    └───────┬───────────┘
                            │
                    ┌───────▼────────┐
                    │   ADMIN VIEWS  │
                    │                │
                    │ "Most Common   │
                    │  Conditions"   │
                    │  Dashboard     │
                    └────────────────┘
```

---

## Data Flow Diagram

```
USER COMPLETES DIAGNOSIS
        │
        ▼
   ┌─────────────┐
   │ Diagnosis   │
   │ Result      │
   │ Generated   │
   └──────┬──────┘
          │
          ▼
   ┌──────────────────────┐
   │ Saved to Supabase    │
   │ diagnosis_results    │
   │ table                │
   │                      │
   │ Fields:              │
   │ • result_data JSONB  │
   │ • diagnosis_type     │
   │ • risk_level         │
   │ • user_id            │
   │ • created_at         │
   └──────┬───────────────┘
          │
          ▼
   ADMIN CLICKS REFRESH
        │
        ▼
   ┌─────────────────────┐
   │ GET /admin/common-  │
   │ conditions          │
   └──────┬──────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Backend Analysis     │
   │                      │
   │ 1. Fetch all         │
   │    diagnosis_results │
   │                      │
   │ 2. Extract conditions│
   │    from result_data  │
   │                      │
   │ 3. Count occurrences │
   │                      │
   │ 4. Calculate %       │
   │                      │
   │ 5. Rank by frequency │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ JSON Response        │
   │                      │
   │ {                    │
   │  most_common: [      │
   │    {condition: ...,  │
   │     count: ...,      │
   │     percentage: ..., │
   │     prevalence: ...} │
   │  ],                  │
   │  summary: {...}      │
   │ }                    │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Frontend Rendering   │
   │                      │
   │ • Create charts      │
   │ • Format data        │
   │ • Display in DOM     │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Admin Sees:          │
   │                      │
   │ ▓▓▓▓▓ Hypertension   │
   │ ▓▓▓▓ Diabetes        │
   │ ▓▓▓ Asthma           │
   │ ▓▓ Heart Disease     │
   │ ▓ Arthritis          │
   │                      │
   │ Real condition data! │
   └──────────────────────┘
```

---

## Component Interaction

```
┌──────────────────────────────────────────────────────────────┐
│                   ADMIN DASHBOARD                           │
│                   (admin-v2.html)                           │
│                                                              │
│  Trends & Predictions Tab                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [Refresh Analysis Button]                             │ │
│  │                                                        │ │
│  │ ┌────────────────────┐  ┌────────────────────┐       │ │
│  │ │ KPI Cards          │  │ Most Common        │       │ │
│  │ │ • Total Assessments│  │ Conditions Chart   │       │ │
│  │ │ • High Risk Cases  │  │ (Bar Chart)        │       │ │
│  │ │ • Top Condition    │  │                    │       │ │
│  │ │ • Monthly Growth   │  └────────────────────┘       │ │
│  │ └────────────────────┘                               │ │
│  │                                                        │ │
│  │ ┌────────────────────┐  ┌────────────────────┐       │ │
│  │ │ Condition Trends   │  │ Top Conditions     │       │ │
│  │ │ (Line Chart)       │  │ Breakdown (List)   │       │ │
│  │ │                    │  │                    │       │ │
│  │ │ 5 conditions over  │  │ • Hypertension     │       │ │
│  │ │ time               │  │ • Diabetes         │       │ │
│  │ └────────────────────┘  │ • Asthma           │       │ │
│  │                         │ • Heart Disease    │       │ │
│  │ ┌────────────────────┐  │ • Arthritis        │       │ │
│  │ │ Risk Distribution  │  │                    │       │ │
│  │ │ (Doughnut Chart)   │  └────────────────────┘       │ │
│  │ │ Low 20% │ Med 40%  │                               │ │
│  │ │ High 30% │ Crit 10%│                               │ │
│  │ └────────────────────┘                               │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
           │
           │ Calls when user clicks "Refresh"
           ▼
┌──────────────────────────────────────────────────────────────┐
│             trends-analysis.js Module                        │
│                                                              │
│ Functions:                                                   │
│ • loadCommonConditionsFromDB()                              │
│ • loadConditionTrendsFromDB()                               │
│ • loadRiskAnalysisFromDB()                                  │
│ • displayCommonConditions()                                 │
│ • displayConditionTrends()                                  │
│ • displayRiskAnalysis()                                     │
│ • createChart*()                                            │
└──────────────────────────────────────────────────────────────┘
           │
           │ Makes API requests
           ▼
┌──────────────────────────────────────────────────────────────┐
│                  Flask Backend API                          │
│              (app_flask_v2.py)                             │
│                                                              │
│ Endpoint 1: GET /admin/common-conditions                    │
│ • Fetches diagnosis_results                                │
│ • Extracts conditions                                       │
│ • Counts and ranks                                          │
│ • Returns JSON                                              │
│                                                              │
│ Endpoint 2: GET /admin/condition-trends                     │
│ • Analyzes trends over time                                │
│ • Groups by date                                            │
│ • Returns time series                                       │
│                                                              │
│ Endpoint 3: GET /admin/risk-analysis                        │
│ • Breaks down risk levels                                   │
│ • Analyzes by condition                                     │
│ • Returns risk distribution                                │
└──────────────────────────────────────────────────────────────┘
           │
           │ Queries database
           ▼
┌──────────────────────────────────────────────────────────────┐
│             Supabase Database                               │
│                                                              │
│ SELECT * FROM diagnosis_results                            │
│ WHERE user_id = ANY(user_ids)                              │
│                                                              │
│ Results include:                                            │
│ • result_data (JSONB with conditions)                      │
│ • diagnosis_type                                            │
│ • risk_level                                                │
│ • created_at                                                │
└──────────────────────────────────────────────────────────────┘
           │
           │ Returns query results
           ▼
┌──────────────────────────────────────────────────────────────┐
│           Backend Analysis & Aggregation                    │
│                                                              │
│ extract_conditions_from_diagnosis()                         │
│ • Parse result_data JSONB                                  │
│ • Get primary_conditions array                             │
│ • Return list of condition names                           │
│                                                              │
│ analyze_common_conditions()                                 │
│ • Count all conditions                                      │
│ • Calculate percentages                                     │
│ • Determine prevalence                                      │
│ • Sort by frequency                                         │
│                                                              │
│ → Returns: JSON with analysis                              │
└──────────────────────────────────────────────────────────────┘
           │
           │ Returns to frontend
           ▼
┌──────────────────────────────────────────────────────────────┐
│            Frontend Processing                              │
│                                                              │
│ • Parse JSON response                                       │
│ • Format for display                                        │
│ • Create Chart.js instances                                │
│ • Render in DOM                                             │
└──────────────────────────────────────────────────────────────┘
           │
           │ Displays to user
           ▼
┌──────────────────────────────────────────────────────────────┐
│          ADMIN SEES REAL CONDITION DATA                     │
│                                                              │
│     Most Common Conditions from Your Database               │
│     ▓▓▓▓▓ Hypertension    45 cases (25%)                   │
│     ▓▓▓▓ Diabetes         32 cases (18%)                   │
│     ▓▓▓ Asthma            18 cases (10%)                   │
│     ▓▓ Heart Disease      12 cases (7%)                    │
│     ▓ Arthritis            9 cases (5%)                    │
│                                                              │
│     ✅ Real data from actual user diagnoses                │
│     ✅ Updated as new diagnoses are added                  │
│     ✅ No dummy data whatsoever                            │
└──────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
Smart-AI-based-Medical-Diagnosis-and-Inventory/
│
├── app_flask_v2.py (MODIFIED)
│   ├── Lines 632-770: extract_conditions_from_diagnosis()
│   ├── Lines 773-860: Three new API endpoints
│   └── Helper functions for analysis
│
├── admin-v2.html (MODIFIED)
│   ├── Line 25: Script include for trends-analysis.js
│   ├── Lines 894-916: New visualization containers
│   └── Lines 2330-2750: Updated functions
│
├── trends-analysis.js (NEW)
│   ├── loadCommonConditionsFromDB()
│   ├── loadConditionTrendsFromDB()
│   ├── loadRiskAnalysisFromDB()
│   ├── displayCommonConditions()
│   ├── displayConditionTrends()
│   ├── displayRiskAnalysis()
│   └── Chart creation utilities
│
├── test_condition_analysis.py (NEW)
│   ├── test_common_conditions()
│   ├── test_condition_trends()
│   ├── test_risk_analysis()
│   └── run_all_tests()
│
├── Documentation (NEW - 4 files)
│   ├── CONDITION-ANALYSIS-QUICKSTART.md
│   ├── CONDITION-ANALYSIS-GUIDE.md
│   ├── IMPLEMENTATION-SUMMARY.md
│   ├── CHANGELOG-CONDITION-ANALYSIS.md
│   └── README-CONDITION-ANALYSIS.md
│
└── (Unchanged files)
    ├── supabase-config.js
    ├── styles.css
    └── Other files
```

---

## Data Extraction Flow

```
Diagnosis Result
    │
    ├─ result_data: JSONB
    │  │
    │  └─ {
    │     "primary_conditions": [
    │       {
    │         "name": "Hypertension",
    │         "probability": 75,
    │         "severity": "high"
    │       },
    │       {
    │         "name": "Diabetes",
    │         "probability": 45,
    │         "severity": "moderate"
    │       }
    │     ]
    │   }
    │
    ├─ Extraction Function
    │  │ extract_conditions_from_diagnosis(result_data)
    │  │
    │  └─ Returns: ["Hypertension", "Diabetes"]
    │
    ├─ Aggregation
    │  │ Condition Counts:
    │  │ • Hypertension: 45 times
    │  │ • Diabetes: 32 times
    │  │ • Asthma: 18 times
    │
    └─ Analysis
       │ Prevalence:
       │ • Hypertension: 25.0% (HIGH)
       │ • Diabetes: 17.8% (HIGH)
       │ • Asthma: 10.0% (MEDIUM)
```

---

**Diagram Created:** April 2026
**Version:** 1.0.0
