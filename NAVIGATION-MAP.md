# MedAI - Complete Navigation & Feature Map

## 🗺️ Site Structure

```
┌─────────────────────────────────────────────────┐
│                  INDEX.HTML                      │
│         (Landing Page + Ballpit Hero)            │
│                                                  │
│  [Get Started] [Voice Control] [Features]       │
└────────┬─────────────────────────┬───────────────┘
         │                         │
         ▼                         ▼
    LOGIN PAGES              NAVIGATION
         │                         │
    ┌────┴────┐              ┌────┴────┐
    │         │              │         │
    ▼         ▼              ▼         ▼
┌─────┐  ┌─────────┐    FEATURES  CONTACT
│USER │  │  ADMIN  │
└──┬──┘  └────┬────┘
   │          │
   ▼          ▼
DASHBOARD  ADMIN PANEL
   │          │
   │          ├─→ User Management
   │          ├─→ Inventory
   │          └─→ Analytics
   │
   ├─→ Diabetes Assessment
   ├─→ Lung Cancer Screening
   ├─→ Blood Pressure Analysis
   └─→ Symptom Checker
```

---

## 📄 Page Breakdown

### 1. INDEX.HTML - Landing Page
**Purpose**: Welcome visitors, showcase features
**Features**:
- ⚡ Ballpit animation (150 3D spheres)
- 🧭 Pill navigation with GSAP
- 💡 Spotlight card effects
- 🎤 Voice control integration
- 📱 Mobile-responsive design
- 🤖 Floating AI assistant buttons

**Links To**:
- login.html (Get Started)
- #features (Features section)
- #about (About section)
- #contact (Contact section)

**Special Effects**:
- Three.js ballpit background
- GSAP pill animations
- CSS spotlight on hover
- 3D button push effects

---

### 2. LOGIN.HTML - User Authentication
**Purpose**: User login and signup
**Theme**: Purple/Indigo
**Features**:
- 📧 Email/password login
- 🆕 New user signup
- 🔄 Tab switching (Login ↔ Signup)
- 👁️ Password visibility toggle
- 🌐 Social login buttons (Google, Facebook)
- 🔗 Link to admin portal

**Form Fields**:
**Login**: Email, Password, Remember Me
**Signup**: Name, Email, Password, Confirm Password, Terms

**Redirects To**:
- dashboard.html (on success)
- login-admin.html (admin link)

**Demo Mode**:
- Any email/password works
- Creates localStorage session

---

### 3. LOGIN-ADMIN.HTML - Admin Portal
**Purpose**: Administrator authentication
**Theme**: Red/Danger
**Features**:
- 🛡️ Admin badge display
- 🔐 Secure access notice
- 📊 Login monitoring warning
- 👁️ Password visibility toggle
- ✅ Remember me option
- 🔗 Link to user login

**Credentials**:
```
Email: admin@medai.com
Password: admin123
```

**Redirects To**:
- admin.html (on success)
- Blocks non-admin access

**Security**:
- Role validation
- Session tracking
- Access logging notice

---

### 4. DASHBOARD.HTML - User Dashboard
**Purpose**: Main user hub after login
**Access**: Users only (auth required)
**Features**:
- 👋 Personalized welcome
- 📊 Health metrics overview
- 🩺 Quick diagnosis access
- 📅 Appointment tracking
- 📝 Medical history
- ⚙️ Profile settings

**Navigation To**:
- diagnosis-diabetes.html
- diagnosis-lung.html
- diagnosis-bp.html
- symptom-checker.html
- Profile page
- Logout

**Sidebar Menu**:
- Dashboard (home)
- Diagnoses
- My Reports
- Appointments
- Profile
- Settings
- Logout

---

### 5. ADMIN.HTML - Admin Panel
**Purpose**: Platform administration
**Access**: Admins only (role check)
**Features**:
- 📈 Usage statistics charts
- 👥 User count: 2,847
- 🧪 Diagnoses: 15,392
- ⏱️ System uptime: 98.2%
- 📦 Inventory items: 247
- 📊 Chart.js visualizations
- 🔔 Recent activity feed

**Quick Actions**:
- Manage Inventory → inventory.html
- User Management (modal)
- View Reports (charts)
- System Settings (config)
- Backup Data (export)
- View Logs (monitoring)

**Charts**:
- Platform Usage (line chart)
- Diabetes/Lung/BP trends
- 7-day activity graph

---

### 6. DIAGNOSIS-DIABETES.HTML
**Purpose**: Diabetes risk assessment
**Access**: Auth required
**Features**:
- 📝 8 health metric inputs:
  1. Glucose Level (mg/dL)
  2. BMI (Body Mass Index)
  3. Age (years)
  4. Insulin Level (μU/mL)
  5. Blood Pressure (mm Hg)
  6. Skin Thickness (mm)
  7. Pregnancies (count)
  8. Diabetes Pedigree Function

