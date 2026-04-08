-- Advanced Database Schema for MedAI Platform
-- Run this in Supabase SQL Editor

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    items JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 50.00,
    total DECIMAL(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'COD',
    payment_status TEXT DEFAULT 'pending',
    payment_id TEXT,
    order_status TEXT DEFAULT 'pending',
    delivery_address JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- AUTO REORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS auto_reorders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory(id),
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    expected_delivery TIMESTAMP,
    actual_delivery TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT DEFAULT 'AI_AGENT'
);

-- ============================================
-- AI AGENT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_agent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type TEXT NOT NULL,
    item_id UUID,
    item_name TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INVENTORY TABLE (ensure it exists)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PROFILES TABLE (ensure it exists)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auto_reorders_item ON auto_reorders(item_id);
CREATE INDEX IF NOT EXISTS idx_auto_reorders_status ON auto_reorders(status);

CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_reorders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Orders policies: Users can view their own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admin can view all orders (assume admin email is stored)
CREATE POLICY "Admins can view all orders"
ON orders FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Inventory: Everyone can read
CREATE POLICY "Anyone can view inventory"
ON inventory FOR SELECT
USING (true);

-- Inventory: Only admins can modify
CREATE POLICY "Admins can manage inventory"
ON inventory FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Auto reorders: Only admins can view
CREATE POLICY "Admins can view auto reorders"
ON auto_reorders FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- AI Agent logs: Only admins can view
CREATE POLICY "Admins can view AI logs"
ON ai_agent_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================

-- Insert sample inventory items (if table is empty)
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
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on tables to authenticated users
GRANT SELECT, INSERT ON orders TO authenticated;
GRANT SELECT ON inventory TO authenticated;
GRANT SELECT ON auto_reorders TO authenticated;
GRANT SELECT ON ai_agent_logs TO authenticated;

-- Admin users get full access (handle via RLS policies)

COMMIT;
