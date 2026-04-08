# MedAI - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Python 3.8+ installed
- A web browser (Chrome recommended)
- Internet connection (for CDN resources)

---

## 📦 Installation

### Step 1: Install Python Dependencies
```bash
cd Smart-AI-based-Medical-Diagnosis-and-Inventory
pip install -r requirements.txt
```

### Step 2: Configure Environment
1. Copy `.env.example` to `.env`
2. Add your Gemini API key (get from https://makersuite.google.com/app/apikey):
```
GEMINI_API_KEY=your_actual_api_key_here
```

### Step 3: Start the Backend Server
```bash
python app_flask_v2.py
```
You should see:
```
🏥 MedAI Backend Server v2.0
🔑 Admin: admin@medai.com / MedAI@Admin2024
🤖 Gemini AI: ✅ Ready
💾 Supabase: ✅ Connected
🌐 Server: http://localhost:5000
```

### Step 4: Start a Web Server
Open a **new terminal** and run:
```bash
# Python's built-in server
python -m http.server 8000
```

### Step 5: Open the App
Navigate to: http://localhost:8000

---

## 🔐 Login Credentials

**User Login**:
- Any email/password (creates new account)
- Or sign up through the app

**Admin Login**:
```
📧 admin@medai.com
🔑 MedAI@Admin2024
```
Access admin panel at: `admin-v2.html`

---

## 📱 Feature Tour

### 1. AI Symptom Checker
- Select symptoms from categories
- Add custom symptoms
- Get Gemini AI-powered analysis
- View charts and recommendations

### 2. Diagnosis Tools
- **Diabetes**: Comprehensive risk assessment
- **Lung Cancer**: Screening questionnaire
- **Blood Pressure**: BP category analysis

### 3. Admin Dashboard
- User management with search
- View individual user trends
- Risk distribution charts
- Diagnosis type analytics

### 4. History & Trends
- All diagnoses saved to Supabase
- Per-user trend analysis
- Health improvement tracking

---

## 🐛 Troubleshooting

**"CORS Error" or API calls failing**:
- Make sure Flask backend is running on port 5000
- Access app via localhost (not file://)

**"Gemini AI not ready"**:
- Check your API key in `.env` file
- Ensure `google-generativeai` is installed

**Charts not showing**:
- Refresh the page
- Check browser console for errors

---

## 📂 Key Files

```
app_flask_v2.py          → Backend API server
symptom-checker.html     → AI symptom analysis
admin-v2.html            → Admin dashboard
dashboard.html           → User dashboard
.env                     → Your configuration
```

---

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/symptoms/analyze` | POST | AI symptom analysis |
| `/api/admin/login` | POST | Admin authentication |
| `/api/admin/stats` | GET | Platform statistics |
| `/api/admin/users` | GET | User list |
| `/api/user/{id}/trends` | GET | User health trends |

---

**Need help?** Check `SUPABASE-SETUP.md` for database configuration!
