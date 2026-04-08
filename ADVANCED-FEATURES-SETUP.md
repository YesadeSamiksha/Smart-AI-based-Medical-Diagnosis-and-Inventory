# 🚀 MedAI Advanced Features - Complete Setup Guide

## 🎯 New Features Overview

This update adds **5 major features** that transform MedAI into a fully automated, intelligent medical platform:

1. **✅ Complete Inventory API** - Full CRUD operations
2. **✅ Order Management System** - Track orders from placement to delivery
3. **✅ Payment Gateway Integration** - Razorpay for online payments
4. **✅ Email Notifications** - Automated emails for orders and alerts
5. **✅ AI Auto-Reordering Agent** - Intelligent inventory management

---

## 📋 Prerequisites

- Python 3.8+
- Node.js (for live server)
- Supabase account
- Gmail account (for emails)
- Razorpay account (optional, works in demo mode)

---

## 🔧 Installation Steps

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

**New packages added:**
- `razorpay` - Payment gateway integration

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# SUPABASE
SUPABASE_URL=https://ydhfwvlhwxhiivheepqo.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# GEMINI AI
GEMINI_API_KEY=your_gemini_api_key

# ADMIN CREDENTIALS
ADMIN_EMAIL=admin@medai.com
ADMIN_PASSWORD=MedAI@Admin2024

# RAZORPAY (Test Mode)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# EMAIL (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# AI AGENT
AI_AGENT_ENABLED=true
AI_AGENT_CHECK_INTERVAL=3600
LOW_STOCK_THRESHOLD=10
```

### 3. Setup Supabase Database

Run the SQL script in Supabase SQL Editor:

```bash
# File: supabase-advanced-schema.sql
```

This creates:
- `orders` table
- `auto_reorders` table
- `ai_agent_logs` table
- Indexes for performance
- Row Level Security policies
- Sample inventory data (optional)

### 4. Setup Email (Gmail)

1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Generate App Password:
   - Security → 2-Step Verification → App Passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password
4. Add to `.env` as `EMAIL_PASSWORD`

### 5. Setup Razorpay (Optional)

For **Test Mode** (no real transactions):

1. Sign up at https://razorpay.com
2. Go to Dashboard → Settings → API Keys
3. Generate Test Keys
4. Add to `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxx
   RAZORPAY_KEY_SECRET=xxxxx
   ```

**Note:** The system works in demo mode without Razorpay keys!

---

## 🚀 Running the Application

### Start Flask Backend (Advanced Version)

```bash
python app_advanced.py
```

You should see:

```
🚀 MedAI Advanced Backend Starting...
📌 Features:
  ✅ Inventory Management API
  ✅ Order Processing & History
  ✅ Payment Gateway (Razorpay)
  ✅ Email Notifications
  ✅ AI Auto-Reordering Agent

🤖 Starting AI Agent...
🤖 AI Inventory Agent started
🌐 Server running on http://localhost:5000
```

### Start Frontend

Open with Live Server or any HTTP server:

```bash
# Using Python
python -m http.server 8000