**Output**:
- 🎯 Risk Level (Low/Medium/High)
- 📊 Color-coded results
- 💊 Personalized recommendations
- ⚠️ Action items based on risk

**Algorithm**:
- Points-based scoring
- Threshold-based classification
- Medical guideline compliance

---

### 7. DIAGNOSIS-LUNG.HTML
**Purpose**: Lung cancer risk screening
**Access**: Auth required
**Features**:
- 📤 CT scan upload (DICOM/JPG/PNG)
- 📝 Questionnaire:
  - Age
  - Smoking history
  - Pack years
  - Chronic cough
  - Chest pain
  - Shortness of breath
  - Weight loss
  - Family history

**Output**:
- 🎯 Risk assessment
- 📋 Recommendations
- 🚨 Urgency indicators
- 🏥 Next steps guidance

---

### 8. DIAGNOSIS-BP.HTML
**Purpose**: Blood pressure analysis
**Access**: Auth required
**Features**:
- 📊 Systolic/Diastolic input
- ❤️ Heart rate measurement
- 📈 Chart.js visualization
- 🏃 Activity level consideration
- 💊 Medication tracking

**AHA Categories**:
- Normal: <120 / <80
- Elevated: 120-129 / <80
- Hypertension Stage 1: 130-139 / 80-89
- Hypertension Stage 2: ≥140 / ≥90
- Hypertensive Crisis: ≥180 / ≥120

**Chart**:
- Bar chart comparison
- Your reading vs normal
- Color-coded results

---

### 9. SYMPTOM-CHECKER.HTML
**Purpose**: AI-powered symptom analysis
**Access**: Auth required
**Features**:
- 25+ symptoms across 5 categories:
  1. General (fever, fatigue, weight loss)
  2. Respiratory (cough, shortness of breath)
  3. Digestive (nausea, vomiting, diarrhea)
  4. Neurological (headache, dizziness)
  5. Cardiovascular (palpitations, chest pain)

**Conditions Database**:
- Common Cold
- Influenza
- COVID-19
- Pneumonia
- Migraine
- Gastroenteritis
- Hypertension
- Asthma
- Heart Arrhythmia
- Anxiety Disorder

**Output**:
- 🎯 Match percentage
- 📋 Possible conditions
- ⚠️ Medical disclaimer
- 🏥 Recommendation to see doctor

---

### 10. INVENTORY.HTML
**Purpose**: Medical inventory management
**Access**: Admin only
**Features**:
- 📦 Total items: 247
- ⚠️ Low stock alerts: 12
- ✅ In stock: 185
- 💰 Total value: $45,230
- 🔍 Live search
- 📊 Stock status badges

**Categories**:
- Medication
- Equipment
- Supplies
- PPE (Personal Protective Equipment)

**Actions**:
- ➕ Add new item
- ✏️ Edit item
- 🗑️ Delete item
- 🔍 Search/filter

---

## 🎯 User Flows

### New User Flow
```
1. index.html
2. Click "Get Started"
3. login.html
4. Click "Sign Up" tab
5. Fill registration form
6. Auto-login → dashboard.html
7. Choose diagnosis tool
8. Complete assessment
9. View results
```

### Returning User Flow
```
1. index.html
2. Click "Get Started"
3. login.html
4. Enter credentials
5. dashboard.html
6. Access previous reports
```

### Admin Flow
```
1. index.html
2. Navigate to login-admin.html
3. Enter admin credentials
4. admin.html
5. View statistics
6. Manage inventory
7. Monitor users
```

---

## 🔗 Cross-Page Links

| From | To | Trigger |
|------|-----|---------|
| index.html | login.html | "Get Started" button |
| index.html | #features | Pill navigation |
| login.html | dashboard.html | Successful login |
| login.html | login-admin.html | Admin link |
| login-admin.html | admin.html | Admin login |
| login-admin.html | login.html | User link |
| dashboard.html | diagnosis-*.html | Diagnosis cards |
| admin.html | inventory.html | Inventory button |
| Any page | index.html | Logo/home link |

---

## 🎨 Design Consistency

### Navigation Styles
- **Landing**: Pill navigation (rounded, animated)
- **Dashboard**: Sidebar navigation (vertical)
- **Admin**: Top bar + sidebar
- **Diagnosis**: Back button + title

### Button Styles
- **Primary**: Purple gradient (user)
- **Danger**: Red gradient (admin)
- **Outline**: Transparent with border
- **3D**: Push effect on click

### Card Styles
- **Glass**: backdrop-blur(10px)
- **Spotlight**: Hover glow effect
- **Elevated**: Box shadow on hover

---

## 📱 Responsive Breakpoints

| Size | Breakpoint | Navigation |
|------|------------|------------|
| Mobile | <768px | Hamburger menu |
| Tablet | 768-1024px | Condensed pills |
| Desktop | >1024px | Full navigation |

---

**Complete navigation map for MedAI platform!** 🗺️
All paths tested and functional ✅
