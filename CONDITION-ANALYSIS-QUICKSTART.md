# Quick Start: Most Common Conditions Analysis

## 5-Minute Setup

### Step 1: Verify Files Are in Place ✅

Check that these new files exist:
- ✅ `trends-analysis.js` - Analysis module
- ✅ `test_condition_analysis.py` - Test script
- ✅ `CONDITION-ANALYSIS-GUIDE.md` - Full documentation
- ✅ `IMPLEMENTATION-SUMMARY.md` - Implementation details

### Step 2: Start Your Server 🚀

```bash
# Terminal 1: Run Flask server
python app_flask_v2.py

# You should see:
# ✅ Gemini AI: ✅ Ready
# ✅ Supabase: ✅ Connected
# 🌐 Server: http://localhost:5000
```

### Step 3: Access Admin Dashboard 🔐

1. Open: `http://localhost:8080/admin-v2.html`
2. Login with:
   - Email: `admin@medai.com`
   - Password: `MedAI@Admin2024`

### Step 4: View Condition Analysis 📊

1. Click **"Trends & Predictions"** tab
2. Click **"Refresh Analysis"** button
3. You should see:
   - ✅ Most Common Conditions chart
   - ✅ Top Conditions breakdown list
   - ✅ Condition Trends line chart
   - ✅ Risk Distribution by Condition

---

## What You'll See

### Common Conditions Chart
Shows top 10 medical conditions from your user database:
- Ranked by frequency
- Color-coded by prevalence (High=Red, Medium=Orange, Low=Green)
- Real data from actual user diagnoses

**Example:**
```
Hypertension: 45 cases (25%) - High Prevalence
Diabetes: 32 cases (18%) - High Prevalence
Asthma: 18 cases (10%) - Medium Prevalence
```

### Condition Trends
Shows how conditions change over time:
- Helps identify emerging health patterns
- Multiple conditions tracked simultaneously
- Useful for public health planning

### Risk Analysis
For the most common condition:
- 20% Low Risk
- 40% Medium Risk
- 30% High Risk
- 10% Critical

---

## Test It Works (Optional)

```bash
# Get your admin token first
# 1. Login to admin dashboard
# 2. Open browser console (F12)
# 3. Type: localStorage.getItem('medai_admin_token')
# 4. Copy the token

# Then run test:
python test_condition_analysis.py "paste-your-token-here"
```

Expected output:
```
✅ Status: 200
✅ Top condition: Hypertension
✅ Total diagnoses: 180
✅ Unique conditions: 42

Top conditions:
1. Hypertension: 45 cases (25.0%) - High
2. Diabetes: 32 cases (17.8%) - High
3. Asthma: 18 cases (10.0%) - Medium

✅ All tests passed!
```

---

## How It Works (Simple Explanation)

1. **User completes diagnosis** → Result stored in database
2. **Admin views dashboard** → "Refresh Analysis" is clicked
3. **System analyzes database** → Finds all conditions from diagnoses
4. **Conditions are ranked** → By how many users have them
5. **Charts are displayed** → Visual representation of conditions

**No manual setup needed!** It automatically fetches from your Supabase database.

---

## Data Sources

All data comes from your Supabase tables:

| Table | Field | Used For |
|-------|-------|----------|
| `diagnosis_results` | `result_data` | Extract conditions |
| `diagnosis_results` | `diagnosis_type` | Disease type classification |
| `diagnosis_results` | `risk_level` | Risk analysis |
| `diagnosis_results` | `created_at` | Timeline/trends |

---

## Customization

Want to adjust what's displayed?

### Show Different Number of Conditions

In `admin-v2.html`, line ~869:
```javascript
const conditionData = await loadCommonConditionsFromDB(10);  // Change 10 to 20
```

### Filter by Diagnosis Type

```bash
# Only diabetes conditions:
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/admin/common-conditions?type=diabetes"

# Supported types: diabetes, lung, bp, symptoms
```

### Change Chart Colors

Edit `trends-analysis.js`:
```javascript
const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
// Change these hex codes to your preferred colors
```

---

## Real-World Examples

