# Most Common Conditions Analysis Guide

## Overview

The Medical Diagnosis System now includes **Real-Time Condition Analysis** that automatically fetches and analyzes the most common medical conditions from your actual user database. This eliminates the need for dummy data and provides actionable insights based on real patient data.

## Features

### 1. **Most Common Conditions Analysis**
- Automatically extracts the top medical conditions from all user diagnoses
- Displays prevalence (percentage of total diagnoses)
- Shows risk classification for each condition
- Updates in real-time as new user assessments are recorded

### 2. **Condition Trends Over Time**
- Tracks how common conditions change over time
- Shows up to 5 most common conditions with trend lines
- Helps identify emerging health patterns
- Data updates automatically when new diagnoses are added

### 3. **Risk Distribution by Condition**
- Analyzes risk levels (low, medium, high, critical) for each condition
- Shows risk breakdown for top conditions
- Helps prioritize public health interventions
- Identifies high-risk conditions requiring immediate attention

### 4. **Disease Type Distribution**
- Shows the ratio of different diagnosis types:
  - **Diabetes**: Risk assessments for diabetes
  - **Lung**: Respiratory/lung disease screening
  - **BP**: Blood pressure/hypertension assessment
  - **Symptoms**: General symptom-based diagnosis

### 5. **Monthly Diagnosis Trend**
- Displays diagnosis volume over the last 6 months
- Shows growth patterns in the user base
- Helps forecast medicine and equipment demand

## API Endpoints

### `/api/admin/common-conditions`
**GET** - Returns the most common medical conditions from the database

**Parameters:**
- `limit` (optional): Number of top conditions to return (default: 10)
- `type` (optional): Filter by diagnosis type (diabetes, lung, bp, symptoms)

**Response:**
```json
{
  "success": true,
  "data": {
    "most_common": [
      {
        "condition": "Hypertension",
        "count": 45,
        "percentage": 25.0,
        "prevalence": "High"
      },
      {
        "condition": "Diabetes",
        "count": 32,
        "percentage": 17.8,
        "prevalence": "High"
      }
    ],
    "summary": {
      "total_diagnoses": 180,
      "unique_conditions": 42,
      "top_condition": "Hypertension",
      "top_condition_count": 45
    }
  }
}
```

### `/api/admin/condition-trends`
**GET** - Returns condition trends over time

**Response:**
```json
{
  "success": true,
  "trends": [
    {
      "condition": "Hypertension",
      "trend": [
        {"date": "2024-03-01", "count": 5},
        {"date": "2024-03-02", "count": 3}
      ],
      "total": 45
    }
  ],
  "total_conditions": 42,
  "top_conditions": ["Hypertension", "Diabetes", "Asthma"]
}
```

### `/api/admin/risk-analysis`
**GET** - Returns risk distribution by condition

**Response:**
```json
{
  "success": true,
  "risk_by_condition": [
    {
      "condition": "Hypertension",
      "risk_distribution": {
        "low": 20.0,
        "medium": 40.0,
        "high": 30.0,
        "critical": 10.0
      },
      "total_cases": 45,
      "average_risk": "High"
    }
  ],
  "total_conditions_analyzed": 42
}
```

## Data Source

All analysis data comes **directly from your Supabase database**:

- **Users**: From `profiles` table
- **Diagnoses**: From `diagnosis_results` table, including:
  - Diagnosis type (diabetes, lung, bp, symptoms)
  - Risk level (low, medium, high, critical)
  - Result data (contains condition information)
  - Timestamps of assessment

## How Conditions Are Extracted

The system analyzes the `result_data` field from each diagnosis:

1. **For Symptom Checks**: Extracts `primary_conditions` array
2. **For Diabetes**: Shows "Diabetes Risk Assessment"
3. **For Lung Disease**: Shows "Lung Disease Risk"
4. **For Blood Pressure**: Shows "Blood Pressure Assessment"

Example diagnosis result structure:
```json
{
  "primary_conditions": [
    {
      "name": "Hypertension",
      "probability": 75,
      "severity": "high"
    },
    {
      "name": "Diabetes",
      "probability": 45,
      "severity": "moderate"
    }
  ],
  "risk_assessment": {
    "overall_risk": "high",
    "urgency": "soon"
  }
}
```

## Using the Admin Dashboard