# Or just open index.html with Live Server in VS Code
```

---

## 🎮 Feature Usage Guide

### 1️⃣ **Inventory Management (Admin)**

**Admin Panel → Inventory Tab**

- **Add Item**: Click "Add New Item" button
  - Fill: Name, Category, Stock, Price, Description
  - Click "Save"
  
- **Edit Item**: Click edit icon (✏️)
  - Modify fields
  - Click "Save"
  
- **Delete Item**: Click delete icon (🗑️)
  - Confirm deletion
  
- **View Stats**: See totals, low stock alerts automatically

### 2️⃣ **Shopping (Users)**

**Dashboard → Shop**

- Browse products by category
- Search products
- Add to cart
- View cart (bottom-right icon)
- Adjust quantities
- Proceed to checkout

### 3️⃣ **Checkout & Payment**

**Shop → Checkout**

1. **Fill Delivery Address**:
   - Full name
   - Phone
   - Complete address
   - City & PIN code

2. **Select Payment Method**:
   - **Online Payment**: UPI, Cards, Net Banking (Razorpay)
   - **Cash on Delivery**: Pay on delivery

3. **Place Order**:
   - Click "Place Order"
   - For online payment: Razorpay popup opens
   - Complete payment
   - Order confirmed!

### 4️⃣ **Order History**

**Dashboard → My Orders**

- View all orders
- Track order status:
  - 🟡 Pending
  - 🔵 Processing
  - 🟢 Completed
  - 🟢 Delivered
  - 🔴 Cancelled
- Cancel pending orders

### 5️⃣ **Email Notifications**

**Automated Emails Sent:**

1. **User - Order Confirmation**:
   - Order details
   - Items list
   - Total amount
   - Delivery timeline

2. **Admin - Low Stock Alert**:
   - Item name
   - Current stock
   - Recommended reorder quantity

3. **Admin - Auto-Reorder Notification**:
   - Item reordered
   - Quantity
   - Expected delivery

### 6️⃣ **AI Auto-Reordering**

**How It Works:**

1. **AI Agent monitors inventory every hour**
2. Detects items with stock < 10 units
3. **Analyzes order history** (last 30 days)
4. **Uses Gemini AI** to calculate optimal reorder quantity
5. **Sends alert email** to admin
6. **Automatically places reorder** (simulated)
7. **Simulates delivery** after 2 days
8. **Stock updated automatically**

**Manual Control:**

```bash
# Start AI Agent
POST http://localhost:5000/api/ai-agent/start

# Stop AI Agent
POST http://localhost:5000/api/ai-agent/stop

