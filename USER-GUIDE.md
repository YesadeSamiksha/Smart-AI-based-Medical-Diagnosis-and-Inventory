# MedAI Platform - Complete User Guide

## 📋 Quick Summary

**The Issue**: User management in admin dashboard shows no data because:
1. RLS policies need to be fixed (run `FIX-RLS-POLICIES.sql`)
2. No actual users have registered yet
3. No diagnosis data exists in the database

**The Solution**: Follow the 5 steps below to get everything working

---

## 🚀 Step 1: Fix RLS Policies (CRITICAL)

### What is this?
RLS (Row Level Security) policies control who can read/write data. Without fixing them, you'll get "infinite recursion" errors and no data will load.

### How to fix:
1. Open Supabase Dashboard: https://app.supabase.com/project/ydhfwvlhwxhiivheepqo
2. Click "SQL Editor" in the left sidebar
3. Click "+ New Query"
4. Open the file `FIX-RLS-POLICIES.sql` in this project
5. Copy ALL the SQL code
6. Paste it into Supabase SQL Editor
7. Click "Run" (bottom right)
8. Should see "Success. No rows returned"

**✅ Test**: Open `test-connection.html` in browser
- Should show ✅ green checkmarks
- If you see "infinite recursion" → RLS not fixed yet

---

## 🚀 Step 2: Add Inventory Data

### Why?
The shop and admin inventory sections need products to display.

### How to add:
1. In Supabase SQL Editor, run:

```sql
INSERT INTO inventory (name, category, quantity, price, description)
VALUES
    ('Paracetamol 500mg', 'medicines', 150, 25.00, 'Pain relief and fever reducer'),
    ('Ibuprofen 400mg', 'medicines', 80, 45.00, 'Anti-inflammatory pain reliever'),
    ('Digital Thermometer', 'equipment', 25, 350.00, 'Accurate digital temperature measurement'),
    ('Blood Pressure Monitor', 'equipment', 12, 2500.00, 'Automatic digital BP monitor'),
    ('First Aid Kit', 'first-aid', 40, 450.00, 'Complete emergency first aid kit'),
    ('Bandages (Pack of 10)', 'supplies', 200, 75.00, 'Sterile adhesive bandages'),
    ('Hand Sanitizer 500ml', 'supplies', 120, 120.00, 'Antibacterial hand sanitizer'),
    ('Vitamin C Tablets', 'vitamins', 90, 180.00, 'Immune system support'),
    ('Vitamin D3 Capsules', 'vitamins', 65, 250.00, 'Bone health supplement'),
    ('Surgical Mask (Box of 50)', 'supplies', 5, 400.00, '3-ply disposable masks');
```

**✅ Test**: Open `shop.html`
- Should see 10 products
- Can add to cart

---

## 🚀 Step 3: Create Test Users

### Why?
Admin dashboard needs users to display. Currently there are ZERO users.

### How to register:

#### Create User 1:
1. Open `login.html` in browser
2. Click "Sign Up" tab
3. Fill in:
   - Full Name: **John Doe**
   - Email: **john@test.com**
   - Password: **Test@123**
4. Click "Sign Up"
5. Should redirect to dashboard

#### Create User 2:
1. Logout (if logged in)
2. Open `login.html` again
3. Sign up with:
   - Full Name: **Jane Smith**
   - Email: **jane@test.com**
   - Password: **Test@123**

#### Create User 3:
1. Repeat with:
   - Full Name: **Bob Wilson**
   - Email: **bob@test.com**
   - Password: **Test@123**

**✅ Test**: Check Supabase
- Go to: https://app.supabase.com/project/ydhfwvlhwxhiivheepqo/auth/users
- Should see 3 users

---

## 🚀 Step 4: Create Diagnosis Data

### Why?
Admin dashboard shows diagnosis statistics. Currently there are ZERO diagnoses.

### How to create diagnoses:

#### For User 1 (John):
1. Login as **john@test.com** / **Test@123**
2. From dashboard, click "BP Diagnosis"
3. Fill in:
   - Age: **35**
   - Systolic BP: **140**
   - Diastolic BP: **90**
   - Heart Rate: **75**
   - Height: **170**
   - Weight: **70**
