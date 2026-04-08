# Supabase Integration Setup Guide

## 🔧 Quick Setup

### Step 1: Run the Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ydhfwvlhwxhiivheepqo
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase-schema.sql` and paste it
5. Click **Run** to create all tables, policies, and triggers

### Step 2: Verify Tables Created

In your Supabase dashboard, go to **Table Editor** and verify these tables exist:
- `profiles` - User profiles
- `diagnosis_results` - Diagnosis history
- `inventory` - Medical inventory items

### Step 3: Create an Admin User

1. Register a new user through the app (login.html)
2. Go to Supabase SQL Editor and run:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### Step 4: (Optional) Add Sample Inventory Data

Run this in SQL Editor to populate inventory:
```sql
INSERT INTO inventory (name, category, quantity, unit, min_stock, status) VALUES
    ('Insulin (Novolog)', 'Medication', 145, 'vials', 20, 'high'),
    ('Blood Pressure Monitor', 'Equipment', 8, 'units', 10, 'low'),
    ('Glucose Test Strips', 'Supplies', 500, 'strips', 100, 'high'),
    ('Surgical Gloves (M)', 'PPE', 2500, 'pairs', 500, 'high'),
    ('Face Masks (N95)', 'PPE', 15, 'boxes', 20, 'low'),
    ('Stethoscope', 'Equipment', 12, 'units', 5, 'medium'),
    ('Thermometer (Digital)', 'Equipment', 25, 'units', 10, 'medium'),
    ('Bandages (Assorted)', 'Supplies', 300, 'boxes', 50, 'high'),
    ('Syringes (10mL)', 'Supplies', 450, 'units', 100, 'high'),
    ('CT Scan Contrast Dye', 'Medication', 5, 'bottles', 10, 'low'),
    ('Oxygen Cylinders', 'Equipment', 18, 'tanks', 10, 'medium'),
    ('IV Drip Sets', 'Supplies', 200, 'sets', 50, 'high'),
    ('Antibiotics (Amoxicillin)', 'Medication', 75, 'bottles', 30, 'medium'),
    ('ECG Electrodes', 'Supplies', 1000, 'pads', 200, 'high'),
    ('Wheelchair', 'Equipment', 4, 'units', 5, 'low');
```

---

## 📁 Files Added/Modified

### New Files Created:
| File | Description |
|------|-------------|
| `supabase-config.js` | Supabase client configuration |
| `auth.js` | Authentication functions (signup, login, logout) |
| `database.js` | Diagnosis results CRUD operations |
| `inventory-db.js` | Inventory management functions |
| `supabase-schema.sql` | Database schema (run in Supabase) |

### Modified Files:
| File | Changes |
|------|---------|
| `login.html` | Now uses Supabase Auth for login/signup |
| `login-admin.html` | Admin authentication with role checking |
| `dashboard.html` | Loads real user data and diagnosis history |
| `diagnosis-diabetes.html` | Saves results to Supabase |
| `diagnosis-bp.html` | Saves results to Supabase |
| `diagnosis-lung.html` | Saves results to Supabase |
| `symptom-checker.html` | Saves results to Supabase |
| `inventory.html` | Full CRUD with Supabase |
| `admin.html` | Real statistics from database |

---

## 🗄️ Database Schema

### Tables

#### 1. profiles
```sql
- id (uuid, PK, references auth.users)
- email (text, unique)
- full_name (text)
- avatar_url (text)
- role (text: 'user' or 'admin')
- created_at (timestamp)
- updated_at (timestamp)
```

#### 2. diagnosis_results
```sql
- id (uuid, PK)
- user_id (uuid, FK → profiles)
- diagnosis_type (text: 'diabetes', 'lung', 'bp', 'symptoms')
- input_data (jsonb)
- result_data (jsonb)
- risk_level (text: 'low', 'medium', 'high', 'critical')
- created_at (timestamp)
```

#### 3. inventory
```sql
- id (uuid, PK)
- name (text)
- category (text)
- quantity (integer)
- unit (text)
- min_stock (integer)
- status (text: 'low', 'medium', 'high')
- updated_at (timestamp)
- updated_by (uuid, FK → profiles)
```

---

## 🔐 Security (Row Level Security)

All tables have RLS enabled with these policies:

### Profiles:
- Users can view/update their own profile
- Admins can view all profiles

### Diagnosis Results:
- Users can view/create/delete their own results
- Admins can view all results

### Inventory:
- All authenticated users can view
- Only admins can add/update/delete items

---

## 🚀 Running the Application

1. **Start a local server:**
   ```bash
   npm install
   npm run dev
   ```
   Or simply open `index.html` in a browser

2. **Test User Flow:**
   - Go to `login.html`
   - Create a new account (Sign Up)
   - Check your email for confirmation (if enabled in Supabase)
   - Login and run diagnosis tests
   - View history in dashboard

3. **Test Admin Flow:**
   - Create an admin user (see Step 3 above)
   - Go to `login-admin.html`
   - Login with admin credentials
   - View statistics and manage inventory

---

## 🔧 Troubleshooting

### "Supabase not initialized" error
- Check that `supabase-config.js` is loaded before other modules
- Verify the anon key is correct

### Login not working
- Check Supabase Auth settings
- Ensure email confirmation is disabled (for testing)
- Check browser console for errors

### No data showing up
- Make sure you ran `supabase-schema.sql`
- Check RLS policies are set correctly
- Verify user has proper permissions

### Admin access denied
- Run the SQL to set `role = 'admin'` for your user
- Clear localStorage and login again

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for error messages
2. Verify Supabase dashboard for API logs
3. Ensure all tables and policies are created

---

## 🎉 Features Now Working

✅ User registration with Supabase Auth  
✅ User login/logout  
✅ Admin authentication with role verification  
✅ Diabetes risk assessment (saved to database)  
✅ Blood pressure analysis (saved to database)  
✅ Lung cancer screening (saved to database)  
✅ Symptom checker (saved to database)  
✅ Diagnosis history in dashboard  
✅ Inventory management (CRUD)  
✅ Admin statistics from real data  
✅ Recent activity feed  