# Check Status
GET http://localhost:5000/api/ai-agent/status
```

**AI Agent auto-starts with Flask server!**

---

## 📊 API Endpoints

### Inventory

```bash
GET    /api/inventory              # List all items
POST   /api/inventory              # Create item
PUT    /api/inventory/<id>         # Update item
DELETE /api/inventory/<id>         # Delete item
```

### Orders

```bash
POST   /api/orders                 # Create order
GET    /api/orders                 # Get all orders (Admin)
GET    /api/orders/user/<id>       # Get user orders
PUT    /api/orders/<id>/status     # Update order status
```

### Payment

```bash
POST   /api/payment/create-order   # Create Razorpay order
POST   /api/payment/verify         # Verify payment
```

### AI Agent

```bash
POST   /api/ai-agent/start         # Start AI agent
POST   /api/ai-agent/stop          # Stop AI agent
GET    /api/ai-agent/status        # Get status
GET    /api/auto-reorders          # View auto-reorders
```

### Health Check

```bash
GET    /api/health                 # System health status
```

---

## 🎯 Testing the Complete Flow

### User Journey

1. **Login** → `login.html`
2. **Browse Products** → `shop.html`
3. **Add to Cart** → Click "Add to Cart"
4. **View Cart** → Click cart icon
5. **Checkout** → Click "Proceed to Checkout"
6. **Fill Address** → `checkout.html`
7. **Choose Payment** → Online or COD
8. **Place Order** → Confirm
9. **View Order** → `orders.html`
10. **Receive Email** → Check inbox

### Admin Journey

1. **Login** → `login-admin.html`
2. **View Orders** → Admin Panel → Orders tab
3. **Manage Inventory** → Inventory tab
4. **Add New Item** → Click "Add New Item"
5. **Monitor Alerts** → Check email for low stock
6. **Review AI Actions** → Auto-reorders tab

### AI Agent Testing

1. **Create low stock item**:
   ```sql
   UPDATE inventory SET quantity = 5 WHERE name = 'Paracetamol 500mg';
   ```

2. **Wait for AI check** (or manually trigger)
3. **Check email** → Low stock alert received
4. **Wait 1 minute** → Stock auto-updated
5. **Verify** → Item quantity increased

---

## 🔍 Monitoring & Logs

### Flask Console

Watch for:
- ✅ Email sent confirmations
- ⚠️ Low stock detections
- 🤖 AI agent actions
- 📦 Reorder deliveries

### Supabase Dashboard

Check tables:
- `orders` - All orders
- `auto_reorders` - AI reorder history
- `ai_agent_logs` - AI actions
- `inventory` - Stock levels

---

## ⚙️ Configuration Options

### AI Agent Interval

Change check frequency in `.env`:
```env
AI_AGENT_CHECK_INTERVAL=3600  # Check every hour (3600 seconds)
```

Shorter for testing:
```env
AI_AGENT_CHECK_INTERVAL=300   # Check every 5 minutes
```

### Low Stock Threshold

```env
LOW_STOCK_THRESHOLD=10  # Alert when stock < 10
```

### Disable AI Agent

```env
AI_AGENT_ENABLED=false
```

Or via API:
```bash
curl -X POST http://localhost:5000/api/ai-agent/stop
```

---

## 🐛 Troubleshooting

### Email Not Sending

**Problem:** "Email credentials not configured"

**Solution:**
1. Check `.env` has `EMAIL_USER` and `EMAIL_PASSWORD`
2. Verify Gmail App Password (not regular password)
3. Enable "Less secure app access" (if needed)

### Payment Fails

**Problem:** Razorpay payment not working

**Solution:**
- System works in **demo mode** without keys
- For testing: Enter test card `4111 1111 1111 1111`
- Check Razorpay Dashboard → API Keys

### AI Agent Not Running

**Problem:** No low stock alerts

**Solution:**
1. Check Flask console for "🤖 AI Inventory Agent started"
2. Verify Gemini API key in `.env`
3. Check AI status: `GET /api/ai-agent/status`
4. Manually start: `POST /api/ai-agent/start`

### Stock Not Deducting

**Problem:** Stock remains same after order

**Solution:**
1. Check order API response for errors
2. Verify RLS policies in Supabase
3. Check Flask console logs
4. Ensure inventory table has correct item IDs

---

## 📝 Important Notes

### Demo vs Production

**Current Setup**: Demo/Development mode

**For Production**:
1. Use real Razorpay keys (live mode)
2. Configure production Supabase URL
3. Use dedicated email service (SendGrid, AWS SES)
4. Add proper authentication middleware
5. Enable HTTPS
6. Set up proper logging
7. Add rate limiting

### Security

- ⚠️ Never commit `.env` file
- ⚠️ Use environment variables for secrets
- ⚠️ Enable RLS in Supabase
- ⚠️ Validate all user inputs
- ⚠️ Use HTTPS in production

### Performance

- AI Agent checks run in background thread
- Emails sent asynchronously
- Database queries optimized with indexes
- Cart stored in localStorage (client-side)

---

## 📞 Support & Help

### Common Issues

1. **"Module not found" error**:
   ```bash
   pip install -r requirements.txt
   ```

2. **"Connection refused" error**:
   - Ensure Flask server is running on port 5000
   - Check if another app is using port 5000

3. **"Supabase error"**:
   - Verify Supabase URL and keys
   - Check RLS policies
   - Run SQL schema script

4. **"AI error"**:
   - Verify Gemini API key
   - Check API quota
   - Review Flask console for errors

### Getting Help

- Check Flask console logs
- Check browser console (F12)
- Review Supabase logs
- Test API endpoints with Postman

---

## 🎉 Success Checklist

- [ ] Flask server running on port 5000
- [ ] Frontend accessible (index.html loads)
- [ ] User can login
- [ ] Products visible in shop
- [ ] Add to cart works
- [ ] Checkout page loads
- [ ] Order placement works
- [ ] Order appears in orders page
- [ ] Email received (check spam folder)
- [ ] Admin can view orders
- [ ] Admin can manage inventory
- [ ] AI agent running (check console)
- [ ] Low stock alert works
- [ ] Auto-reorder executed

---

**Status**: ✅ All features implemented and ready for testing!

**Version**: 3.0 - Advanced Edition

**Last Updated**: April 2026