4. Click "Analyze"
5. Wait for results
6. Check console - should see "✅ Diagnosis result saved"

7. Go back to dashboard, click "Diabetes Diagnosis"
8. Fill in:
   - Age: **35**
   - BMI: **25**
   - Blood Glucose: **140**
   - Blood Pressure: **140/90**
   - Skin Thickness: **30**
   - Insulin: **150**
9. Click "Analyze"
10. Check console - should see "✅ Diagnosis result saved"

#### For User 2 (Jane):
1. Logout, login as **jane@test.com**
2. Do BP Diagnosis with different values:
   - Systolic: **160** (High risk)
   - Diastolic: **100**
3. Do Diabetes Diagnosis
4. Do Lung Cancer Diagnosis

#### For User 3 (Bob):
1. Logout, login as **bob@test.com**
2. Do BP Diagnosis with low risk:
   - Systolic: **120**
   - Diastolic: **80**
3. Do one more diagnosis

**✅ Test**: Check Supabase
- Go to: https://app.supabase.com/project/ydhfwvlhwxhiivheepqo/editor/28556
- Select `diagnosis_results` table
- Should see ~6-9 diagnosis records

---

## 🚀 Step 5: Test Admin Dashboard

### How to access:
1. Open `login-admin.html`
2. Login with:
   - Email: **admin@medai.com**
   - Password: **MedAI@Admin2024**
3. Should see admin dashboard

### What you should see:

#### **Overview Tab** (default):
- **Total Users**: 3
- **Total Diagnoses**: 6-9 (depending on Step 4)
- **Today's Diagnoses**: 6-9
- **High Risk Cases**: 1-3 (depends on data)
- **Risk Distribution Chart**: Pie chart with high/medium/low
- **Diagnosis Types Chart**: Bar chart showing bp/diabetes/lung counts

#### **Users Tab**:
- **Analytics Cards**:
  - Registered Users: 3
  - Active Today: 3
  - Users with Assessments: 3
  - High Risk Users: 1-3
- **User Activity Chart**: Shows last 7 days of activity
- **Users Table**: 
  - Lists all 3 users
  - Shows name, email, registration date
  - Shows number of assessments (2-3 each)
  - Shows risk badges (High/Medium/Low)
- **View Button**: Click on any user
  - Opens modal with user details
  - Shows diagnosis history
  - Shows health trends

#### **Inventory Tab**:
- **AI Agent Panel**: Can enable/disable
- **Inventory Stats**: 
  - Total Items: 10
  - Total Stock: 777 units
  - Low Stock: 1 (masks at 5 units)
  - Out of Stock: 0
- **Inventory Table**: Shows all 10 products
- **Add Item Form**: Can add new products
- **Edit/Delete**: Can manage items
- **AI Activity Log**: Shows AI auto-order actions

#### **Orders Tab**:
- Initially empty (no orders placed yet)
- To test:
  1. Logout from admin
  2. Login as regular user
  3. Go to `shop.html`
  4. Add items to cart
  5. Checkout and place order
  6. Return to admin dashboard
  7. Should see order in Orders tab

---

## 🧪 Verification Checklist

Run these checks to confirm everything works:

### ✅ RLS Policies Fixed
```
1. Open test-connection.html
2. Should show all green checkmarks
3. No "infinite recursion" errors
```

### ✅ Inventory Loaded
```
1. Open shop.html
2. Should see 10 products
3. Can add to cart
```

### ✅ Users Created
```
1. Open Supabase → Authentication → Users
2. Should see 3 users
3. Check profiles table has 3 rows
```

### ✅ Diagnoses Created
```
1. Open Supabase → Table Editor → diagnosis_results
2. Should see 6-9 rows
3. Check user_id matches user IDs from profiles table
```

