# Complete Setup & Testing Guide - MedAI Platform

## ⚠️ CRITICAL: Follow Every Step in Order

This guide ensures ALL features work correctly with real data from Supabase.

---

## Step 1: Database Setup (MUST DO FIRST)

### 1.1 Run the RLS Policy Fix
```sql
-- Open Supabase Dashboard → SQL Editor
-- Copy and paste FIX-RLS-POLICIES.sql and run it
```

**This fixes**:
- Infinite recursion errors
- User data not showing
- Diagnosis results not saving

### 1.2 Verify Tables Exist
```sql
-- Run this to check all tables:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Expected tables**:
- `profiles`
- `diagnosis_results`
- `inventory`
- `orders`
- `auto_reorders`

### 1.3 Add Sample Inventory (Initial Data)
```sql
-- Only if inventory is empty
INSERT INTO inventory (name, category, quantity, price, description)
VALUES
    ('Paracetamol 500mg', 'medicines', 150, 25.00, 'Pain relief and fever reducer'),
    ('Ibuprofen 400mg', 'medicines', 80, 45.00, 'Anti-inflammatory pain reliever'),
    ('Digital Thermometer', 'equipment', 25, 350.00, 'Accurate digital temperature measurement'),
    ('Blood Pressure Monitor', 'equipment', 12, 2500.00, 'Automatic digital BP monitor'),
    ('First Aid Kit', 'first-aid', 40, 450.00, 'Complete emergency first aid kit');
```

---

## Step 2: Create Test User (Real Registration)

### 2.1 Sign Up Process
1. Open `index.html` → Click "Get Started"
2. Or go to `login.html` directly
3. Click "Sign Up" tab
4. Fill in:
   - Full Name: **Test User**
   - Email: **test@example.com**
   - Password: **Test@123**
5. Click "Sign Up"

### 2.2 Verify User Created
```sql
-- Check in Supabase → Authentication → Users
-- Should see: test@example.com

-- Check profiles table:
SELECT * FROM profiles WHERE email = 'test@example.com';
-- Should return 1 row with id, email, full_name
```

### 2.3 Create More Test Users
Repeat Step 2.1 with:
- user1@test.com / User1@123
- user2@test.com / User2@123

---

## Step 3: Create Diagnosis Data (Real User Actions)

### 3.1 Login as Test User
1. Go to `login.html`
2. Login with **test@example.com** / **Test@123**
3. Should redirect to `dashboard.html`

### 3.2 Perform Blood Pressure Diagnosis
1. From dashboard → Click "BP Diagnosis"
2. Fill in:
   - Age: 35
   - Systolic: 140
   - Diastolic: 90
   - Heart Rate: 75
   - Height: 170
   - Weight: 70
3. Click "Analyze"
4. Wait for results
5. **IMPORTANT**: Check browser console - should see "✅ Diagnosis result saved"

### 3.3 Perform More Diagnoses
Repeat with different values:
- Low risk: Systolic 120, Diastolic 80
- High risk: Systolic 160, Diastolic 100

### 3.4 Verify Diagnosis Data Saved
```sql
-- Check diagnosis_results table:
SELECT * FROM diagnosis_results;
-- Should see entries with user_id, diagnosis_type='bp', risk_level
```

---

## Step 4: Admin Dashboard Setup

### 4.1 Create Admin User
```sql
-- Option 1: Promote existing user to admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'test@example.com';

