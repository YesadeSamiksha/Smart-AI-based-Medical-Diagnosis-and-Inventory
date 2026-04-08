-- ============================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view diagnosis" ON diagnosis_results;
DROP POLICY IF EXISTS "Users can create diagnosis" ON diagnosis_results;
DROP POLICY IF EXISTS "Users can view orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can update orders" ON orders;

-- ============================================
-- FIXED PROFILES POLICIES (No recursion)
-- ============================================

-- Allow users to read ALL profiles (for admin dashboard)
CREATE POLICY "Enable read access for all users" ON profiles
    FOR SELECT
    USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users based on id" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================
-- FIXED DIAGNOSIS POLICIES
-- ============================================

-- Allow users to read ALL diagnosis results (for admin dashboard)
CREATE POLICY "Enable read for all authenticated users" ON diagnosis_results
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Allow users to insert diagnosis
CREATE POLICY "Enable insert for authenticated users" ON diagnosis_results
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FIXED ORDERS POLICIES
-- ============================================

-- Allow users to read ALL orders (for admin dashboard)
CREATE POLICY "Enable read for all users" ON orders
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Allow users to insert orders
CREATE POLICY "Enable insert for authenticated users" ON orders
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update ALL orders (for admin to update status)
CREATE POLICY "Enable update for authenticated users" ON orders
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- INVENTORY POLICIES (No auth required for viewing)
-- ============================================

-- Already exists, but ensuring it's correct
DROP POLICY IF EXISTS "Anyone can view inventory" ON inventory;
CREATE POLICY "Public inventory read access" ON inventory
    FOR SELECT
    USING (true);

-- Allow authenticated users to update inventory (for admin and auto-deduction)
DROP POLICY IF EXISTS "Admin can manage inventory" ON inventory;
CREATE POLICY "Authenticated users can manage inventory" ON inventory
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- AUTO REORDERS POLICIES
-- ============================================

CREATE POLICY "Enable read for authenticated users" ON auto_reorders
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON auto_reorders
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON auto_reorders
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'RLS Policies Fixed Successfully!' as status;
