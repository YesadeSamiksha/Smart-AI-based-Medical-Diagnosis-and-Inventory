# 📋 MedAI Platform - Quick Reference Card

## 🔗 Essential URLs

| Purpose | URL | Credentials |
|---------|-----|-------------|
| **Supabase Dashboard** | https://app.supabase.com/project/ydhfwvlhwxhiivheepqo | Your Supabase account |
| **SQL Editor** | https://app.supabase.com/project/ydhfwvlhwxhiivheepqo/sql | - |
| **Auth Users** | https://app.supabase.com/project/ydhfwvlhwxhiivheepqo/auth/users | - |
| **Tables** | https://app.supabase.com/project/ydhfwvlhwxhiivheepqo/editor | - |
| **User Login** | login.html | Create via signup |
| **Admin Login** | login-admin.html | admin@medai.com / MedAI@Admin2024 |
| **Test Connection** | test-connection.html | - |

---

## 📂 File Quick Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| **START-HERE.md** | ⭐ **ACTION ITEMS** | Start with this! |
| **USER-GUIDE.md** | Complete setup guide | Step-by-step setup |
| **README.md** | Project documentation | General information |
| **FIX-RLS-POLICIES.sql** | 🚨 **CRITICAL** Database fix | Run first! |
| **test-connection.html** | Connection test | Verify setup |
| **admin-v2.html** | Admin dashboard | Main admin portal |
| **login.html** | User auth | User signup/login |
| **login-admin.html** | Admin auth | Admin login |

---

## 🗄️ Database Tables

| Table | Rows Expected | Purpose |
|-------|---------------|---------|
| **profiles** | 3+ | User profiles |
| **diagnosis_results** | 6-9+ | Health diagnoses |
| **inventory** | 10 | Medical supplies |
| **orders** | 0+ | User orders |
| **auto_reorders** | 0+ | AI auto-orders |

---

## 🎯 4-Step Setup Checklist

- [ ] **Step 1**: Run FIX-RLS-POLICIES.sql in Supabase
- [ ] **Step 2**: Add inventory data (10 items)
- [ ] **Step 3**: Create 3 test users
- [ ] **Step 4**: Each user performs 2-3 diagnoses

**After completing:** Admin dashboard will show real data!

---

## 🧪 Testing Commands

### Browser Console (F12)
```javascript
// Check Supabase connection
window.MedAISupabase.getSupabase()

// Check current user
await window.MedAIAuth.getCurrentUser()

// Test database query
const supabase = window.MedAISupabase.getSupabase();
const { data } = await supabase.from('profiles').select('*');
console.log(data);
```

### Supabase SQL Editor
```sql
-- Check user count
SELECT COUNT(*) FROM profiles;

-- Check diagnosis count
SELECT COUNT(*) FROM diagnosis_results;

-- Check inventory
SELECT * FROM inventory ORDER BY quantity ASC;

-- Check diagnoses by user
SELECT p.email, COUNT(d.id) as diagnoses
FROM profiles p
LEFT JOIN diagnosis_results d ON p.id = d.user_id
GROUP BY p.email;
```

---

## 🐛 Error Quick Fixes

| Error | Quick Fix |
|-------|-----------|
| "Infinite recursion" | Run FIX-RLS-POLICIES.sql |
| "No users found" | Create users via login.html |
| "No diagnosis data" | Login and perform diagnoses |
| "Connection failed" | Check supabase-config.js |
| "Login failed" | Clear cache, try incognito |
| "Charts blank" | Need data in database |

---

## 📊 Admin Dashboard Sections

| Tab | Shows | Requires |
|-----|-------|----------|
| **Overview** | Stats, charts | Users + diagnoses |
| **Users** | User list, analytics | Registered users |
| **Inventory** | Stock, AI agent | Inventory data |
| **Orders** | Order tracking | User orders |

---

## 🤖 AI Agent Settings

```javascript
// Default thresholds (in admin-v2.html)
LOW_STOCK_THRESHOLD = 10        // Reorder when below this
REORDER_QUANTITY = 50           // Normal reorder amount
URGENT_REORDER_QUANTITY = 100   // Urgent reorder amount
AI_CHECK_INTERVAL = 300000      // 5 minutes
```

**Enable**: Admin Dashboard → Inventory tab → Toggle AI Agent

---

## 🔑 Default Credentials

### Admin
- Email: `admin@medai.com`
- Password: `MedAI@Admin2024`

### Test Users (create these)
- User 1: `john@test.com` / `Test@123`
- User 2: `jane@test.com` / `Test@123`
- User 3: `bob@test.com` / `Test@123`

---

## 📈 Expected Data After Setup

| Metric | Expected Value |
|--------|----------------|
| Total Users | 3 |
| Total Diagnoses | 6-9 |
| Inventory Items | 10 |
| Orders | 0-2 |
| Low Stock Items | 1 (masks) |

---

## 🚀 Quick Start Flow

```
1. Run FIX-RLS-POLICIES.sql → Supabase SQL Editor
2. Add inventory → Supabase SQL Editor
3. Create users → login.html (signup)
4. Perform diagnoses → Login + BP/Diabetes pages
5. Access admin → login-admin.html
6. Verify data → All tabs should show numbers
```

**Time: 10-15 minutes**

---

## 🎨 UI Pages Overview

### User Pages
- `index.html` - Landing page
- `login.html` - Signup/Login
- `dashboard.html` - User dashboard
- `diagnosis-*.html` - Health assessments
- `shop.html` - Medical supplies
- `checkout.html` - Order placement
- `orders.html` - Order tracking

### Admin Pages
- `login-admin.html` - Admin login
- `admin-v2.html` - **Main admin portal**
- ~~`admin.html`~~ - Deprecated, don't use

---

## 💾 Backup & Restore

### Export Data
```sql
-- From Supabase SQL Editor
COPY profiles TO '/tmp/profiles.csv' WITH CSV HEADER;
COPY diagnosis_results TO '/tmp/diagnoses.csv' WITH CSV HEADER;
```

### Export from Admin
- Users tab → "Export CSV" button
- Downloads user data as CSV

---

## 🔔 Status Indicators

### Good Signs ✅
- test-connection.html shows all green
- Admin overview shows real numbers
- Users tab lists registered users
- Charts display data
- No console errors

### Bad Signs ❌
- "Infinite recursion" errors
- All zeros in admin dashboard
- "No users found"
- Blank charts
- Console errors

---

## 📞 Support Resources

| Issue Type | Resource |
|------------|----------|
| Setup help | [START-HERE.md](START-HERE.md) |
| Detailed guide | [USER-GUIDE.md](USER-GUIDE.md) |
| AI features | [AI-AGENT-FEATURES.md](AI-AGENT-FEATURES.md) |
| Database errors | Run test-connection.html |
| General info | [README.md](README.md) |

---

## 🎯 Success Criteria

Your setup is complete when:
- ✅ test-connection.html shows all green
- ✅ Admin overview displays real numbers
- ✅ User management shows 3+ users
- ✅ Charts render with data
- ✅ Inventory shows 10 items
- ✅ AI Agent can be enabled
- ✅ No console errors

---

**Print this for quick reference!**