### View Common Conditions
1. Go to **Admin Dashboard** → **Trends & Predictions** tab
2. Look at the **"Most Common Conditions (Real Data)"** chart
3. Conditions are ranked by frequency with prevalence indicators:
   - 🔴 **High**: > 20% of diagnoses
   - 🟡 **Medium**: 10-20% of diagnoses
   - 🟢 **Low**: < 10% of diagnoses

### Refresh Data
- Click the **"Refresh Analysis"** button to reload all data from the database
- Data auto-updates every time the page loads
- No need to manually add or manage condition lists

### Monitor Trends
- **Condition Trends Over Time**: Shows which conditions are becoming more or less common
- **Risk Distribution**: Identifies which conditions have the highest risk concentration
- **Monthly Diagnosis Trend**: Tracks overall system usage and health patterns

## Implementation Details

### Backend (Flask)

**New functions in `app_flask_v2.py`:**

1. `extract_conditions_from_diagnosis(diagnosis)` - Parses result_data to find conditions
2. `analyze_common_conditions(limit, diagnosis_type)` - Analyzes top conditions
3. `get_common_conditions()` - API endpoint for condition analysis
4. `get_condition_trends()` - API endpoint for trend analysis
5. `get_risk_analysis()` - API endpoint for risk analysis

### Frontend (JavaScript)

**New module: `trends-analysis.js`**

Provides functions for:
- Loading condition data from API
- Formatting data for display
- Creating charts and visualizations
- Managing real-time updates

**Integration with `admin-v2.html`:**
- Updated `loadTrendsData()` to fetch real data
- New containers for displaying condition analysis
- Dynamic chart rendering using Chart.js

## Database Requirements

Ensure your Supabase `diagnosis_results` table has:

```sql
CREATE TABLE diagnosis_results (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    diagnosis_type TEXT (diabetes, lung, bp, symptoms),
    result_data JSONB,           -- Contains condition information
    risk_level TEXT (low, medium, high, critical),
    created_at TIMESTAMP,
    INDEX idx_diagnosis_type (diagnosis_type),
    INDEX idx_risk_level (risk_level)
);
```

## Example Use Cases

### 1. Public Health Planning
- Identify top 3 conditions affecting your region
- Allocate resources based on actual demand
- Plan preventive care programs

### 2. Medicine Procurement
- Predict medicine demand based on condition prevalence
- Reduce waste from unsold stock
- Ensure availability of medications for common conditions

### 3. Clinical Decision Support
- Recognize common condition patterns
- Tailor diagnostic focus areas
- Improve assessment accuracy for prevalent conditions

### 4. Patient Education
- Develop educational materials for common conditions
- Create targeted awareness campaigns
- Improve outcomes through early detection

## Troubleshooting

### No Data Displaying
- **Ensure Supabase connection**: Check that database has actual diagnosis records
- **Check admin token**: Verify you're logged in as admin
- **Enable RLS policies**: Make sure admin can read `diagnosis_results` table

### Incorrect Conditions
- **Verify result_data format**: Check that diagnosis results contain `primary_conditions` array
- **Test diagnosis endpoint**: Create a test diagnosis to see the result structure
- **Check data parsing**: Review browser console for extraction errors

### Empty Prevalence Classification
- All conditions will have High/Medium/Low based on percentage
- If no conditions show, check that diagnoses exist in database

## API Authentication

All endpoints require admin authentication via:
```
Authorization: Bearer {admin_token}
```

The token is stored in localStorage as `medai_admin_token` after admin login.

## Performance Optimization

- **Caching**: Results are cached client-side until "Refresh" is clicked
- **Pagination**: Limit parameter controls query size (default 10)
- **Indexing**: Database indexes on `diagnosis_type`, `created_at`, `risk_level`

For large datasets (>10,000 diagnoses), consider:
- Adding date range filters
- Pagination for trend data
- Asynchronous data loading

## Future Enhancements

Potential improvements:
- [ ] Time-range filtering (last 30 days, 90 days, etc.)
- [ ] Export conditions data to CSV/PDF
- [ ] Machine learning predictions for emerging conditions
- [ ] Condition correlation analysis
- [ ] Demographic-based condition breakdown
- [ ] Seasonal trend analysis
- [ ] Integration with external health databases

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify Supabase connection and data
3. Review Flask server logs
4. Ensure all diagnosis records have valid `result_data`

---

**Last Updated**: April 2026
**Version**: 1.0.0
