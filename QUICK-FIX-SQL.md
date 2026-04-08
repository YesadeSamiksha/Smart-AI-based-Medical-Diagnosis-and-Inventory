# 🔧 DATABASE SETUP - IMMEDIATE FIX

## Run this SQL in Supabase to fix all issues!

```sql
-- ============================================
-- COMPLETE DATABASE SETUP - RUN THIS ONCE
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. DIAGNOSIS RESULTS TABLE
CREATE TABLE IF NOT EXISTS diagnosis_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    diagnosis_type TEXT NOT NULL,
    input_data JSONB NOT NULL,
    result_data JSONB NOT NULL,
    risk_level TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    price NUMERIC(10,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    delivery_fee NUMERIC(10,2) DEFAULT 50.00,
    total NUMERIC(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'COD',
    payment_status TEXT DEFAULT 'pending',
    payment_id TEXT,
    order_status TEXT DEFAULT 'pending',
    delivery_address JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. AUTO REORDERS TABLE
CREATE TABLE IF NOT EXISTS auto_reorders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_id UUID,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    expected_delivery TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ADD SAMPLE DATA
-- ============================================

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
    ('Surgical Mask (Box of 50)', 'supplies', 5, 400.00, '3-ply disposable masks')
ON CONFLICT DO NOTHING;

-- ============================================
-- ENABLE RLS & ADD POLICIES
-- ============================================

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_results ENABLE ROW LEVEL SECURITY;

-- Anyone can view inventory
CREATE POLICY "Anyone can view inventory" ON inventory FOR SELECT USING (true);

-- Users can create orders
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view orders" ON orders FOR SELECT USING (true);

-- Users can create/view diagnosis
CREATE POLICY "Users can create diagnosis" ON diagnosis_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view diagnosis" ON diagnosis_results FOR SELECT USING (true);

-- CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_user_id ON diagnosis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
```

## ✅ AFTER RUNNING THE SQL:

1. Refresh admin-v2.html → Inventory should show 10 items
2. Refresh shop.html → Should show 10 products
3. Try adding to cart and placing order
4. Check orders.html → Should work
5. Complete a health assessment → Dashboard should update

**That's it! Everything should work now!** 🎉
