-- ============================================
-- CREATE ADMIN USER FOR MEDAI PLATFORM
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create admin user with Supabase Auth
-- Email: admin@medai.com
-- Password: MedAI@Admin2024

-- First, let's create the user in auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    raw_app_meta_data,
    raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@medai.com',
    crypt('MedAI@Admin2024', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{}'
) ON CONFLICT (email) DO UPDATE SET
    encrypted_password = crypt('MedAI@Admin2024', gen_salt('bf')),
    updated_at = NOW(),
    email_confirmed_at = NOW();

-- Step 2: Create profile with admin role
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) 
SELECT 
    id,
    'admin@medai.com',
    'System Administrator',
    'admin',
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'admin@medai.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'System Administrator',
    email = 'admin@medai.com',
    updated_at = NOW();

-- Step 3: Verify the admin user was created
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.role,
    p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@medai.com';

-- Success message
SELECT 'Admin user created successfully! Use admin@medai.com / MedAI@Admin2024 to login' AS message;