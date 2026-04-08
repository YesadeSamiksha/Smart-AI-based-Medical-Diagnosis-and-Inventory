// Authentication Module for MedAI Platform
// Handles user registration, login, logout, and session management

// ==================== USER REGISTRATION ====================
async function signUp(email, password, fullName) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        // Create auth user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: 'user'
                }
            }
        });

        if (error) throw error;

        // Create profile entry
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    email: email,
                    full_name: fullName,
                    role: 'user'
                });

            if (profileError) {
                console.warn('Profile creation warning:', profileError.message);
            }
        }

        return { data, error: null };
    } catch (error) {
        console.error('Sign up error:', error);
        return { data: null, error };
    }
}

// ==================== USER LOGIN ====================
async function signIn(email, password) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Store user info in localStorage for quick access
        if (data.user) {
            const profile = await getProfile(data.user.id);
            localStorage.setItem('medai_user', JSON.stringify({
                id: data.user.id,
                email: data.user.email,
                name: profile?.full_name || data.user.email,
                role: profile?.role || 'user',
                loggedIn: true
            }));
        }

        return { data, error: null };
    } catch (error) {
        console.error('Sign in error:', error);
        return { data: null, error };
    }
}

// ==================== ADMIN LOGIN ====================
async function signInAdmin(email, password) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Check if user is admin
        const profile = await getProfile(data.user.id);
        
        if (!profile || profile.role !== 'admin') {
            await supabase.auth.signOut();
            throw new Error('Access denied. Admin privileges required.');
        }

        // Store admin info
        localStorage.setItem('medai_user', JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            name: profile.full_name || data.user.email,
            role: 'admin',
            loggedIn: true
        }));

        return { data, error: null };
    } catch (error) {
        console.error('Admin sign in error:', error);
        return { data: null, error };
    }
}

// ==================== USER LOGOUT ====================
async function signOut() {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // Clear local storage
        localStorage.removeItem('medai_user');
        
        return { error: null };
    } catch (error) {
        console.error('Sign out error:', error);
        return { error };
    }
}

// ==================== GET CURRENT USER ====================
async function getCurrentUser() {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return null;

    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
}

// ==================== GET USER PROFILE ====================
async function getProfile(userId) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Get profile error:', error);
        return null;
    }
}

// ==================== UPDATE PROFILE ====================
async function updateProfile(userId, updates) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Update profile error:', error);
        return { data: null, error };
    }
}

// ==================== CHECK AUTH STATE ====================
async function checkAuthState() {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return false;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    } catch (error) {
        console.error('Check auth state error:', error);
        return false;
    }
}

// ==================== REQUIRE AUTH (Redirect if not logged in) ====================
async function requireAuth(redirectUrl = 'login.html') {
    const isAuthenticated = await checkAuthState();
    if (!isAuthenticated) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

// ==================== REQUIRE ADMIN ====================
async function requireAdmin(redirectUrl = 'login-admin.html') {
    const isAuthenticated = await checkAuthState();
    if (!isAuthenticated) {
        window.location.href = redirectUrl;
        return false;
    }

    const user = await getCurrentUser();
    if (user) {
        const profile = await getProfile(user.id);
        if (!profile || profile.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'dashboard.html';
            return false;
        }
    }
    return true;
}

// ==================== PASSWORD RESET ====================
async function resetPassword(email) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Reset password error:', error);
        return { data: null, error };
    }
}

// ==================== SOCIAL LOGIN (Google) ====================
async function signInWithGoogle() {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard.html'
            }
        });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Google sign in error:', error);
        return { data: null, error };
    }
}

// ==================== LISTEN TO AUTH CHANGES ====================
function onAuthStateChange(callback) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return null;

    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

// Export functions
window.MedAIAuth = {
    signUp,
    signIn,
    signInAdmin,
    signOut,
    getCurrentUser,
    getProfile,
    updateProfile,
    checkAuthState,
    requireAuth,
    requireAdmin,
    resetPassword,
    signInWithGoogle,
    onAuthStateChange
};
