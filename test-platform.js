// ============================================
// MEDAI PLATFORM - DIAGNOSTIC TEST SCRIPT
// ============================================
// Paste this into browser console to verify setup
// Run on admin-v2.html page

console.log('🔍 MedAI Platform Diagnostic Test');
console.log('==================================\n');

async function runDiagnostics() {
    const results = {
        supabase: '❌ Not initialized',
        auth: '❌ Not initialized', 
        database: '❌ Not initialized',
        profiles: 0,
        diagnoses: 0,
        inventory: 0,
        orders: 0,
        rlsCheck: '❌ Failed'
    };

    // Test 1: Supabase Connection
    console.log('1️⃣  Testing Supabase Connection...');
    try {
        const supabase = window.MedAISupabase?.getSupabase();
        if (supabase) {
            results.supabase = '✅ Connected';
            console.log('   ✅ Supabase client initialized');
        } else {
            console.error('   ❌ Supabase not initialized');
            return results;
        }
    } catch (error) {
        console.error('   ❌ Supabase error:', error.message);
        return results;
    }

    // Test 2: Auth Module
    console.log('\n2️⃣  Testing Auth Module...');
    try {
        if (window.MedAIAuth) {
            results.auth = '✅ Loaded';
            console.log('   ✅ Auth module loaded');
        } else {
            console.error('   ❌ Auth module not found');
        }
    } catch (error) {
        console.error('   ❌ Auth error:', error.message);
    }

    // Test 3: Database Module
    console.log('\n3️⃣  Testing Database Module...');
    try {
        if (window.MedAIDatabase) {
            results.database = '✅ Loaded';
            console.log('   ✅ Database module loaded');
        } else {
            console.error('   ❌ Database module not found');
        }
    } catch (error) {
        console.error('   ❌ Database error:', error.message);
    }

    // Test 4: Fetch Profiles
    console.log('\n4️⃣  Fetching Profiles...');
    try {
        const supabase = window.MedAISupabase.getSupabase();
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*');
        
        if (error) {
            console.error('   ❌ Error fetching profiles:', error.message);
            if (error.message.includes('infinite recursion')) {
                console.error('   ⚠️  CRITICAL: RLS Policy infinite recursion detected!');
                console.error('   📝 ACTION: Run FIX-RLS-POLICIES.sql in Supabase');
            }
        } else {
            results.profiles = profiles?.length || 0;
            console.log(`   ✅ Found ${results.profiles} users`);
            if (results.profiles === 0) {
                console.warn('   ⚠️  No users found. Register users via login.html');
            } else {
                console.log('   📋 Sample users:', profiles.slice(0, 3).map(p => ({
                    email: p.email,
                    name: p.full_name,
                    role: p.role
                })));
            }
        }
    } catch (error) {
        console.error('   ❌ Profiles fetch error:', error.message);
    }

    // Test 5: Fetch Diagnoses
    console.log('\n5️⃣  Fetching Diagnosis Results...');
    try {
        const supabase = window.MedAISupabase.getSupabase();
        const { data: diagnoses, error } = await supabase
            .from('diagnosis_results')
            .select('*');
        
        if (error) {
            console.error('   ❌ Error fetching diagnoses:', error.message);
        } else {
            results.diagnoses = diagnoses?.length || 0;
            console.log(`   ✅ Found ${results.diagnoses} diagnosis results`);
            if (results.diagnoses === 0) {
                console.warn('   ⚠️  No diagnoses found. Users need to perform diagnoses');
            } else {
                const breakdown = {};
                diagnoses.forEach(d => {
                    breakdown[d.diagnosis_type] = (breakdown[d.diagnosis_type] || 0) + 1;
                });
                console.log('   📊 Breakdown:', breakdown);
            }
        }
    } catch (error) {
        console.error('   ❌ Diagnoses fetch error:', error.message);
    }

    // Test 6: Fetch Inventory
    console.log('\n6️⃣  Fetching Inventory...');
    try {
        const supabase = window.MedAISupabase.getSupabase();
        const { data: inventory, error } = await supabase
            .from('inventory')
            .select('*');
        
        if (error) {
            console.error('   ❌ Error fetching inventory:', error.message);
        } else {
            results.inventory = inventory?.length || 0;
            console.log(`   ✅ Found ${results.inventory} inventory items`);
            if (results.inventory === 0) {
                console.warn('   ⚠️  No inventory found. Add items via admin panel or SQL');
            } else {
                const lowStock = inventory.filter(i => i.quantity < 10).length;
                const outOfStock = inventory.filter(i => i.quantity === 0).length;
                console.log(`   📦 Stock Status: ${lowStock} low, ${outOfStock} out`);
            }
        }
    } catch (error) {
        console.error('   ❌ Inventory fetch error:', error.message);
    }

    // Test 7: Fetch Orders
    console.log('\n7️⃣  Fetching Orders...');
    try {
        const supabase = window.MedAISupabase.getSupabase();
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*');
        
        if (error) {
            console.error('   ❌ Error fetching orders:', error.message);
        } else {
            results.orders = orders?.length || 0;
            console.log(`   ✅ Found ${results.orders} orders`);
            if (results.orders > 0) {
                const revenue = orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
                console.log(`   💰 Total Revenue: ₹${revenue.toFixed(2)}`);
            }
        }
    } catch (error) {
        console.error('   ❌ Orders fetch error:', error.message);
    }

    // Test 8: RLS Policy Check
    console.log('\n8️⃣  Testing RLS Policies...');
    try {
        const supabase = window.MedAISupabase.getSupabase();
        
        // Try to select with current auth
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
        
        if (error) {
            if (error.message.includes('infinite recursion')) {
                results.rlsCheck = '❌ INFINITE RECURSION DETECTED';
                console.error('   ❌ CRITICAL: Infinite recursion in RLS policies');
                console.error('   📝 ACTION REQUIRED: Run FIX-RLS-POLICIES.sql');
            } else {
                results.rlsCheck = `❌ ${error.message}`;
                console.error('   ❌ RLS error:', error.message);
            }
        } else {
            results.rlsCheck = '✅ Passed';
            console.log('   ✅ RLS policies working correctly');
        }
    } catch (error) {
        results.rlsCheck = `❌ ${error.message}`;
        console.error('   ❌ RLS check failed:', error.message);
    }

    // Final Summary
    console.log('\n==================================');
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('==================================');
    console.log('Supabase:', results.supabase);
    console.log('Auth Module:', results.auth);
    console.log('Database Module:', results.database);
    console.log('Users:', results.profiles);
    console.log('Diagnoses:', results.diagnoses);
    console.log('Inventory:', results.inventory);
    console.log('Orders:', results.orders);
    console.log('RLS Check:', results.rlsCheck);
    console.log('==================================\n');

    // Recommendations
    console.log('📝 RECOMMENDATIONS:');
    if (results.rlsCheck.includes('INFINITE RECURSION')) {
        console.error('🔴 CRITICAL: Fix RLS policies immediately!');
        console.error('   Run FIX-RLS-POLICIES.sql in Supabase SQL Editor');
    } else if (results.profiles === 0) {
        console.warn('🟡 No users registered');
        console.warn('   Go to login.html and create test users');
    } else if (results.diagnoses === 0) {
        console.warn('🟡 No diagnosis data');
        console.warn('   Login as user and perform BP/Diabetes diagnoses');
    } else if (results.inventory === 0) {
        console.warn('🟡 No inventory items');
        console.warn('   Add inventory via admin panel or run SQL inserts');
    } else {
        console.log('🟢 All systems operational!');
        console.log('   Platform is ready to use');
    }

    return results;
}

// Auto-run diagnostics
runDiagnostics().then(results => {
    console.log('\n✅ Diagnostic test complete!');
    console.log('Results:', results);
}).catch(error => {
    console.error('❌ Diagnostic test failed:', error);
});
