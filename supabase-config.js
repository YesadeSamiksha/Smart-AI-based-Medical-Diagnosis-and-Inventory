// Supabase Configuration for MedAI Platform
// Project ID: ydhfwvlhwxhiivheepqo

(function() {
    'use strict';
    
    const SUPABASE_URL = 'https://ydhfwvlhwxhiivheepqo.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkaGZ3dmxod3hoaWl2aGVlcHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTIyNzAsImV4cCI6MjA4ODcyODI3MH0.fA8q85b237u67OeOdwuGTJj9n7oCJmJnfzMIt-IKrFI';

    // Store client instance
    let supabaseClient = null;

    // Initialize Supabase (call this after including the Supabase script)
    function initSupabase() {
        if (supabaseClient) {
            return supabaseClient;
        }
        
        // Check if Supabase SDK is loaded
        if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client initialized');
            return supabaseClient;
        }
        
        console.error('❌ Supabase library not loaded. Make sure to include the Supabase SDK script.');
        return null;
    }

    // Get the Supabase client instance
    function getSupabase() {
        if (!supabaseClient) {
            return initSupabase();
        }
        return supabaseClient;
    }

    // Export for use in other modules
    window.MedAISupabase = {
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        initSupabase,
        getSupabase
    };
    
    console.log('📦 MedAI Supabase config loaded');
})();