-- Option 2: Create new admin account
-- First sign up via login.html with admin@medai.com
-- Then run:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@medai.com';
```

### 4.2 Login to Admin Dashboard
1. Go to `login-admin.html`
2. Login with **admin@medai.com** / **MedAI@Admin2024** (static credentials)
3. Should see admin dashboard

---

## Step 5: Test User Management in Admin Dashboard

### 5.1 Overview Section
- Should show:
  - Total Users: 2+ (number of registered users)
  - Total Diagnoses: 3+ (from Step 3)
  - Today's Diagnoses: 3+
  - High Risk Cases: depends on test data
  
- Charts should display:
  - Risk Distribution pie chart
  - Diagnosis Types bar chart

**If showing zeros**:
- Run `FIX-RLS-POLICIES.sql` again
- Check browser console for errors
- Verify data exists in Supabase tables

### 5.2 Users Section
Click "Users" tab:

**Should show**:
- User analytics cards:
  - Registered Users: 2+
  - Active Today: 1+
  - Users with Assessments: 1+
  - High Risk Users: depends on data

- User Activity Chart (last 7 days)

- Users table with:
  - Name
  - Email
  - Registered date
  - Assessments count
  - Last activity
  - Risk summary badges

**Testing**:
- Use search box to find user by name/email
- Use filter dropdown (All/High/Medium/Low/None)
- Click "View" button on any user
- Should open modal with:
  - User details
  - Total assessments
  - Most common diagnosis type
  - Health trend
  - Diagnosis history list

### 5.3 Orders Section
Click "Orders" tab:

**Should show**:
- Order statistics (if any orders placed)
- Orders table (empty if no orders yet)

**To test**:
1. Login as regular user
2. Go to shop.html
3. Add items to cart
4. Checkout and place order
5. Return to admin dashboard
6. Should see order in Orders section

### 5.4 Inventory Section
Click "Inventory" tab:

**Should show**:
- AI Agent panel (top)
- Inventory stats: Total Items, Total Stock, Low Stock, Out of Stock
- Inventory table with all items
- AI Activity Log

**Testing**:
- Enable AI Agent toggle
- Click "Run Now"
- Should analyze inventory
- Create auto-reorders for low stock items
- Check Activity Log for AI actions

---

## Step 6: End-to-End Testing

### 6.1 Complete User Flow
```
1. Register new user (login.html)
2. Login (redirects to dashboard.html)
3. Perform BP diagnosis (diagnosis-bp.html)
4. Perform Diabetes diagnosis (diagnosis-diabetes.html)
5. Check dashboard trends
6. Go to shop (shop.html)
7. Add items to cart
8. Checkout (checkout.html)
9. Place order
10. View orders (orders.html)
```

### 6.2 Admin Verification
```
1. Login to admin dashboard
2. Overview → See updated stats
3. Users → Find the new user
4. Users → Click View → See diagnosis history
5. Orders → See the placed order
6. Inventory → Verify stock deducted
7. AI Agent → Should detect low stock if any
```

---

## Common Issues & Solutions

### Issue 1: "No users found" in Admin Dashboard

**Cause**: RLS policies not fixed OR no users registered

**Solution**:
1. Run `FIX-RLS-POLICIES.sql`
2. Register at least one user via `login.html`
3. Verify in Supabase → Authentication → Users
4. Check `profiles` table has data

### Issue 2: "No diagnosis history" for users

**Cause**: Users haven't performed any diagnoses OR data not saving

**Solution**:
1. Login as user
2. Go to any diagnosis page (BP, Diabetes, Lung)
3. Fill form and submit
4. Check browser console - should see "✅ Diagnosis result saved"
5. If not, check RLS policies
6. Verify `diagnosis_results` table in Supabase

### Issue 3: "Infinite recursion" errors in console

**Cause**: Old RLS policies with circular references

**Solution**:
1. **MUST** run `FIX-RLS-POLICIES.sql`
2. Refresh browser completely (Ctrl+Shift+R)
3. Clear browser cache if needed

### Issue 4: User data not showing even after registration

**Cause**: RLS policies blocking SELECT

**Solution**:
```sql
-- Check policies allow SELECT:
SELECT * FROM profiles;
-- Should work without errors

-- If error, re-run FIX-RLS-POLICIES.sql
```

### Issue 5: Inventory not deducting after order

**Cause**: RLS policy or code issue

**Solution**:
1. Check browser console during checkout
2. Should see stock update operations
3. Verify RLS allows authenticated users to UPDATE inventory
4. Check `FIX-RLS-POLICIES.sql` was run

---

## Verification Checklist

After following all steps, verify:

- [ ] RLS policies fixed (no infinite recursion errors)
- [ ] At least 2 test users registered
- [ ] Each user has 2+ diagnosis results
- [ ] Admin dashboard shows correct user count
- [ ] Admin can view user details
- [ ] User diagnosis history visible in admin panel
- [ ] Charts display real data (not placeholders)
- [ ] Inventory loads properly
- [ ] Orders can be placed by users
- [ ] Admin can see all orders
- [ ] Inventory quantity reduces after orders
- [ ] AI Agent can be enabled
- [ ] AI creates auto-reorders for low stock

---

## Database Verification Queries

Run these in Supabase SQL Editor:

```sql
-- Check user count
SELECT COUNT(*) as total_users FROM profiles;

-- Check diagnosis count
SELECT COUNT(*) as total_diagnoses FROM diagnosis_results;

-- Check diagnoses by type
SELECT diagnosis_type, COUNT(*) as count 
FROM diagnosis_results 
GROUP BY diagnosis_type;

-- Check users with diagnosis count
SELECT 
    p.email, 
    p.full_name,
    COUNT(d.id) as diagnosis_count
FROM profiles p
LEFT JOIN diagnosis_results d ON p.id = d.user_id
GROUP BY p.id, p.email, p.full_name
ORDER BY diagnosis_count DESC;

-- Check inventory levels
SELECT name, quantity, 
    CASE 
        WHEN quantity = 0 THEN 'OUT OF STOCK'
        WHEN quantity < 10 THEN 'LOW STOCK'
        ELSE 'OK'
    END as status
FROM inventory
ORDER BY quantity ASC;

-- Check orders
SELECT COUNT(*) as total_orders, 
       SUM(total) as total_revenue
FROM orders;

-- Check AI auto-reorders
SELECT * FROM auto_reorders 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Support

If issues persist:

1. Check browser console for errors
2. Check Supabase logs
3. Verify all scripts loaded: `supabase-config.js`, `auth.js`, `database.js`
4. Ensure Supabase URL and keys are correct in `.env` and `supabase-config.js`
5. Try in incognito window (clears cache)

---

**Last Updated**: 2026-04-08  
**Version**: 2.0  
**Status**: ✅ Complete Step-by-Step Guide
