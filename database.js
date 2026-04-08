// Database Operations for MedAI Platform
// Handles diagnosis results CRUD operations

// ==================== SAVE DIAGNOSIS RESULT ====================
async function saveDiagnosisResult(diagnosisType, inputData, resultData, riskLevel) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const user = await window.MedAIAuth.getCurrentUser();
        if (!user) {
            return { error: { message: 'User not authenticated' } };
        }

        const { data, error } = await supabase
            .from('diagnosis_results')
            .insert({
                user_id: user.id,
                diagnosis_type: diagnosisType,
                input_data: inputData,
                result_data: resultData,
                risk_level: riskLevel
            })
            .select()
            .single();

        if (error) throw error;
        
        console.log('✅ Diagnosis result saved:', data.id);
        return { data, error: null };
    } catch (error) {
        console.error('Save diagnosis error:', error);
        return { data: null, error };
    }
}

// ==================== GET USER'S DIAGNOSIS HISTORY ====================
async function getDiagnosisHistory(limit = 10, diagnosisType = null) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const user = await window.MedAIAuth.getCurrentUser();
        if (!user) {
            return { error: { message: 'User not authenticated' } };
        }

        let query = supabase
            .from('diagnosis_results')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (diagnosisType) {
            query = query.eq('diagnosis_type', diagnosisType);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get diagnosis history error:', error);
        return { data: null, error };
    }
}

// ==================== GET SINGLE DIAGNOSIS RESULT ====================
async function getDiagnosisById(id) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const { data, error } = await supabase
            .from('diagnosis_results')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get diagnosis by ID error:', error);
        return { data: null, error };
    }
}

// ==================== DELETE DIAGNOSIS RESULT ====================
async function deleteDiagnosis(id) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const { error } = await supabase
            .from('diagnosis_results')
            .delete()
            .eq('id', id);

        if (error) throw error;
        console.log('✅ Diagnosis result deleted:', id);
        return { error: null };
    } catch (error) {
        console.error('Delete diagnosis error:', error);
        return { error };
    }
}

// ==================== GET ADMIN STATISTICS ====================
async function getAdminStats() {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        // Get total users count
        const { count: userCount, error: userError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Get total diagnosis count
        const { count: diagnosisCount, error: diagError } = await supabase
            .from('diagnosis_results')
            .select('*', { count: 'exact', head: true });

        // Get diagnosis breakdown by type
        const { data: diagnosisBreakdown, error: breakdownError } = await supabase
            .from('diagnosis_results')
            .select('diagnosis_type');

        // Get inventory stats
        const { data: inventoryData, error: invError } = await supabase
            .from('inventory')
            .select('id, status');

        // Calculate stats
        const breakdownCounts = {};
        if (diagnosisBreakdown) {
            diagnosisBreakdown.forEach(item => {
                breakdownCounts[item.diagnosis_type] = (breakdownCounts[item.diagnosis_type] || 0) + 1;
            });
        }

        const inventoryStats = {
            total: inventoryData?.length || 0,
            lowStock: inventoryData?.filter(i => i.status === 'low').length || 0
        };

        return {
            data: {
                totalUsers: userCount || 0,
                totalDiagnosis: diagnosisCount || 0,
                diagnosisBreakdown: breakdownCounts,
                inventory: inventoryStats
            },
            error: null
        };
    } catch (error) {
        console.error('Get admin stats error:', error);
        return { data: null, error };
    }
}

// ==================== GET ALL USERS (Admin) ====================
async function getAllUsers(limit = 50) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get all users error:', error);
        return { data: null, error };
    }
}

// ==================== GET ALL DIAGNOSIS (Admin) ====================
async function getAllDiagnosis(limit = 100) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const { data, error } = await supabase
            .from('diagnosis_results')
            .select(`
                *,
                profiles:user_id (full_name, email)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get all diagnosis error:', error);
        return { data: null, error };
    }
}

// ==================== GET RECENT ACTIVITY ====================
async function getRecentActivity(limit = 10) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const user = await window.MedAIAuth.getCurrentUser();
        if (!user) {
            return { error: { message: 'User not authenticated' } };
        }

        const { data, error } = await supabase
            .from('diagnosis_results')
            .select('id, diagnosis_type, risk_level, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get recent activity error:', error);
        return { data: null, error };
    }
}

// Export functions
window.MedAIDatabase = {
    saveDiagnosisResult,
    getDiagnosisHistory,
    getDiagnosisById,
    deleteDiagnosis,
    getAdminStats,
    getAllUsers,
    getAllDiagnosis,
    getRecentActivity
};