### ✅ Admin Dashboard Working
```
1. Login to admin dashboard
2. Overview shows real numbers (not zeros)
3. Charts display data
4. Users tab shows 3 users
5. Can click View on any user
6. User detail modal shows diagnosis history
7. Inventory tab shows 10 items
8. AI Agent can be enabled
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Infinite recursion detected"
**Cause**: RLS policies not fixed  
**Solution**: Run `FIX-RLS-POLICIES.sql` in Supabase SQL Editor

### Issue 2: Admin dashboard shows all zeros
**Cause**: No users or diagnoses in database  
**Solution**: Complete Steps 3 and 4 above

### Issue 3: "No users found" in Users tab
**Cause**: RLS policies OR no users registered  
**Solution**: 
1. Check `test-connection.html` - if errors, fix RLS
2. If no errors, register users via `login.html`

### Issue 4: User modal shows "No diagnosis history"
**Cause**: User hasn't performed any diagnoses  
**Solution**: Login as that user and do BP/Diabetes diagnoses

### Issue 5: Inventory not showing
**Cause**: No inventory data in database  
**Solution**: Run inventory INSERT SQL from Step 2

### Issue 6: Can't login to admin dashboard
**Cause**: Using wrong credentials  
**Solution**: Use exactly: `admin@medai.com` / `MedAI@Admin2024`

### Issue 7: Diagnosis not saving
**Cause**: RLS policies OR Supabase connection issue  
**Solution**:
1. Check browser console for errors
2. Verify Supabase URL/key in `supabase-config.js`
3. Run `test-connection.html` to verify connection

---

## 📊 Expected Data After Setup

### Users Table (profiles):
```
| ID   | Email          | Full Name   | Role | Created At |
|------|----------------|-------------|------|------------|
| uuid | john@test.com  | John Doe    | user | 2024-02-06 |
| uuid | jane@test.com  | Jane Smith  | user | 2024-02-06 |
| uuid | bob@test.com   | Bob Wilson  | user | 2024-02-06 |
```

### Diagnosis Results Table:
```
| User          | Type     | Risk   | Created At |
|---------------|----------|--------|------------|
| John Doe      | bp       | Medium | 2024-02-06 |
| John Doe      | diabetes | Medium | 2024-02-06 |
| Jane Smith    | bp       | High   | 2024-02-06 |
| Jane Smith    | diabetes | Medium | 2024-02-06 |
| Jane Smith    | lung     | Low    | 2024-02-06 |
| Bob Wilson    | bp       | Low    | 2024-02-06 |
```

### Inventory Table:
```
| Name                  | Category  | Quantity | Price   |
|-----------------------|-----------|----------|---------|
| Paracetamol 500mg     | medicines | 150      | 25.00   |
| Ibuprofen 400mg       | medicines | 80       | 45.00   |
| Digital Thermometer   | equipment | 25       | 350.00  |
| ... (7 more items)    | ...       | ...      | ...     |
```

---

## 🎯 Final Testing Flow

Complete end-to-end test:

```
1. Fix RLS → Run FIX-RLS-POLICIES.sql
2. Add Inventory → Run INSERT SQL
3. Create 3 users → Via login.html
4. Each user does 2-3 diagnoses
5. One user places an order
6. Login to admin dashboard
7. Verify all sections show real data
8. Charts display correctly
9. User details accessible
10. Orders tracked
11. AI Agent functional
```

**Success Criteria**:
- ✅ No console errors
- ✅ Admin overview shows real numbers
- ✅ Users table populated
- ✅ Charts render with data
- ✅ User details show diagnosis history
- ✅ Inventory shows 10 items
- ✅ Orders tracked after purchase
- ✅ AI Agent can monitor inventory

---

## 📞 Support Files

If you encounter issues, check these files:

1. **COMPLETE-SETUP-GUIDE.md** - Detailed step-by-step instructions
2. **test-connection.html** - Quick database connection test
3. **test-platform.js** - Console diagnostic script
4. **FIX-RLS-POLICIES.sql** - Critical RLS policy fixes
5. **AI-AGENT-FEATURES.md** - AI Agent documentation
6. **ORDER-TRACKING-SETUP.md** - Order tracking setup

---

**Last Updated**: 2024-02-06  
**Version**: 3.0  
**Status**: ✅ Production Ready (after following all 5 steps)