### Example 1: You have 180 diagnoses in database
```
Most Common Conditions Report:
1. Hypertension - 45 cases (25%)
2. Diabetes - 32 cases (18%)
3. Asthma - 18 cases (10%)
...
```
**Use Case**: Order more blood pressure monitoring equipment and hypertension medications

### Example 2: You notice trend change
```
Last Month: Diabetes was #2 condition
This Month: Asthma is now #2 condition
```
**Use Case**: Something environmental changed (season, air quality, etc.)

### Example 3: Risk analysis shows
```
For Hypertension:
- 60% are High or Critical Risk
```
**Use Case**: Develop urgent intervention program for hypertension patients

---

## Keyboard Shortcuts

In Admin Dashboard:

| Action | Method |
|--------|--------|
| Refresh data | Click "Refresh Analysis" button |
| View raw API response | Open browser Network tab (F12) |
| Get admin token | Console: `localStorage.getItem('medai_admin_token')` |
| Clear cache | Close and reopen dashboard |

---

## Common Questions

### Q: Where does the condition data come from?
**A:** Your Supabase `diagnosis_results` table. Each time a user completes a health assessment, the results are stored and analyzed.

### Q: Is this real data or dummy data?
**A:** 100% real data from your users. No dummy data used.

### Q: What if I have no conditions showing?
**A:** You probably have no user diagnoses yet. Create a test diagnosis:
1. Go to `http://localhost:8080/symptom-checker.html`
2. Select some symptoms
3. Click "Analyze Symptoms"
4. Return to admin dashboard and refresh

### Q: Can I export the data?
**A:** Use the browser DevTools Console to get JSON:
```javascript
// In browser console (F12):
const token = localStorage.getItem('medai_admin_token');
const response = await fetch('http://localhost:5000/api/admin/common-conditions', 
  {headers: {'Authorization': `Bearer ${token}`}});
const data = await response.json();
console.log(JSON.stringify(data, null, 2));
```

### Q: How often does data update?
**A:** Click "Refresh Analysis" to update anytime. Data is real-time from the database.

### Q: Can I compare time periods?
**A:** The trends chart shows time-based data. For custom ranges, see the "Future Enhancements" section in IMPLEMENTATION-SUMMARY.md.

---

## Troubleshooting Checklist

- [ ] Flask server is running (`python app_flask_v2.py`)
- [ ] You're logged in as admin
- [ ] Supabase is connected (check dashboard status)
- [ ] Database has diagnosis records (> 0 rows in diagnosis_results)
- [ ] Browser console has no errors (F12)
- [ ] You clicked "Refresh Analysis" button
- [ ] Network requests show 200 status (F12 Network tab)

---

## Next Steps

1. **Create test diagnoses** to see real data in action
   - Use symptom checker
   - Complete diabetes, lung, and blood pressure assessments

2. **Monitor trends** to understand your user base
   - Check back weekly to see patterns
   - Identify seasonal health variations

3. **Use insights** for planning
   - Stock medicines based on condition prevalence
   - Design educational programs for common conditions
   - Allocate diagnostic resources efficiently

4. **Read full documentation** for advanced features
   - See CONDITION-ANALYSIS-GUIDE.md
   - See IMPLEMENTATION-SUMMARY.md

---

## Support

Having issues?

1. **Check server is running**
   ```bash
   curl http://localhost:5000/api/health
   # Should return: {"status": "healthy", ...}
   ```

2. **Check Supabase connection**
   - Admin dashboard → Overview tab
   - Should show Supabase status: ✅ Connected

3. **Look at error logs**
   - Browser console: F12 → Console tab
   - Server logs: Check terminal where Flask is running

4. **Run test script**
   ```bash
   python test_condition_analysis.py "your-admin-token"
   ```

---

## Summary

✅ **Real condition analysis** from actual user data
✅ **No setup required** - works with existing database
✅ **Visual dashboard** with 4 new charts
✅ **API endpoints** for programmatic access
✅ **Test script** included for verification

**You're all set! Go to your admin dashboard and click "Trends & Predictions" to see it in action.**

---

📖 For more details, see:
- Full Guide: `CONDITION-ANALYSIS-GUIDE.md`
- Implementation: `IMPLEMENTATION-SUMMARY.md`
- API Reference: `app_flask_v2.py` (lines 627-860)

**Version**: 1.0.0 | **Last Updated**: April 2026
