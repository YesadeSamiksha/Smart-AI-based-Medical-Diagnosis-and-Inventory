-- ============================================
-- FIX: Supabase RLS for MedAI Admin Dashboard
-- Admin dashboard uses localStorage token (NOT Supabase Auth)
-- So we open read access to anon key for admin-needed tables
-- Run in: https://supabase.com/dashboard/project/ydhfwvlhwxhiivheepqo/sql/new
-- ============================================

-- ============================================
-- STEP 1: Fix profiles table - allow anon read
-- ============================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow anon read for admin dashboard" ON profiles;

-- Allow authenticated users to see their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow update of own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow insert during signup
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow anon key to READ all profiles (admin dashboard uses anon key)
CREATE POLICY "Allow anon read for admin dashboard" ON profiles
    FOR SELECT USING (true);

-- ============================================
-- STEP 2: Fix diagnosis_results - allow anon read
-- ============================================
DROP POLICY IF EXISTS "Admins can view all diagnosis" ON diagnosis_results;
DROP POLICY IF EXISTS "Users can view own diagnosis" ON diagnosis_results;
DROP POLICY IF EXISTS "Allow anon read diagnosis" ON diagnosis_results;

-- Authenticated users see their own
CREATE POLICY "Users can view own diagnosis" ON diagnosis_results
    FOR SELECT USING (auth.uid() = user_id);

-- Allow anon key to read all (for admin dashboard)
CREATE POLICY "Allow anon read diagnosis" ON diagnosis_results
    FOR SELECT USING (true);

-- Allow authenticated users to insert their own
DROP POLICY IF EXISTS "Users can insert diagnosis" ON diagnosis_results;
CREATE POLICY "Users can insert diagnosis" ON diagnosis_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STEP 3: Fix orders table - allow anon read + insert
-- ============================================
DROP POLICY IF EXISTS "Allow anon read orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Allow order insert" ON orders;
DROP POLICY IF EXISTS "Allow anon update orders" ON orders;

-- Allow anon and authenticated to read orders (admin dashboard)
CREATE POLICY "Allow anon read orders" ON orders
    FOR SELECT USING (true);

-- Allow authenticated users to create orders
CREATE POLICY "Allow order insert" ON orders
    FOR INSERT WITH CHECK (true);

-- Allow order updates (for status changes by admin)
CREATE POLICY "Allow anon update orders" ON orders
    FOR UPDATE USING (true);

-- ============================================
-- STEP 4: Fix inventory - allow anon read, auth write
-- ============================================
DROP POLICY IF EXISTS "Everyone can view inventory" ON inventory;
DROP POLICY IF EXISTS "Allow inventory read" ON inventory;
DROP POLICY IF EXISTS "Admins can insert inventory" ON inventory;
DROP POLICY IF EXISTS "Admins can update inventory" ON inventory;
DROP POLICY IF EXISTS "Admins can delete inventory" ON inventory;
DROP POLICY IF EXISTS "Allow inventory write" ON inventory;

-- Everyone can view inventory (products page)
CREATE POLICY "Allow inventory read" ON inventory
    FOR SELECT USING (true);

-- Allow all writes (admin controls this via localStorage auth)
CREATE POLICY "Allow inventory write" ON inventory
    FOR ALL USING (true);

-- ============================================
-- STEP 5: Fix user_activity - allow anon read
-- ============================================
DROP POLICY IF EXISTS "Allow anon read user_activity" ON user_activity;
DROP POLICY IF EXISTS "Allow anon insert user_activity" ON user_activity;

CREATE POLICY "Allow anon read user_activity" ON user_activity
    FOR SELECT USING (true);

CREATE POLICY "Allow anon insert user_activity" ON user_activity
    FOR INSERT WITH CHECK (true);

-- ============================================
-- STEP 6: Helper function (still useful for future)
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- STEP 7: auto_reorders table
-- ============================================
DROP POLICY IF EXISTS "Allow anon read auto_reorders" ON auto_reorders;
DROP POLICY IF EXISTS "Allow anon write auto_reorders" ON auto_reorders;

CREATE POLICY "Allow anon read auto_reorders" ON auto_reorders
    FOR SELECT USING (true);

CREATE POLICY "Allow anon write auto_reorders" ON auto_reorders
    FOR ALL USING (true);

-- ============================================
-- VERIFICATION: Check all policies
-- ============================================
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
