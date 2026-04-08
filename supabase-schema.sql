-- ============================================
-- MedAI Supabase Database Schema
-- Project ID: ydhfwvlhwxhiivheepqo
-- ============================================
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ydhfwvlhwxhiivheepqo/sql/new
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Stores additional user information
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- DIAGNOSIS RESULTS TABLE
-- Stores all diagnosis assessments
-- ============================================
CREATE TABLE IF NOT EXISTS diagnosis_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    diagnosis_type TEXT NOT NULL CHECK (diagnosis_type IN ('diabetes', 'lung', 'bp', 'symptoms')),
    input_data JSONB NOT NULL,
    result_data JSONB NOT NULL,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_diagnosis_user_id ON diagnosis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_type ON diagnosis_results(diagnosis_type);
CREATE INDEX IF NOT EXISTS idx_diagnosis_created_at ON diagnosis_results(created_at DESC);

-- ============================================
-- INVENTORY TABLE
-- Stores medical inventory items
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    min_stock INTEGER DEFAULT 10,
    status TEXT DEFAULT 'high' CHECK (status IN ('low', 'medium', 'high')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow insert during signup
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- DIAGNOSIS RESULTS POLICIES
-- ============================================

-- Users can view their own diagnosis results
CREATE POLICY "Users can view own diagnosis" ON diagnosis_results
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own diagnosis results
CREATE POLICY "Users can insert own diagnosis" ON diagnosis_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own diagnosis results
CREATE POLICY "Users can delete own diagnosis" ON diagnosis_results
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all diagnosis results
CREATE POLICY "Admins can view all diagnosis" ON diagnosis_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- INVENTORY POLICIES
-- ============================================

-- All authenticated users can view inventory
CREATE POLICY "Authenticated users can view inventory" ON inventory
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can insert inventory items
CREATE POLICY "Admins can insert inventory" ON inventory
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can update inventory items
CREATE POLICY "Admins can update inventory" ON inventory
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete inventory items
CREATE POLICY "Admins can delete inventory" ON inventory
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for inventory updated_at
DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional)
-- Uncomment to insert sample inventory data
-- ============================================

/*
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
*/

-- ============================================
-- CREATE ADMIN USER (Run this after signup)
-- Replace 'your-user-id' with actual user ID
-- ============================================

/*
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@medai.com';
*/

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify tables were created
-- ============================================

/*
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'diagnosis_results', 'inventory');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'diagnosis_results', 'inventory');

-- Check policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
*/
