-- ============================================
-- ADMIN DASHBOARD COMPLETE FIX
-- Run this in Supabase SQL Editor
-- Project: ydhfwvlhwxhiivheepqo
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: CREATE USER ACTIVITY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'login', 
        'logout', 
        'diagnosis_submit', 
        'order_placed', 
        'profile_update',
        'shop_view',
        'cart_add',
        'checkout_start',
        'admin_view_orders',
        'admin_view_users',
        'admin_view_inventory'
    )),
    activity_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity(created_at DESC);

-- Enable RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own activity" ON user_activity;
DROP POLICY IF EXISTS "Users can insert own activity" ON user_activity;
DROP POLICY IF EXISTS "Admins can view all activity" ON user_activity;

-- Users can view their own activity
CREATE POLICY "Users can view own activity"
ON user_activity FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own activity
CREATE POLICY "Users can insert own activity"
ON user_activity FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all activity
CREATE POLICY "Admins can view all activity"
ON user_activity FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Grant permissions
GRANT SELECT, INSERT ON user_activity TO authenticated;

-- ============================================
-- STEP 2: FIX ADMIN ACCESS TO ALL TABLES
-- ============================================

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all diagnosis" ON diagnosis_results;

-- Admin policies for ORDERS
CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can update orders"
ON orders FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can delete orders"
ON orders FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Admin policies for PROFILES
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Admin policies for DIAGNOSIS_RESULTS
CREATE POLICY "Admins can view all diagnosis"
ON diagnosis_results FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- ============================================
-- STEP 3: VERIFICATION QUERIES
-- ============================================

-- Check tables exist
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'orders', 'user_activity', 'diagnosis_results', 'inventory');
    
    RAISE NOTICE 'Found % required tables', table_count;
END $$;

COMMIT;

-- ============================================
-- POST-INSTALLATION VERIFICATION
-- ============================================

-- Run these queries after the transaction commits:

-- 1. Verify table structure
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'orders', 'user_activity', 'diagnosis_results', 'inventory')
ORDER BY table_name;

-- 2. Count records
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'user_activity', COUNT(*) FROM user_activity
UNION ALL
SELECT 'diagnosis_results', COUNT(*) FROM diagnosis_results
UNION ALL
SELECT 'inventory', COUNT(*) FROM inventory;

-- 3. Verify RLS policies
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('orders', 'profiles', 'user_activity', 'diagnosis_results')
ORDER BY tablename, policyname;

-- ============================================
-- OPTIONAL: CREATE ADMIN USER
-- ============================================

-- Uncomment and replace email to set an admin
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Admin Dashboard Fix completed successfully!';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Run verification queries above';
    RAISE NOTICE '2. Set admin user: UPDATE profiles SET role = ''admin'' WHERE email = ''your-email@example.com''';
    RAISE NOTICE '3. Update admin-v2.html with new functions';
    RAISE NOTICE '4. Test admin dashboard';
END $$;
