
        const API_URL = 'http://localhost:5000/api';
        let adminToken = null;
        let riskChart = null;
        let typeChart = null;
        let userTrendChart = null;
        let userActivityChart = null;
        let allUsersData = []; // Store users data for filtering
        let allOrdersData = []; // Store orders data for filtering
        
        // AI Agent variables
        let aiAgentEnabled = false;
        let aiAgentInterval = null;
        let inventoryData = [];
        const LOW_STOCK_THRESHOLD = 10;
        const AUTO_REORDER_QUANTITY = 50;
        
        // =====================================================
        // SUPABASE CONNECTION & AUTHENTICATION HELPERS
        // =====================================================

        // Verify Supabase connection and get authenticated client
        function getSupabaseClient() {
            console.log('ðŸ” Verifying Supabase connection...');
            
            if (!window.MedAISupabase) {
                console.error('âŒ MedAISupabase not found on window object');
                return null;
            }
            
            const supabase = window.MedAISupabase.getSupabase();
            if (!supabase) {
                console.error('âŒ Supabase client not initialized');
                return null;
            }
            
            console.log('âœ… Supabase client verified');
            return supabase;
        }

        // Check authentication using localStorage admin token (not Supabase Auth)
        async function verifyAdminAuth() {
            console.log('ðŸ”‘ Verifying admin authentication via localStorage token...');
            
            try {
                const token = localStorage.getItem('medai_admin_token');
                const adminId = localStorage.getItem('medai_admin_id');
                const adminEmail = localStorage.getItem('medai_admin_email');
                
                if (!token || !token.startsWith('admin-authenticated-') || adminId !== 'single-admin-user') {
                    console.warn('âš ï¸ Invalid or missing admin token');
                    return { success: false, error: 'Authentication failed: Invalid admin session' };
                }
                
                if (adminEmail !== 'admin@medai.com') {
                    console.warn('âš ï¸ Unauthorized admin email');
                    return { success: false, error: 'Access denied: Unauthorized admin email' };
                }
                
                console.log('âœ… Admin token verified for:', adminEmail);
                return { 
                    success: true, 
                    user: { email: adminEmail, id: 'single-admin-user' }, 
                    profile: { role: 'admin', full_name: 'Administrator' },
                    message: `Welcome, Administrator` 
                };
                
            } catch (error) {
                console.error('âŒ Verification failed:', error);
                return { success: false, error: error.message };
            }
        }

        // User Activity Logging Function (uses localStorage admin token)
        async function logUserActivity(activityType, activityData = {}) {
            try {
                const supabase = getSupabaseClient();
                if (!supabase) return;
                
                // Skip auth check - admin uses localStorage token, not Supabase auth
                // Just log a console message instead
                console.log('ðŸ“ Activity:', activityType, activityData);
                
            } catch (error) {
                // Silently fail - activity logging shouldn't break the app
                console.debug('Activity logging error (non-critical):', error);
            }
        }

        // Load User Activity Data from Table
        async function loadUserActivityFromTable() {
            console.log('ðŸ“Š Loading user activity data...');
            
            try {
                const supabase = getSupabaseClient();
                if (!supabase) throw new Error('Supabase not available');
                
                // Get activity from last 7 days
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                
                const { data: activities, error } = await supabase
                    .from('user_activity')
                    .select('created_at, activity_type')
                    .gte('created_at', sevenDaysAgo.toISOString())
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.warn('âš ï¸ User activity table query failed:', error.message);
                    return null;
                }
                
                if (!activities || activities.length === 0) {
                    console.log('ðŸ“Š No activity data found in user_activity table');
                    return null;
                }
                
                // Group by date for chart
                const activityByDate = {};
                
                // Initialize last 7 days with 0
                for (let i = 0; i < 7; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    activityByDate[dateStr] = 0;
                }
                
                // Count activities by date
                activities.forEach(activity => {
                    const date = activity.created_at.split('T')[0];
                    if (activityByDate.hasOwnProperty(date)) {
                        activityByDate[date]++;
                    }
                });
                
                console.log('âœ… User activity data loaded:', Object.keys(activityByDate).length, 'days');
                console.log('ðŸ“Š Activity data:', activityByDate);
                
                return activityByDate;
                
            } catch (error) {
                console.warn('âš ï¸ Could not load user activity:', error.message);
                return null;
            }
        }

        // Helper function to determine maximum risk level
        function getMaxRiskLevel(riskSummary) {
            if (riskSummary.critical > 0) return 'critical';
            if (riskSummary.high > 0) return 'high';
            if (riskSummary.medium > 0) return 'medium';
            if (riskSummary.low > 0) return 'low';
            return 'none';
        }
        
        // Check existing session and initialize dashboard  
        document.addEventListener('DOMContentLoaded', async function() {
            console.log('ðŸ”§ Initializing admin dashboard...');
            
            try {
                // Simple admin token check - only one admin allowed
                const token = localStorage.getItem('medai_admin_token');
                const adminId = localStorage.getItem('medai_admin_id');
                const adminEmail = localStorage.getItem('medai_admin_email');
                
                if (!token || !token.startsWith('admin-authenticated-') || adminId !== 'single-admin-user') {
                    console.warn('âŒ Invalid or missing admin session');
                    window.location.href = 'login-admin.html';
                    return;
                }
                
                if (adminEmail !== 'admin@medai.com') {
                    console.warn('âŒ Unauthorized admin email');
                    localStorage.clear();
                    window.location.href = 'login-admin.html';
                    return;
                }
                
                console.log('âœ… Single admin authentication verified');
                showDashboard(adminEmail);
                
            } catch (error) {
                console.error('âŒ Dashboard initialization failed:', error);
                localStorage.clear();
                window.location.href = 'login-admin.html';
            }
        });
        
        async function verifyToken(token) {
            try {
                // Check if token is our local admin token
                if (token && token.startsWith('admin-authenticated-')) {
                    adminToken = token;
                    showDashboard('admin@medai.com');
                } else {
                    localStorage.removeItem('medai_admin_token');
                    // Redirect to admin login if invalid token
                    window.location.href = 'login-admin.html';
                }
            } catch (error) {
                console.error('Token verification failed:', error);
                localStorage.removeItem('medai_admin_token');
                window.location.href = 'login-admin.html';
            }
        }
        
        async function showDashboard(email) {
            console.log('ðŸ“Š Showing admin dashboard for:', email);
            
            try {
                // Hide loading overlay and show dashboard
                document.getElementById('loginOverlay').style.display = 'none';
                document.getElementById('adminDashboard').style.display = 'block';
                document.getElementById('adminEmailDisplay').textContent = email;
                
                // Load dashboard data with mock data as fallback
                console.log('ðŸ”„ Loading dashboard data...');
                
                // Try to load real data, but use mock data if Supabase fails
                try {
                    await Promise.all([
                        loadStatsWithFallback().catch(error => console.error('âŒ Failed to load stats:', error)),
                        loadUsersWithFallback().catch(error => console.error('âŒ Failed to load users:', error)),
                        loadOrdersWithFallback().catch(error => console.error('âŒ Failed to load orders:', error))
                    ]);
                } catch (error) {
                    console.warn('âš ï¸ Using fallback data due to database errors');
                    showMockDashboardData();
                }
                
                console.log('âœ… Admin dashboard loaded successfully');
                
            } catch (error) {
                console.error('âŒ Error showing dashboard:', error);
                
                // Still show dashboard but with error message
                document.getElementById('loginOverlay').style.display = 'none';
                document.getElementById('adminDashboard').style.display = 'block';
                document.getElementById('adminEmailDisplay').textContent = email;
                
                // Show mock data instead
                showMockDashboardData();
            }
        }
        
        // Show mock data when Supabase is not working
        function showMockDashboardData() {
            console.log('ðŸ“Š Loading mock dashboard data...');
            
            // Mock stats
            document.getElementById('totalUsers').textContent = '25';
            document.getElementById('totalDiagnoses').textContent = '127';
            document.getElementById('todayDiagnoses').textContent = '8';
            document.getElementById('highRiskCount').textContent = '3';
            
            // Mock user stats
            document.getElementById('usersTotalCount').textContent = '25';
            document.getElementById('usersActiveToday').textContent = '8';
            document.getElementById('usersWithAssessments').textContent = '22';
            document.getElementById('usersHighRisk').textContent = '3';
            
            // Mock order stats
            document.getElementById('ordersTotal').textContent = '45';
            document.getElementById('ordersPending').textContent = '12';
            document.getElementById('ordersDelivered').textContent = '33';
            document.getElementById('ordersRevenue').textContent = 'â‚¹8,450.00';
            
            // Show mock users table
            showMockUserData();
            
            // Show mock orders table  
            showMockOrderData();
            
            // Mock charts
            renderMockCharts();
        }
        
        // Mock order data
        function showMockOrderData() {
            const tbody = document.getElementById('ordersTableBody');
            if (!tbody) return;
            
            const mockOrders = [
                {
                    id: 'ORD001',
                    user_email: 'user1@example.com',
                    items: [{ name: 'Blood Pressure Monitor', quantity: 1, price: 2500 }],
                    total: 2500,
                    order_status: 'delivered',
                    created_at: '2024-04-07T10:30:00Z'
                },
                {
                    id: 'ORD002', 
                    user_email: 'user2@example.com',
                    items: [{ name: 'Digital Thermometer', quantity: 2, price: 800 }],
                    total: 1600,
                    order_status: 'pending',
                    created_at: '2024-04-08T14:20:00Z'
                }
            ];
            
            tbody.innerHTML = mockOrders.map(order => `
                <tr class="border-b border-gray-700 hover:bg-gray-800 transition-colors duration-200">
                    <td class="py-3 px-4 font-mono text-sm">${order.id}</td>
                    <td class="py-3 px-4">${order.user_email}</td>
                    <td class="py-3 px-4">
                        <div class="text-sm">
                            ${order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                        </div>
                    </td>
                    <td class="py-3 px-4 font-semibold">â‚¹${order.total}</td>
                    <td class="py-3 px-4">
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${
                            order.order_status === 'delivered' ? 'bg-green-600 text-green-100' :
                            order.order_status === 'pending' ? 'bg-yellow-600 text-yellow-100' :
                            'bg-gray-600 text-gray-100'
                        }">
                            ${order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                        </span>
                    </td>
                    <td class="py-3 px-4 text-gray-400 text-sm">${formatDate(order.created_at)}</td>
                    <td class="py-3 px-4">
                        <button onclick="viewOrder('${order.id}')" class="text-purple-400 hover:text-purple-300">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
        
        // Fallback functions that try real data first, then mock
        async function loadStatsWithFallback() {
            try {
                await loadStats();
            } catch (error) {
                console.warn('âš ï¸ Stats loading failed, using mock data');
                // Mock stats already set in showMockDashboardData
            }
        }
        
        async function loadUsersWithFallback() {
            try {
                await loadUsers();
            } catch (error) {
                console.warn('âš ï¸ Users loading failed, using mock data');
                showMockUserData();
            }
        }
        
        async function loadOrdersWithFallback() {
            try {
                await loadOrders();
            } catch (error) {
                console.warn('âš ï¸ Orders loading failed, using mock data');
                showMockOrderData();
            }
        }
        
        // Logout - Clear all admin session data
        document.getElementById('logoutBtn').addEventListener('click', async function() {
            console.log('ðŸšª Admin logout initiated...');
            
            // Clear all admin session data
            localStorage.removeItem('medai_admin_token');
            localStorage.removeItem('medai_admin_email');
            localStorage.removeItem('medai_admin_id');
            
            // Clear legacy data
            adminToken = null;
            
            console.log('âœ… Admin session cleared');
            
            // Redirect to login
            window.location.href = 'login-admin.html';
        });
        
        // Load admin stats from Supabase
        async function loadStats() {
            console.log('ðŸ“Š Loading admin stats...');
            try {
                const supabase = window.MedAISupabase.getSupabase();
                if (!supabase) throw new Error('Supabase not initialized');
                
                // Get registered users from profiles table
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, email, created_at');
                
                if (profilesError) {
                    console.warn('Could not load profiles:', profilesError.message);
                }
                
                const totalUsers = profilesData?.length || 0;
                console.log('ðŸ‘¥ Total registered users:', totalUsers);
                
                // Get total diagnoses
                const { data: diagnosesData, error: diagError } = await supabase
                    .from('diagnosis_results')
                    .select('*');
                
                if (diagError) {
                    console.warn('Could not load diagnoses:', diagError.message);
                }
                
                const totalDiagnoses = diagnosesData?.length || 0;
                console.log('ðŸ¥ Total diagnoses:', totalDiagnoses);
                
                // Get today's diagnoses
                const today = new Date().toISOString().split('T')[0];
                const todayDiagnoses = diagnosesData?.filter(d => 
                    d.created_at?.startsWith(today)
                ).length || 0;
                console.log('ðŸ“… Today diagnoses:', todayDiagnoses);
                
                // Calculate risk distribution
                const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
                diagnosesData?.forEach(d => {
                    if (d.risk_level && riskCounts.hasOwnProperty(d.risk_level)) {
                        riskCounts[d.risk_level]++;
                    }
                });
                console.log('âš ï¸ Risk distribution:', riskCounts);
                
                // Calculate type distribution
                const typeCounts = { diabetes: 0, lung: 0, bp: 0, symptoms: 0 };
                diagnosesData?.forEach(d => {
                    if (d.diagnosis_type) {
                        typeCounts[d.diagnosis_type] = (typeCounts[d.diagnosis_type] || 0) + 1;
                    }
                });
                console.log('ðŸ“‹ Diagnosis types:', typeCounts);
                
                const highRiskCount = (riskCounts.high || 0) + (riskCounts.critical || 0);
                
                // Update UI
                document.getElementById('totalUsers').textContent = totalUsers;
                document.getElementById('totalDiagnoses').textContent = totalDiagnoses;
                document.getElementById('todayDiagnoses').textContent = todayDiagnoses;
                document.getElementById('highRiskCount').textContent = highRiskCount;
                
                console.log('âœ… Stats updated in UI');
                
                // Render charts with real data
                const chartData = {
                    chart_data: {
                        risk_labels: Object.keys(riskCounts).filter(k => riskCounts[k] > 0 || k !== 'critical'),
                        risk_values: Object.keys(riskCounts).filter(k => riskCounts[k] > 0 || k !== 'critical').map(k => riskCounts[k]),
                        type_labels: Object.keys(typeCounts),
                        type_values: Object.values(typeCounts)
                    }
                };
                renderCharts(chartData);
                
            } catch (error) {
                console.error('âŒ Failed to load stats:', error);
                // Set default values if error
                document.getElementById('totalUsers').textContent = '0';
                document.getElementById('totalDiagnoses').textContent = '0';
                document.getElementById('todayDiagnoses').textContent = '0';
                document.getElementById('highRiskCount').textContent = '0';
            }
        }
        
        function renderCharts(data) {
            console.log('ðŸ“Š Rendering charts with data:', data);
            
            try {
                // Risk distribution chart
                const riskCtx = document.getElementById('riskChart');
                if (!riskCtx) {
                    console.error('Risk chart canvas not found');
                    return;
                }
                
                if (riskChart) riskChart.destroy();
                
                // Default risk labels and values
                const riskLabels = data.chart_data?.risk_labels || ['Low', 'Medium', 'High'];
                const riskValues = data.chart_data?.risk_values || [0, 0, 0];
                
                // Check if there's any data
                const hasRiskData = riskValues.some(v => v > 0);
                
                riskChart = new Chart(riskCtx.getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: riskLabels.map(r => r.charAt(0).toUpperCase() + r.slice(1)),
                        datasets: [{
                            data: hasRiskData ? riskValues : [1, 1, 1], // Show placeholder if no data
                            backgroundColor: hasRiskData 
                                ? ['#22c55e', '#eab308', '#ef4444', '#dc2626']
                                : ['#374151', '#374151', '#374151'], // Gray if no data
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { 
                                position: 'bottom', 
                                labels: { color: '#d1d5db' } 
                            },
                            title: {
                                display: !hasRiskData,
                                text: 'No risk data yet',
                                color: '#6b7280'
                            }
                        }
                    }
                });
                
                // Type distribution chart
                const typeCtx = document.getElementById('typeChart');
                if (!typeCtx) {
                    console.error('Type chart canvas not found');
                    return;
                }
                
                if (typeChart) typeChart.destroy();
                
                const typeLabels = data.chart_data?.type_labels || ['Diabetes', 'Lung', 'BP', 'Symptoms'];
                const typeValues = data.chart_data?.type_values || [0, 0, 0, 0];
                
                // Check if there's any data
                const hasTypeData = typeValues.some(v => v > 0);
                
                typeChart = new Chart(typeCtx.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: typeLabels.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
                        datasets: [{
                            label: 'Count',
                            data: typeValues,
                            backgroundColor: ['#f9a8d4', '#93c5fd', '#fca5a5', '#a78bfa'],
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { display: false },
                            title: {
                                display: !hasTypeData,
                                text: 'No diagnosis data yet',
                                color: '#6b7280'
                            }
                        },
                        scales: {
                            y: { 
                                beginAtZero: true,
                                grid: { color: 'rgba(255,255,255,0.1)' }, 
                                ticks: { color: '#9ca3af', stepSize: 1 } 
                            },
                            x: { grid: { display: false }, ticks: { color: '#d1d5db' } }
                        }
                    }
                });
                
                console.log('âœ… Charts rendered successfully');
            } catch (error) {
                console.error('âŒ Error rendering charts:', error);
            }
        }
        
        // Load users from Supabase with comprehensive error handling
        async function loadUsers() {
            console.log('ðŸ‘¥ Loading user list and analytics...');
            
            const tbody = document.getElementById('usersTableBody');
            if (!tbody) {
                console.error('âŒ Users table body element not found');
                return;
            }
            
            // Show loading state
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-8">
                        <i class="fas fa-spinner fa-spin mr-2 text-blue-400"></i>
                        Loading users...
                    </td>
                </tr>`;
            
            try {
                const supabase = getSupabaseClient();
                
                // If Supabase is not available, show mock data
                if (!supabase) {
                    console.warn('âš ï¸ Supabase not available, showing mock data');
                    showMockUserData();
                    return;
                }
                
                // No Supabase auth check needed - admin verified via localStorage token before dashboard loads
                console.log('ðŸ‘¥ Fetching users from profiles table (anon key)...');
                
                // Get all user profiles
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, email, full_name, role, created_at, updated_at')
                    .order('created_at', { ascending: false });
                
                if (profilesError) {
                    console.error('âŒ Profiles query error:', profilesError);
                    throw new Error(`Could not load user profiles: ${profilesError.message}`);
                }
                
                console.log(`âœ… Profiles fetched: ${profilesData?.length || 0} users found`);
                
                console.log('ðŸ“Š Fetching diagnosis data...');
                
                // Get all diagnosis results for analysis
                const { data: diagnosesData, error: diagError } = await supabase
                    .from('diagnosis_results')
                    .select('user_id, diagnosis_type, risk_level, created_at')
                    .order('created_at', { ascending: false });
                
                if (diagError) {
                    console.warn('âš ï¸ Could not load diagnosis data:', diagError.message);
                }
                
                console.log(`âœ… Diagnoses fetched: ${diagnosesData?.length || 0} records found`);
                
                // Calculate activity statistics
                const today = new Date().toISOString().split('T')[0];
                const activeToday = new Set();
                const last7Days = {};
                
                // Initialize last 7 days
                for (let i = 0; i < 7; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    last7Days[date.toISOString().split('T')[0]] = 0;
                }
                
                // Group diagnoses by user
                const diagnosisByUser = {};
                
                diagnosesData?.forEach(d => {
                    const userId = d.user_id;
                    const diagDate = d.created_at?.split('T')[0];
                    
                    // Track activity today
                    if (diagDate === today) {
                        activeToday.add(userId);
                    }
                    
                    // Track last 7 days activity
                    if (last7Days.hasOwnProperty(diagDate)) {
                        last7Days[diagDate]++;
                    }
                    
                    // Initialize user diagnosis data
                    if (!diagnosisByUser[userId]) {
                        diagnosisByUser[userId] = {
                            total_assessments: 0,
                            last_assessment: null,
                            risk_summary: { low: 0, medium: 0, high: 0, critical: 0 },
                            diagnosis_history: []
                        };
                    }
                    
                    // Update user diagnosis stats
                    diagnosisByUser[userId].total_assessments++;
                    if (d.risk_level && diagnosisByUser[userId].risk_summary.hasOwnProperty(d.risk_level)) {
                        diagnosisByUser[userId].risk_summary[d.risk_level]++;
                    }
                    
                    diagnosisByUser[userId].diagnosis_history.push(d);
                    
                    // Update last assessment time
                    if (!diagnosisByUser[userId].last_assessment || 
                        new Date(d.created_at) > new Date(diagnosisByUser[userId].last_assessment)) {
                        diagnosisByUser[userId].last_assessment = d.created_at;
                    }
                });
                
                console.log('ðŸ”„ Merging user and diagnosis data...');
                
                // Build complete user statistics
                const users = (profilesData || []).map(profile => ({
                    id: profile.id,
                    email: profile.email,
                    full_name: profile.full_name || 'User',
                    role: profile.role || 'user',
                    registered_at: profile.created_at,
                    total_assessments: diagnosisByUser[profile.id]?.total_assessments || 0,
                    last_assessment: diagnosisByUser[profile.id]?.last_assessment || null,
                    risk_summary: diagnosisByUser[profile.id]?.risk_summary || { low: 0, medium: 0, high: 0, critical: 0 },
                    max_risk: getMaxRiskLevel(diagnosisByUser[profile.id]?.risk_summary || {})
                }));
                
                // Store users data globally
                allUsersData = users;
                
                console.log(`âœ… User data processed: ${users.length} users with merged diagnosis data`);
                
                // Update analytics cards
                const usersWithAssessments = users.filter(u => u.total_assessments > 0).length;
                const highRiskUsers = users.filter(u => u.max_risk === 'high' || u.max_risk === 'critical').length;
                
                // Update UI elements
                const elements = {
                    usersTotalCount: users.length,
                    usersActiveToday: activeToday.size,
                    usersWithAssessments: usersWithAssessments,
                    usersHighRisk: highRiskUsers
                };
                
                Object.entries(elements).forEach(([id, value]) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.textContent = value;
                    } else {
                        console.warn(`âš ï¸ Element not found: ${id}`);
                    }
                });
                
                console.log('ðŸ“Š Analytics updated:', elements);
                
                // Load user activity chart data
                let activityData = await loadUserActivityFromTable();
                
                // Fallback to diagnosis-based activity if user_activity table is empty
                if (!activityData || Object.keys(activityData).length === 0) {
                    console.log('ðŸ“Š Using diagnosis-based activity tracking as fallback');
                    activityData = last7Days;
                }
                
                // Render user activity chart
                if (typeof renderUserActivityChart === 'function') {
                    renderUserActivityChart(activityData);
                } else {
                    console.warn('âš ï¸ renderUserActivityChart function not found');
                }
                
                // Render users table
                if (typeof renderUsersTable === 'function') {
                    renderUsersTable(users);
                } else {
                    console.warn('âš ï¸ renderUsersTable function not found');
                }
                
                // Log admin activity
                await logUserActivity('admin_view_users', { 
                    user_count: users.length,
                    users_with_assessments: usersWithAssessments,
                    high_risk_users: highRiskUsers,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error('âŒ Failed to load users:', error);
                
                let errorMessage = 'Failed to load users';
                let technicalDetails = error.message;
                
                // Provide specific error guidance
                if (error.message.includes('Please login')) {
                    errorMessage = 'Authentication required';
                    technicalDetails = 'Please login to access the admin dashboard';
                } else if (error.message.includes('Access denied')) {
                    errorMessage = 'Access denied';
                    technicalDetails = 'Your account does not have admin privileges';
                }
                
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-8">
                            <div class="text-red-400">
                                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                                <div class="font-semibold">${errorMessage}</div>
                                <div class="text-sm text-gray-500 mt-1">${technicalDetails}</div>
                                <button onclick="loadUsers()" class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    <i class="fas fa-refresh mr-2"></i>Retry
                                </button>
                            </div>
                        </td>
                    </tr>`;
            }
        }
        
        // Show mock user data when Supabase is not available
        function showMockUserData() {
            const mockUsers = [
                {
                    id: 'mock-1',
                    email: 'user1@example.com',
                    full_name: 'John Doe',
                    role: 'user',
                    registered_at: '2024-01-15T10:30:00Z',
                    total_assessments: 5,
                    last_assessment: '2024-04-07T14:20:00Z',
                    risk_summary: { low: 2, medium: 2, high: 1, critical: 0 },
                    max_risk: 'high'
                },
                {
                    id: 'mock-2',
                    email: 'user2@example.com',
                    full_name: 'Jane Smith',
                    role: 'user',
                    registered_at: '2024-02-20T08:15:00Z',
                    total_assessments: 3,
                    last_assessment: '2024-04-06T16:45:00Z',
                    risk_summary: { low: 3, medium: 0, high: 0, critical: 0 },
                    max_risk: 'low'
                }
            ];
            
            allUsersData = mockUsers;
            
            // Update analytics with mock data
            document.getElementById('usersTotalCount').textContent = '2';
            document.getElementById('usersActiveToday').textContent = '1';
            document.getElementById('usersWithAssessments').textContent = '2';
            document.getElementById('usersHighRisk').textContent = '1';
            
            // Render mock data
            if (typeof renderUsersTable === 'function') {
                renderUsersTable(mockUsers);
            }
            
            // Mock activity data for chart
            const mockActivity = {
                '2024-04-07': 2,
                '2024-04-06': 1,
                '2024-04-05': 0,
                '2024-04-04': 1,
                '2024-04-03': 0,
                '2024-04-02': 1,
                '2024-04-01': 0
            };
            
            if (typeof renderUserActivityChart === 'function') {
                renderUserActivityChart(mockActivity);
            }
        }
        
        // Show mock order data when Supabase is not available
        function showMockOrderData() {
            console.log('ðŸ“¦ Showing mock order data...');
            const mockOrders = [
                {
                    id: 'ORD-001',
                    user_id: 'user-1',
                    customer_name: 'John Doe',
                    customer_email: 'john@example.com',
                    items: JSON.stringify([
                        { name: 'Paracetamol 500mg', quantity: 2, price: 45 },
                        { name: 'Vitamin C', quantity: 1, price: 120 }
                    ]),
                    total: 210,
                    order_status: 'delivered',
                    payment_status: 'completed',
                    created_at: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: 'ORD-002',
                    user_id: 'user-2',
                    customer_name: 'Jane Smith',
                    customer_email: 'jane@example.com',
                    items: JSON.stringify([
                        { name: 'Blood Pressure Monitor', quantity: 1, price: 1499 }
                    ]),
                    total: 1499,
                    order_status: 'pending',
                    payment_status: 'completed',
                    created_at: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    id: 'ORD-003',
                    user_id: 'user-3',
                    customer_name: 'Raj Kumar',
                    customer_email: 'raj@example.com',
                    items: JSON.stringify([
                        { name: 'Metformin 500mg', quantity: 3, price: 85 },
                        { name: 'Glucometer', quantity: 1, price: 899 }
                    ]),
                    total: 1154,
                    order_status: 'processing',
                    payment_status: 'completed',
                    created_at: new Date(Date.now() - 7200000).toISOString()
                }
            ];
            
            allOrdersData = mockOrders;
            updateOrderStats(mockOrders);
            renderOrdersTable(mockOrders);
        }
        
        // Load user activity for the last 7 days from user_activity table
        async function loadUserActivityFromTable() {
            try {
                const supabase = window.MedAISupabase.getSupabase();
                if (!supabase) throw new Error('Supabase not initialized');
                
                // Get activity from last 7 days
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                
                const { data: activities, error } = await supabase
                    .from('user_activity')
                    .select('*')
                    .gte('created_at', sevenDaysAgo.toISOString())
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.warn('âš ï¸ User activity table not accessible:', error.message);
                    return null;
                }
                
                // Group by date
                const activityByDate = {};
                activities.forEach(activity => {
                    const date = activity.created_at.split('T')[0];
                    activityByDate[date] = (activityByDate[date] || 0) + 1;
                });
                
                console.log('âœ… Loaded user activity from user_activity table:', Object.keys(activityByDate).length, 'days with activity');
                return activityByDate;
            } catch (error) {
                console.warn('âš ï¸ Could not load user activity:', error.message);
                return null;
            }
        }
        
        // NOTE: logUserActivity is defined earlier (line ~931) â€” using localStorage token only
        
        // Get max risk level for a user
        function getMaxRiskLevel(riskSummary) {
            if (riskSummary.critical > 0) return 'critical';
            if (riskSummary.high > 0) return 'high';
            if (riskSummary.medium > 0) return 'medium';
            if (riskSummary.low > 0) return 'low';
            return 'none';
        }
        
        // Render user activity chart for last 7 days
        function renderUserActivityChart(last7Days) {
            const ctx = document.getElementById('userActivityChart');
            if (!ctx) return;
            
            if (userActivityChart) userActivityChart.destroy();
            
            const dates = Object.keys(last7Days).sort();
            const values = dates.map(d => last7Days[d]);
            const labels = dates.map(d => {
                const date = new Date(d);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });
            
            userActivityChart = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Assessments',
                        data: values,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#8b5cf6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `${ctx.parsed.y} assessments`
                            }
                        }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.1)' }, 
                            ticks: { color: '#9ca3af', stepSize: 1 } 
                        },
                        x: { grid: { display: false }, ticks: { color: '#d1d5db' } }
                    }
                }
            });
        }
        
        // Render users table
        function renderUsersTable(users) {
            const tbody = document.getElementById('usersTableBody');
            
            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-gray-400 py-8">No users found. Users will appear here after they sign up.</td></tr>';
                return;
            }
            
            tbody.innerHTML = users.map(user => {
                const riskSummary = user.risk_summary || {};
                const riskBadges = Object.entries(riskSummary)
                    .filter(([risk, count]) => count > 0)
                    .map(([risk, count]) => `<span class="risk-badge risk-${risk}">${count} ${risk}</span>`)
                    .join(' ') || '<span class="text-gray-500">No assessments</span>';
                
                const roleBadge = user.role === 'admin' 
                    ? '<span class="text-xs bg-purple-600 px-2 py-0.5 rounded ml-2">Admin</span>' 
                    : '';
                
                return `
                    <tr data-user-id="${user.id}" data-risk="${user.max_risk}">
                        <td>
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                                    ${(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                                </div>
                                <span>${user.full_name || 'Unknown'}${roleBadge}</span>
                            </div>
                        </td>
                        <td class="text-gray-400">${user.email || 'N/A'}</td>
                        <td class="text-gray-400">${user.registered_at ? formatDate(user.registered_at) : 'N/A'}</td>
                        <td>${user.total_assessments || 0}</td>
                        <td class="text-gray-400">${user.last_assessment ? formatDate(user.last_assessment) : 'Never'}</td>
                        <td>${riskBadges}</td>
                        <td>
                            <button class="view-btn" onclick="viewUserDetails('${user.id}')">
                                <i class="fas fa-eye mr-1"></i>View
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        // Filter users by search term
        function filterUsers(searchTerm) {
            const search = searchTerm.toLowerCase();
            const filtered = allUsersData.filter(user => 
                (user.full_name || '').toLowerCase().includes(search) ||
                (user.email || '').toLowerCase().includes(search)
            );
            renderUsersTable(filtered);
        }
        
        // Filter users by risk level
        function filterUsersByRisk(riskLevel) {
            let filtered;
            if (riskLevel === 'all') {
                filtered = allUsersData;
            } else if (riskLevel === 'none') {
                filtered = allUsersData.filter(u => u.total_assessments === 0);
            } else {
                filtered = allUsersData.filter(u => u.max_risk === riskLevel || (riskLevel === 'high' && u.max_risk === 'critical'));
            }
            renderUsersTable(filtered);
        }
        
        // Export users to CSV
        function exportUsersCSV() {
            if (allUsersData.length === 0) {
                alert('No user data to export');
                return;
            }
            
            const headers = ['Name', 'Email', 'Registered', 'Assessments', 'Last Activity', 'Max Risk'];
            const rows = allUsersData.map(u => [
                u.full_name || 'Unknown',
                u.email || 'N/A',
                u.registered_at ? formatDate(u.registered_at) : 'N/A',
                u.total_assessments || 0,
                u.last_assessment ? formatDate(u.last_assessment) : 'Never',
                u.max_risk || 'none'
            ]);
            
            const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `medai-users-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        function formatDate(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        
        // View user details (simplified without backend dependency)
        async function viewUserDetails(userId) {
            const modal = document.getElementById('userModal');
            modal.style.display = 'flex';
            
            document.getElementById('trendsSummary').innerHTML = '<p class="col-span-4 text-center text-gray-400">Loading...</p>';
            document.getElementById('userHistory').innerHTML = '<p class="text-center text-gray-400 py-8">Loading...</p>';
            
            try {
                const supabase = window.MedAISupabase.getSupabase();
                if (!supabase) throw new Error('Supabase not initialized');
                
                // Try to get user profile info
                let userInfo = allUsersData.find(u => u.id === userId);
                if (!userInfo) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('email, full_name')
                        .eq('id', userId)
                        .single();
                    userInfo = profile || { email: 'Unknown', full_name: `User ${userId.substring(0, 8)}` };
                }
                
                // Update modal title with actual user info
                const userName = userInfo.full_name || userInfo.email || `User ${userId.substring(0, 8)}`;
                document.getElementById('modalUserName').innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xl">
                            ${userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="text-xl font-bold">${userName}</div>
                            <div class="text-sm text-gray-400">${userInfo.email || 'N/A'}</div>
                        </div>
                    </div>
                `;
                
                // Get user's diagnosis history
                const { data: history, error } = await supabase
                    .from('diagnosis_results')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                
                // Calculate trends
                const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
                const typeCounts = {};
                const riskHistory = [];
                
                history?.forEach(item => {
                    riskCounts[item.risk_level] = (riskCounts[item.risk_level] || 0) + 1;
                    typeCounts[item.diagnosis_type] = (typeCounts[item.diagnosis_type] || 0) + 1;
                    
                    // For trend chart
                    const riskValue = { low: 1, medium: 2, high: 3, critical: 4 }[item.risk_level] || 0;
                    riskHistory.push({ date: item.created_at, value: riskValue });
                });
                
                const mostCommon = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
                const avgRisk = history?.length > 0 ? 
                    Object.entries(riskCounts).reduce((total, [risk, count]) => {
                        const weights = { low: 1, medium: 2, high: 3, critical: 4 };
                        return total + (weights[risk] || 1) * count;
                    }, 0) / history.length : 0;
                
                const trends = {
                    total_assessments: history?.length || 0,
                    most_common: mostCommon ? mostCommon[0] : 'N/A',
                    health_trend: avgRisk > 2.5 ? 'needs attention' : avgRisk > 1.5 ? 'stable' : 'good',
                    average_risk: avgRisk < 1.5 ? 'Low' : avgRisk < 2.5 ? 'Medium' : 'High'
                };
                
                // Render trends summary
                const trendClass = trends.health_trend === 'good' ? 'trend-improving' : 
                                   trends.health_trend === 'needs attention' ? 'trend-worsening' : 'trend-stable';
                
                document.getElementById('trendsSummary').innerHTML = `
                    <div class="trend-card">
                        <div class="trend-value text-blue-400">${trends.total_assessments || 0}</div>
                        <div class="trend-label">Total Assessments</div>
                    </div>
                    <div class="trend-card">
                        <div class="trend-value text-purple-400">${trends.most_common || 'N/A'}</div>
                        <div class="trend-label">Most Common</div>
                    </div>
                    <div class="trend-card">
                        <div class="trend-value ${trendClass}">${trends.health_trend.replace('_', ' ')}</div>
                        <div class="trend-label">Health Trend</div>
                    </div>
                    <div class="trend-card">
                        <div class="trend-value text-yellow-400">${trends.average_risk || 'N/A'}</div>
                        <div class="trend-label">Avg Risk Score</div>
                    </div>
                `;
                
                // Render history
                if (!history || history.length === 0) {
                    document.getElementById('userHistory').innerHTML = '<p class="text-center text-gray-400 py-8">No diagnosis history</p>';
                } else {
                    document.getElementById('userHistory').innerHTML = history.slice(0, 10).map(item => `
                        <div class="history-item">
                            <div>
                                <div class="font-semibold">${(item.diagnosis_type || 'unknown').charAt(0).toUpperCase() + (item.diagnosis_type || '').slice(1)}</div>
                                <div class="text-sm text-gray-400">${formatDate(item.created_at)}</div>
                            </div>
                            <span class="risk-badge risk-${item.risk_level}">${item.risk_level}</span>
                        </div>
                    `).join('');
                }
                
                // Render trend chart if there's data
                if (riskHistory.length > 0) {
                    renderUserTrendChart({
                        risk_values: riskHistory.slice(0, 10).map(r => r.value),
                        risk_labels: riskHistory.slice(0, 10).map(r => formatDate(r.date))
                    });
                }
                
            } catch (err) {
                console.error('Error loading user details:', err);
                document.getElementById('trendsSummary').innerHTML = '<p class="col-span-4 text-center text-red-400">Failed to load trends</p>';
                document.getElementById('userHistory').innerHTML = '<p class="text-center text-red-400 py-8">Failed to load history</p>';
            }
        }
        
        function renderUserTrendChart(chartData) {
            const ctx = document.getElementById('userTrendChart').getContext('2d');
            if (userTrendChart) userTrendChart.destroy();
            
            const values = chartData?.risk_values || [];
            const labels = chartData?.risk_labels || [];
            
            if (values.length === 0) {
                return;
            }
            
            userTrendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels.map((_, i) => `#${i + 1}`).reverse(),
                    datasets: [{
                        label: 'Risk Level',
                        data: values.reverse(),
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            min: 0,
                            max: 4,
                            ticks: {
                                callback: v => ['', 'Low', 'Medium', 'High', 'Critical'][v] || '',
                                color: '#9ca3af'
                            },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        x: { ticks: { color: '#9ca3af' }, grid: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
        
        function closeModal() {
            document.getElementById('userModal').style.display = 'none';
        }
        
        // Tab switching in modal
        document.querySelectorAll('.modal-content .tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.modal-content .tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.modal-content .tab-content').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                document.getElementById(`tab-${this.dataset.tab}`).classList.add('active');
            });
        });
        
        // Search users
        document.getElementById('userSearch').addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const rows = document.querySelectorAll('#usersTableBody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
        
        // Close modal on outside click
        document.getElementById('userModal').addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
        
        // ===== ADMIN TAB SWITCHING =====
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                // Update button states
                document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Update sections
                document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
                document.getElementById(`section-${this.dataset.section}`).classList.add('active');
                
                // Load data for the section
                if (this.dataset.section === 'inventory') {
                    loadInventory();
                    initAIAgent();
                } else if (this.dataset.section === 'orders') {
                    loadOrders();
                } else if (this.dataset.section === 'trends') {
                    loadTrendsData();
                }
            });
        });
        
        // ===== ORDERS MANAGEMENT =====
        
        async function loadOrders() {
            console.log('ðŸ“¦ Loading orders...');
            const tbody = document.getElementById('ordersTableBody');
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8"><i class="fas fa-spinner fa-spin mr-2"></i>Loading orders...</td></tr>';
            
            try {
                const supabase = window.MedAISupabase?.getSupabase();
                if (!supabase) {
                    console.warn('âš ï¸ Supabase not available, showing mock orders');
                    showMockOrderData();
                    return;
                }
                
                // No Supabase auth check needed - admin verified via localStorage token before dashboard loads
                console.log('âœ… Loading orders (anon key)...');
                
                // Get all orders
                const { data: orders, error } = await supabase
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.warn('âš ï¸ Orders query error (using mock data):', error.message);
                    showMockOrderData();
                    return;
                }
                
                allOrdersData = orders || [];
                console.log(`âœ… Loaded ${allOrdersData.length} orders`);
                
                if (allOrdersData.length === 0) {
                    showMockOrderData();
                    return;
                }
                
                updateOrderStats(allOrdersData);
                renderOrdersTable(allOrdersData);
                await logUserActivity('admin_view_orders', { order_count: allOrdersData.length });
                
            } catch (error) {
                console.warn('âš ï¸ Failed to load orders, using mock data:', error.message);
                showMockOrderData();
            }
        }
        
        // ===== TRENDS & MEDICINE PREDICTION =====
        let trendDiseaseChart = null, trendMonthlyChart = null, trendRiskChart = null, trendActivityChart = null;
        
        async function loadTrendsData() {
            console.log('ðŸ“ˆ Loading trends and prediction data...');
            try {
                const supabase = window.MedAISupabase?.getSupabase();
                let diagnoses = [], orders = [], activities = [];
                
                if (supabase) {
                    // Fetch all diagnosis results (anon key - no auth needed after RLS fix)
                    const { data: diagData } = await supabase
                        .from('diagnosis_results')
                        .select('id, user_id, diagnosis_type, risk_level, created_at, result_data')
                        .order('created_at', { ascending: false });
                    diagnoses = diagData || [];
                    
                    // Fetch orders for medicine demand context
                    const { data: orderData } = await supabase
                        .from('orders')
                        .select('id, items, total, created_at, order_status')
                        .order('created_at', { ascending: false });
                    orders = orderData || [];
                    
                    // Fetch user activity
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    const { data: actData } = await supabase
                        .from('user_activity')
                        .select('activity_type, created_at')
                        .gte('created_at', sevenDaysAgo.toISOString());
                    activities = actData || [];
                }
                
                // If no real data, use rich mock data
                if (diagnoses.length === 0) {
                    diagnoses = generateMockDiagnoses();
                }
                
                analyzeTrendsAndRender(diagnoses, orders, activities);
                
            } catch (err) {
                console.warn('âš ï¸ Trends: using mock data:', err.message);
                analyzeTrendsAndRender(generateMockDiagnoses(), [], []);
            }
        }
        
        function generateMockDiagnoses() {
            const types = ['diabetes', 'lung', 'bp', 'symptoms'];
            const risks = ['low', 'medium', 'high', 'critical'];
            const now = new Date();
            return Array.from({length: 85}, (_, i) => {
                const d = new Date(now);
                d.setDate(d.getDate() - Math.floor(Math.random() * 180));
                return {
                    id: `mock-${i}`,
                    diagnosis_type: types[Math.floor(Math.random() * types.length)],
                    risk_level: risks[Math.floor(Math.random() * (risks.length - 1))],
                    created_at: d.toISOString()
                };
            });
        }
        
        function analyzeTrendsAndRender(diagnoses, orders, activities) {
            // Safety guards
            diagnoses = Array.isArray(diagnoses) ? diagnoses : [];
            orders = Array.isArray(orders) ? orders : [];
            activities = Array.isArray(activities) ? activities : [];
            
            // --- KPI CARDS ---
            const highRisk = diagnoses.filter(d => d.risk_level === 'high' || d.risk_level === 'critical').length;
            if (document.getElementById('trend-total-assessments')) document.getElementById('trend-total-assessments').textContent = diagnoses.length;
            if (document.getElementById('trend-high-risk')) document.getElementById('trend-high-risk').textContent = highRisk;
            
            // Dominant disease
            const typeCounts = {};
            diagnoses.forEach(d => {
                typeCounts[d.diagnosis_type] = (typeCounts[d.diagnosis_type] || 0) + 1;
            });
            const dominant = Object.entries(typeCounts).sort((a,b) => b[1]-a[1])[0];
            const diseaseLabels = { diabetes: 'Diabetes', lung: 'Lung Disease', bp: 'Blood Pressure', symptoms: 'Symptom Check' };
            if (document.getElementById('trend-dominant-disease')) document.getElementById('trend-dominant-disease').textContent = dominant ? (diseaseLabels[dominant[0]] || dominant[0]) : 'â€”';
            
            // Monthly growth (compare last 30 days vs prev 30)
            const now = new Date();
            const last30 = diagnoses.filter(d => (now - new Date(d.created_at)) < 30*86400000).length;
            const prev30 = diagnoses.filter(d => {
                const age = now - new Date(d.created_at);
                return age >= 30*86400000 && age < 60*86400000;
            }).length;
            const growth = prev30 > 0 ? Math.round(((last30 - prev30) / prev30) * 100) : 0;
            if (document.getElementById('trend-growth')) {
                document.getElementById('trend-growth').textContent = (growth >= 0 ? '+' : '') + growth + '%';
                document.getElementById('trend-growth').className = `stat-big ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`;
            }
            
            // --- DISEASE TYPE CHART ---
            try {
                const diseaseCtx = document.getElementById('trendDiseaseChart');
                if (diseaseCtx && Object.keys(typeCounts).length > 0) {
                    if (trendDiseaseChart) trendDiseaseChart.destroy();
                    trendDiseaseChart = new Chart(diseaseCtx, {
                        type: 'doughnut',
                        data: {
                            labels: Object.keys(typeCounts).map(k => diseaseLabels[k] || k),
                            datasets: [{
                                data: Object.values(typeCounts),
                                backgroundColor: ['#3b82f6','#8b5cf6','#ef4444','#06b6d4'],
                                borderColor: 'rgba(0,0,0,0.3)', borderWidth: 2
                            }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#ccc' } } } }
                    });
                }
            } catch(e) { console.warn('Disease chart error:', e.message); }
            
            // --- MONTHLY TREND CHART (last 6 months) ---
            const monthBuckets = {};
            for (let i = 5; i >= 0; i--) {
                const d = new Date(); d.setMonth(d.getMonth() - i);
                monthBuckets[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`] = 0;
            }
            diagnoses.forEach(d => {
                const key = d.created_at?.substring(0, 7);
                if (key && monthBuckets.hasOwnProperty(key)) monthBuckets[key]++;
            });
            try {
                const monthCtx = document.getElementById('trendMonthlyChart');
                if (monthCtx) {
                    if (trendMonthlyChart) trendMonthlyChart.destroy();
                    trendMonthlyChart = new Chart(monthCtx, {
                        type: 'line',
                        data: {
                            labels: Object.keys(monthBuckets).map(k => { const [y,m] = k.split('-'); return new Date(y,m-1).toLocaleString('default',{month:'short',year:'2-digit'}); }),
                            datasets: [{
                                label: 'Diagnoses',
                                data: Object.values(monthBuckets),
                                borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.15)',
                                tension: 0.4, fill: true, pointBackgroundColor: '#06b6d4'
                            }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#9ca3af', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } } }, plugins: { legend: { labels: { color: '#ccc' } } } }
                    });
                }
            } catch(e) { console.warn('Monthly chart error:', e.message); }
            
            // --- RISK CHART ---
            const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
            diagnoses.forEach(d => { if (riskCounts.hasOwnProperty(d.risk_level)) riskCounts[d.risk_level]++; });
            try {
                const riskCtxEl = document.getElementById('trendRiskChart');
                if (riskCtxEl) {
                    if (trendRiskChart) trendRiskChart.destroy();
                    trendRiskChart = new Chart(riskCtxEl, {
                        type: 'bar',
                        data: {
                            labels: ['Low', 'Medium', 'High', 'Critical'],
                            datasets: [{
                                label: 'Cases',
                                data: [riskCounts.low, riskCounts.medium, riskCounts.high, riskCounts.critical],
                                backgroundColor: ['#22c55e','#f59e0b','#ef4444','#7f1d1d'],
                                borderRadius: 6
                            }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#9ca3af' }, grid: { display: false } }, y: { ticks: { color: '#9ca3af', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } } }, plugins: { legend: { display: false } } }
                    });
                }
            } catch(e) { console.warn('Risk chart error:', e.message); }
            
            // --- MEDICINE DEMAND PREDICTION ---
            // Based on diagnosis types + real orders, predict medicines needed
            const medicinePrediction = predictMedicineDemand(typeCounts, riskCounts, orders);
            const predList = document.getElementById('medicinePredictionList');
            if (predList) {
                if (medicinePrediction.length === 0) {
                    predList.innerHTML = '<div class="text-center text-gray-400 py-4 text-sm">No diagnosis data available yet. Predictions will appear once users complete health assessments.</div>';
                } else {
                    predList.innerHTML = medicinePrediction.map(med => `
                        <div class="flex items-center justify-between p-3 rounded-lg" style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);">
                            <div>
                                <div class="font-semibold text-sm">${med.name}</div>
                                <div class="text-xs text-gray-400">${med.reason}</div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold text-green-400 text-sm">${med.units} units</div>
                                <div class="text-xs ${med.priority === 'High' ? 'text-red-400' : med.priority === 'Medium' ? 'text-yellow-400' : 'text-gray-400'}">${med.priority} Priority</div>
                            </div>
                        </div>`).join('');
                }
            }
            
            // --- AI INSIGHTS ---
            let insights = [];
            try {
                insights = generateAIInsights(diagnoses, typeCounts, riskCounts, growth, orders);
            } catch(e) {
                console.warn('AI insights generation error:', e.message);
                insights = [{ icon: 'ðŸ¥', title: 'System Ready', detail: 'Insights will appear once diagnosis data is available from real user assessments.' }];
            }
            const insightsList = document.getElementById('aiInsightsList');
            if (insightsList) {
                const safeInsights = Array.isArray(insights) ? insights : [];
                if (safeInsights.length === 0) {
                    insightsList.innerHTML = '<div class="text-center text-gray-400 py-4 text-sm">Insights will appear after users complete health assessments.</div>';
                } else {
                    insightsList.innerHTML = safeInsights.map(ins => `
                        <div class="flex gap-3 p-3 rounded-lg" style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);">
                            <div class="text-2xl flex-shrink-0">${ins.icon}</div>
                            <div>
                                <div class="font-semibold text-sm text-purple-300">${ins.title}</div>
                                <div class="text-xs text-gray-300 mt-1">${ins.detail}</div>
                            </div>
                        </div>`).join('');
                }
            }
            
            // --- ACTIVITY CHART (diagnoses + user_activity combined) ---
            const activityByDay = {};
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today); d.setDate(d.getDate() - i);
                activityByDay[d.toISOString().split('T')[0]] = 0;
            }
            // Combine diagnoses + activities for chart
            [...diagnoses, ...activities].forEach(item => {
                const key = item.created_at?.split('T')[0];
                if (key && activityByDay.hasOwnProperty(key)) activityByDay[key]++;
            });
            try {
                const actCtx = document.getElementById('trendActivityChart');
                if (actCtx) {
                    if (trendActivityChart) trendActivityChart.destroy();
                    trendActivityChart = new Chart(actCtx, {
                        type: 'bar',
                        data: {
                            labels: Object.keys(activityByDay).map(d => new Date(d + 'T12:00:00').toLocaleDateString('default',{weekday:'short',month:'short',day:'numeric'})),
                            datasets: [{
                                label: 'Health Assessments',
                                data: Object.values(activityByDay),
                                backgroundColor: 'rgba(59,130,246,0.6)',
                                borderColor: '#3b82f6', borderWidth: 1, borderRadius: 4
                            }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#9ca3af', font: {size:10} }, grid: { display: false } }, y: { ticks: { color: '#9ca3af', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } } }, plugins: { legend: { display: false } } }
                    });
                }
            } catch(e) { console.warn('Activity chart error:', e.message); }
            
            // Activity breakdown â€” show unique users and order stats
            const breakdown = document.getElementById('activityBreakdownList');
            if (breakdown) {
                const totalAssessments = diagnoses.length;
                const totalOrders = orders.length;
                const uniqueUsers = new Set(diagnoses.map(d => d.user_id).filter(Boolean)).size;
                const pendingOrders = orders.filter(o => o.order_status === 'pending').length;
                const typeOfActivity = {};
                activities.forEach(a => { typeOfActivity[a.activity_type] = (typeOfActivity[a.activity_type]||0)+1; });
                const breakdownItems = Object.entries(typeOfActivity).slice(0,3);
                breakdown.innerHTML = `
                    <div class="text-sm font-semibold text-gray-300 mb-2">Platform Summary</div>
                    <div class="flex justify-between text-xs py-1 border-b border-gray-700">
                        <span class="text-gray-300">Total Assessments</span>
                        <span class="text-blue-400 font-bold">${totalAssessments}</span>
                    </div>
                    <div class="flex justify-between text-xs py-1 border-b border-gray-700">
                        <span class="text-gray-300">Unique Patients</span>
                        <span class="text-purple-400 font-bold">${uniqueUsers}</span>
                    </div>
                    <div class="flex justify-between text-xs py-1 border-b border-gray-700">
                        <span class="text-gray-300">Total Orders</span>
                        <span class="text-green-400 font-bold">${totalOrders}</span>
                    </div>
                    <div class="flex justify-between text-xs py-1 border-b border-gray-700">
                        <span class="text-gray-300">Pending Orders</span>
                        <span class="text-yellow-400 font-bold">${pendingOrders}</span>
                    </div>
                    ${breakdownItems.map(([k,v]) => `
                        <div class="flex justify-between text-xs py-1 border-b border-gray-700">
                            <span class="text-gray-300">${k.replace(/_/g,' ')}</span>
                            <span class="text-blue-400 font-bold">${v}</span>
                        </div>`).join('')}
                `;
            }
            
            console.log(`âœ… Trends analysis complete â€” ${diagnoses.length} diagnoses, ${orders.length} orders, ${activities.length} activities`);
        }
        
        function predictMedicineDemand(typeCounts, riskCounts, orders) {
            const predictions = [];
            const diabCount = typeCounts['diabetes'] || 0;
            const bpCount = typeCounts['bp'] || 0;
            const lungCount = typeCounts['lung'] || 0;
            const sympCount = typeCounts['symptoms'] || 0;
            const highRiskTotal = (riskCounts.high||0) + (riskCounts.critical||0);
            
            if (diabCount > 0) predictions.push({ name: 'Metformin 500mg', units: Math.ceil(diabCount * 3.5), reason: `Based on ${diabCount} diabetes assessments`, priority: highRiskTotal > 5 ? 'High' : 'Medium' });
            if (diabCount > 0) predictions.push({ name: 'Insulin Pens', units: Math.ceil((riskCounts.high||0) * 2), reason: 'For high-risk diabetic patients', priority: riskCounts.critical > 0 ? 'High' : 'Low' });
            if (bpCount > 0) predictions.push({ name: 'Amlodipine 5mg', units: Math.ceil(bpCount * 2.8), reason: `Based on ${bpCount} BP assessments`, priority: riskCounts.high > 3 ? 'High' : 'Medium' });
            if (bpCount > 0) predictions.push({ name: 'Blood Pressure Monitor', units: Math.ceil(bpCount * 0.4), reason: 'Patient monitoring devices', priority: 'Medium' });
            if (lungCount > 0) predictions.push({ name: 'Salbutamol Inhaler', units: Math.ceil(lungCount * 2), reason: `Based on ${lungCount} lung assessments`, priority: riskCounts.high > 2 ? 'High' : 'Medium' });
            if (sympCount > 0) predictions.push({ name: 'Paracetamol 500mg', units: Math.ceil(sympCount * 4), reason: 'General symptom management', priority: 'Low' });
            predictions.push({ name: 'Vitamin D3 Supplements', units: Math.ceil((diabCount+bpCount) * 1.5), reason: 'Preventive care recommendation', priority: 'Low' });
            predictions.push({ name: 'Glucometer Strips', units: Math.ceil(diabCount * 5), reason: 'Daily monitoring for diabetic patients', priority: diabCount > 10 ? 'High' : 'Medium' });
            
            return predictions.filter(p => p.units > 0).sort((a,b) => ['High','Medium','Low'].indexOf(a.priority) - ['High','Medium','Low'].indexOf(b.priority));
        }
        
        function generateAIInsights(diagnoses, typeCounts, riskCounts, growth, orders) {
            const insights = [];
            const total = diagnoses.length;
            const highRisk = (riskCounts.high||0) + (riskCounts.critical||0);
            const dominant = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1])[0];
            const diseaseLabels = { diabetes: 'Diabetes', lung: 'Lung Disease', bp: 'Blood Pressure', symptoms: 'General Symptoms' };
            
            if (highRisk > total * 0.3) {
                insights.push({ icon: 'ðŸš¨', title: 'High Risk Alert', detail: `${Math.round(highRisk/total*100)}% of patients are high or critical risk. Recommend immediate inventory stocking of emergency medicines and scheduling follow-ups.` });
            }
            if (dominant) {
                insights.push({ icon: 'ðŸ“Š', title: `${diseaseLabels[dominant[0]] || dominant[0]} is the Leading Condition`, detail: `${dominant[1]} cases (${Math.round(dominant[1]/total*100)}%). Consider targeted awareness campaigns and stocking disease-specific medications at 20% above current levels.` });
            }
            if (growth > 15) {
                insights.push({ icon: 'ðŸ“ˆ', title: 'Rapid Patient Growth Detected', detail: `${growth}% increase in diagnoses this month. Proactively increase all medicine inventory by ${Math.min(growth, 40)}% to meet projected demand.` });
            } else if (growth < -10) {
                insights.push({ icon: 'ðŸ“‰', title: 'Assessment Activity Declining', detail: `${Math.abs(growth)}% fewer diagnoses. Consider patient outreach programs and reminder notifications to encourage health check-ins.` });
            }
            if ((riskCounts.medium||0) > total * 0.4) {
                insights.push({ icon: 'âš ï¸', title: 'Large Medium-Risk Population', detail: `${riskCounts.medium} medium-risk patients require preventive medication. Stock lifestyle management drugs (Metformin, statins, antihypertensives) proactively.` });
            }
            if ((typeCounts['diabetes']||0) > 0 && (typeCounts['bp']||0) > 0) {
                insights.push({ icon: 'ðŸ’Š', title: 'Comorbidity Pattern Detected', detail: `Both diabetes and hypertension are prevalent. These conditions often co-occur. Stock combination therapy medications and ensure BP monitors are available.` });
            }
            if (orders.length > 0) {
                const revenue = orders.reduce((s,o) => s + (parseFloat(o.total)||0), 0);
                insights.push({ icon: 'ðŸ’°', title: `â‚¹${revenue.toFixed(0)} Total Order Revenue`, detail: `${orders.length} orders processed. Top selling items likely align with diagnosis trends. Review inventory to ensure supply matches patient need.` });
            }
            insights.push({ icon: 'ðŸ¥', title: 'Preventive Care Opportunity', detail: 'Regular health monitoring reduces emergency admissions by up to 35%. Recommend sending monthly health reminder notifications to all registered users.' });
            
            return insights;
        }
        
        function updateOrderStats(orders) {
            document.getElementById('ordersTotal').textContent = orders.length;
            
            const pending = orders.filter(o => o.order_status === 'pending').length;
            document.getElementById('ordersPending').textContent = pending;
            
            const delivered = orders.filter(o => o.order_status === 'delivered').length;
            document.getElementById('ordersDelivered').textContent = delivered;
            
            const revenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
            document.getElementById('ordersRevenue').textContent = `â‚¹${revenue.toFixed(2)}`;
        }
        
        function renderOrdersTable(orders) {
            const tbody = document.getElementById('ordersTableBody');
            
            if (!orders || orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center text-gray-400 py-8">No orders found</td></tr>';
                return;
            }
            
            tbody.innerHTML = orders.map(order => {
                const items = Array.isArray(order.items) ? order.items : (order.items ? JSON.parse(order.items) : []);
                const itemCount = items.length;
                const itemNames = items.slice(0, 2).map(i => i.name).join(', ');
                const moreText = itemCount > 2 ? ` +${itemCount - 2} more` : '';
                
                const statusColors = {
                    pending: 'text-yellow-400 bg-yellow-400/20',
                    processing: 'text-blue-400 bg-blue-400/20',
                    delivered: 'text-green-400 bg-green-400/20',
                    cancelled: 'text-red-400 bg-red-400/20'
                };
                
                const paymentColors = {
                    pending: 'text-yellow-400',
                    completed: 'text-green-400',
                    failed: 'text-red-400'
                };
                
                return `
                    <tr>
                        <td class="font-mono text-sm">
                            ${order.id.substring(0, 8)}...
                        </td>
                        <td>
                            <div class="text-sm">User ID: ${order.user_id.substring(0, 8)}...</div>
                        </td>
                        <td>
                            <div class="text-sm">${itemNames}${moreText}</div>
                            <div class="text-xs text-gray-500">${itemCount} item(s)</div>
                        </td>
                        <td class="text-green-400 font-bold">â‚¹${parseFloat(order.total || 0).toFixed(2)}</td>
                        <td>
                            <div class="${paymentColors[order.payment_status] || 'text-gray-400'}">${order.payment_method || 'COD'}</div>
                            <div class="text-xs">${order.payment_status || 'pending'}</div>
                        </td>
                        <td>
                            <span class="px-2 py-1 rounded text-xs ${statusColors[order.order_status] || 'text-gray-400'}">
                                ${order.order_status || 'pending'}
                            </span>
                        </td>
                        <td class="text-gray-400 text-sm">${formatDate(order.created_at)}</td>
                        <td>
                            <select onchange="updateOrderStatus('${order.id}', this.value)" 
                                    class="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm">
                                <option value="">Update...</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        function filterOrders(status) {
            if (status === 'all') {
                renderOrdersTable(allOrdersData);
            } else {
                const filtered = allOrdersData.filter(o => o.order_status === status);
                renderOrdersTable(filtered);
            }
        }
        
        async function updateOrderStatus(orderId, newStatus) {
            if (!newStatus) return;
            
            try {
                const supabase = window.MedAISupabase.getSupabase();
                if (!supabase) throw new Error('Supabase not initialized');
                
                const { error } = await supabase
                    .from('orders')
                    .update({ 
                        order_status: newStatus,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', orderId);
                
                if (error) throw error;
                
                alert(`âœ… Order status updated to ${newStatus}`);
                loadOrders(); // Reload to show updated status
                
            } catch (error) {
                console.error('Error updating order:', error);
                alert(`âŒ Failed to update order: ${error.message}`);
            }
        }
        
        // ===== INVENTORY MANAGEMENT =====
        
        async function loadInventory() {
            const tbody = document.getElementById('inventoryTableBody');
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</td></tr>';
            
            try {
                const supabase = window.MedAISupabase.getSupabase();
                if (!supabase) throw new Error('Supabase not initialized');
                
                const { data, error } = await supabase
                    .from('inventory')
                    .select('*')
                    .order('name');
                
                if (error) throw error;
                
                inventoryData = data || [];
                console.log('âœ… Loaded inventory:', inventoryData.length, 'items');
                renderInventory(inventoryData);
                updateInventoryStats(inventoryData);
                
            } catch (error) {
                console.error('âŒ Failed to load inventory:', error);
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-red-400 py-8">Failed to load inventory: ${error.message}</td></tr>`;
            }
        }
        
        function renderInventory(items) {
            const tbody = document.getElementById('inventoryTableBody');
            
            if (!items || items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-400 py-8">No items in inventory. Click "Add New Item" to get started.</td></tr>';
                return;
            }
            
            tbody.innerHTML = items.map(item => {
                const stock = item.quantity || 0;
                let statusClass, statusText;
                
                if (stock === 0) {
                    statusClass = 'stock-out';
                    statusText = 'Out of Stock';
                } else if (stock < 10) {
                    statusClass = 'stock-low';
                    statusText = 'Low Stock';
                } else {
                    statusClass = 'stock-ok';
                    statusText = 'In Stock';
                }
                
                return `
                    <tr>
                        <td>
                            <div class="font-semibold text-white">${item.name || 'Unnamed'}</div>
                            ${item.description ? `<small class="text-gray-400">${item.description.substring(0, 50)}...</small>` : ''}
                        </td>
                        <td class="text-gray-300 capitalize">${item.category || 'N/A'}</td>
                        <td class="text-white font-bold">${stock}</td>
                        <td class="text-green-400">â‚¹${parseFloat(item.price || 0).toFixed(2)}</td>
                        <td><span class="stock-badge ${statusClass}">${statusText}</span></td>
                        <td>
                            <button onclick="editItem('${item.id}')" class="action-btn btn-edit" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteItem('${item.id}', '${item.name}')" class="action-btn btn-delete" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        function updateInventoryStats(items) {
            document.getElementById('invTotalItems').textContent = items.length;
            
            const totalStock = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            document.getElementById('invTotalStock').textContent = totalStock;
            
            const lowStock = items.filter(item => item.quantity > 0 && item.quantity < 10).length;
            document.getElementById('invLowStock').textContent = lowStock;
            
            const outOfStock = items.filter(item => !item.quantity || item.quantity === 0).length;
            document.getElementById('invOutOfStock').textContent = outOfStock;
        }
        
        function openAddItemModal() {
            document.getElementById('itemModalTitle').textContent = 'Add New Item';
            document.getElementById('itemForm').reset();
            document.getElementById('itemId').value = '';
            document.getElementById('itemModal').style.display = 'flex';
        }
        
        async function editItem(itemId) {
            const item = inventoryData.find(i => i.id === itemId);
            if (!item) return;
            
            document.getElementById('itemModalTitle').textContent = 'Edit Item';
            document.getElementById('itemId').value = item.id;
            document.getElementById('itemName').value = item.name || '';
            document.getElementById('itemCategory').value = item.category || '';
            document.getElementById('itemStock').value = item.quantity || 0;
            document.getElementById('itemPrice').value = item.price || 0;
            document.getElementById('itemDescription').value = item.description || '';
            
            document.getElementById('itemModal').style.display = 'flex';
        }
        
        function closeItemModal() {
            document.getElementById('itemModal').style.display = 'none';
        }
        
        document.getElementById('itemForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const itemId = document.getElementById('itemId').value;
            const itemData = {
                name: document.getElementById('itemName').value,
                category: document.getElementById('itemCategory').value,
                quantity: parseInt(document.getElementById('itemStock').value),
                price: parseFloat(document.getElementById('itemPrice').value),
                description: document.getElementById('itemDescription').value
            };
            
            try {
                const supabase = window.MedAISupabase.getSupabase();
                if (!supabase) throw new Error('Supabase not initialized');
                
                if (itemId) {
                    // Update existing
                    const { error } = await supabase
                        .from('inventory')
                        .update(itemData)
                        .eq('id', itemId);
                    
                    if (error) throw error;
                    alert('âœ… Item updated successfully!');
                } else {
                    // Insert new
                    const { error } = await supabase
                        .from('inventory')
                        .insert([itemData]);
                    
                    if (error) throw error;
                    alert('âœ… Item added successfully!');
                }
                
                closeItemModal();
                loadInventory();
                
            } catch (error) {
                console.error('Save error:', error);
                alert('âŒ Failed to save item: ' + error.message);
            }
        });
        
        async function deleteItem(itemId, itemName) {
            if (!confirm(`Are you sure you want to delete "${itemName}"?\n\nThis action cannot be undone.`)) {
                return;
            }
            
            try {
                const supabase = window.MedAISupabase.getSupabase();
                if (!supabase) throw new Error('Supabase not initialized');
                
                const { error } = await supabase
                    .from('inventory')
                    .delete()
                    .eq('id', itemId);
                
                if (error) throw error;
                
                alert('âœ… Item deleted successfully!');
                loadInventory();
                
            } catch (error) {
                console.error('Delete error:', error);
                alert('âŒ Failed to delete item: ' + error.message);
            }
        }
        
        // Close item modal on outside click
        document.getElementById('itemModal').addEventListener('click', function(e) {
            if (e.target === this) closeItemModal();
        });
        
        // ============================================
        // AI AGENT FUNCTIONS
        // ============================================
        
        // Initialize AI Agent on page load
        async function initAIAgent() {
            // Check if AI agent was previously enabled
            const savedState = localStorage.getItem('aiAgentEnabled');
            if (savedState === 'true') {
                document.getElementById('aiAgentToggle').checked = true;
                aiAgentEnabled = true;
                startAIAgent();
            }
            
            // Load AI activity log
            await loadAIActivityLog();
            
            // Update AI stats
            updateAIStats();
        }
        
        // Toggle AI Agent on/off
        function toggleAIAgent(enabled) {
            aiAgentEnabled = enabled;
            localStorage.setItem('aiAgentEnabled', enabled);
            
            if (enabled) {
                startAIAgent();
                addAILog('AI Agent enabled - monitoring inventory', 'success');
            } else {
                stopAIAgent();
                addAILog('AI Agent disabled', 'info');
            }
            
            updateAIAgentStatus();
        }
        
        // Start AI Agent monitoring
        function startAIAgent() {
            stopAIAgent(); // Clear any existing interval
            
            // Run immediately
            runAIAgent();
            
            // Set up periodic checking (every 5 minutes)
            aiAgentInterval = setInterval(() => {
                runAIAgent();
            }, 5 * 60 * 1000); // 5 minutes
            
            updateAIAgentStatus();
        }
        
        // Stop AI Agent
        function stopAIAgent() {
            if (aiAgentInterval) {
                clearInterval(aiAgentInterval);
                aiAgentInterval = null;
            }
            updateAIAgentStatus();
        }
        
        // Update AI Agent status display
        function updateAIAgentStatus() {
            const statusEl = document.getElementById('aiAgentStatus');
            if (aiAgentEnabled) {
                statusEl.innerHTML = '<i class="fas fa-check-circle text-green-400 mr-1"></i>Active - Auto-monitoring enabled';
            } else {
                statusEl.innerHTML = '<i class="fas fa-pause-circle text-gray-400 mr-1"></i>Inactive - Enable to start monitoring';
            }
        }
        
        // Run AI Agent analysis and actions
        async function runAIAgent() {
            console.log('ðŸ¤– AI Agent: Running inventory analysis...');
            
            try {
                const supabase = window.MedAISupabase.getSupabase();
                if (!supabase) throw new Error('Supabase not initialized');
                
                // Get current inventory
                const { data: inventory, error: invError } = await supabase
                    .from('inventory')
                    .select('*');
                
                if (invError) throw invError;
                
                inventoryData = inventory || [];
                
                // Analyze inventory
                const lowStockItems = inventory.filter(item => 
                    item.quantity > 0 && item.quantity < LOW_STOCK_THRESHOLD
                );
                const outOfStockItems = inventory.filter(item => 
                    !item.quantity || item.quantity === 0
                );
                
                console.log(`ðŸ¤– AI Agent: Found ${lowStockItems.length} low stock, ${outOfStockItems.length} out of stock`);
                
                // Auto-reorder low stock items if AI is enabled
                if (aiAgentEnabled) {
                    for (const item of lowStockItems) {
                        await createAutoReorder(item);
                    }
                    
                    for (const item of outOfStockItems) {
                        await createAutoReorder(item, true);
                    }
                }
                
                // Generate AI insights
                await generateAIInsights(inventory, lowStockItems, outOfStockItems);
                
                // Update stats
                await updateAIStats();
                
                // Update last check time
                document.getElementById('aiLastCheck').textContent = new Date().toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                if (lowStockItems.length > 0 || outOfStockItems.length > 0) {
                    addAILog(
                        `Analyzed ${inventory.length} items - ${lowStockItems.length} low stock alerts, ${outOfStockItems.length} out of stock`,
                        'warning'
                    );
                } else {
                    addAILog(`Analyzed ${inventory.length} items - all stock levels healthy`, 'success');
                }
                
            } catch (error) {
                console.error('âŒ AI Agent error:', error);
                addAILog(`Error during analysis: ${error.message}`, 'warning');
            }
        }
        
        // Create auto-reorder for low/out of stock items
        async function createAutoReorder(item, isUrgent = false) {
            try {
                const supabase = window.MedAISupabase.getSupabase();
                if (!supabase) return;
                
                // Check if there's already a pending reorder for this item
                const { data: existing } = await supabase
                    .from('auto_reorders')
                    .select('id')
                    .eq('item_id', item.id)
                    .eq('status', 'pending')
                    .single();
                
                if (existing) {
                    console.log(`ðŸ¤– AI Agent: Reorder already exists for ${item.name}`);
                    return;
                }
                
                // Calculate reorder quantity (3x threshold for normal, 5x for urgent)
                const reorderQty = isUrgent ? AUTO_REORDER_QUANTITY * 2 : AUTO_REORDER_QUANTITY;
                
                // Expected delivery: 3-5 days from now
                const expectedDelivery = new Date();
                expectedDelivery.setDate(expectedDelivery.getDate() + (isUrgent ? 3 : 5));
                
                // Create auto-reorder
                const { error } = await supabase
                    .from('auto_reorders')
                    .insert([{
                        item_id: item.id,
                        item_name: item.name,
                        quantity: reorderQty,
                        status: 'pending',
                        expected_delivery: expectedDelivery.toISOString()
                    }]);
                
                if (error) throw error;
                
                console.log(`âœ… AI Agent: Created auto-reorder for ${item.name} (${reorderQty} units)`);
                addAILog(
                    `Auto-ordered ${reorderQty} units of "${item.name}" - Current stock: ${item.quantity || 0}`,
                    'success'
                );
                
            } catch (error) {
                console.error('âŒ AI Agent reorder error:', error);
            }
        }
        
        // Generate AI insights
        async function generateAIInsights(inventory, lowStock, outOfStock) {
            const insightsEl = document.getElementById('aiInsights');
            const insights = [];
            
            // Stock alerts
            if (outOfStock.length > 0) {
                insights.push(`
                    <div class="mb-2">
                        <i class="fas fa-exclamation-triangle text-red-400 mr-2"></i>
                        <strong class="text-red-400">Critical:</strong> ${outOfStock.length} item(s) out of stock
                        ${aiAgentEnabled ? ' - Auto-reorder initiated' : ' - Enable AI to auto-order'}
                    </div>
                `);
            }
            
            if (lowStock.length > 0) {
                insights.push(`
                    <div class="mb-2">
                        <i class="fas fa-exclamation-circle text-yellow-400 mr-2"></i>
                        <strong class="text-yellow-400">Warning:</strong> ${lowStock.length} item(s) low on stock
                        ${aiAgentEnabled ? ' - Auto-reorder scheduled' : ''}
                    </div>
                `);
            }
            
            // Healthy stock
            const healthyItems = inventory.filter(item => item.quantity >= LOW_STOCK_THRESHOLD);
            if (healthyItems.length > 0 && outOfStock.length === 0 && lowStock.length === 0) {
                insights.push(`
                    <div class="mb-2">
                        <i class="fas fa-check-circle text-green-400 mr-2"></i>
                        <strong class="text-green-400">All Good:</strong> All ${inventory.length} items have healthy stock levels
                    </div>
                `);
            }
            
            // Predictive insights
            const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
            insights.push(`
                <div class="mb-2">
                    <i class="fas fa-chart-line text-blue-400 mr-2"></i>
                    <strong>Total Inventory Value:</strong> â‚¹${totalValue.toFixed(2)}
                </div>
            `);
            
            // Top categories
            const categories = {};
            inventory.forEach(item => {
                const cat = item.category || 'uncategorized';
                categories[cat] = (categories[cat] || 0) + 1;
            });
            const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
            if (topCategory) {
                insights.push(`
                    <div class="mb-2">
                        <i class="fas fa-tags text-purple-400 mr-2"></i>
                        <strong>Most Stocked Category:</strong> ${topCategory[0]} (${topCategory[1]} items)
                    </div>
                `);
            }
            
            insightsEl.innerHTML = insights.join('');
        }
        
        // Update AI stats
        async function updateAIStats() {
            try {
                const supabase = window.MedAISupabase.getSupabase();
                if (!supabase) return;
                
                // Get auto orders count
                const { data: orders, error: ordersError } = await supabase
                    .from('auto_reorders')
                    .select('id, status');
                
                if (!ordersError) {
                    const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
                    document.getElementById('aiAutoOrders').textContent = pendingOrders;
                }
                
                // Items monitored
                document.getElementById('aiItemsMonitored').textContent = inventoryData.length;
                
                // Low stock alerts
                const lowStockCount = inventoryData.filter(item => 
                    item.quantity > 0 && item.quantity < LOW_STOCK_THRESHOLD
                ).length + inventoryData.filter(item => !item.quantity || item.quantity === 0).length;
                document.getElementById('aiLowStockAlerts').textContent = lowStockCount;
                
            } catch (error) {
                console.error('Error updating AI stats:', error);
            }
        }
        
        // Load AI activity log
        async function loadAIActivityLog() {
            const logEl = document.getElementById('aiActivityLog');
            
            try {
                const supabase = window.MedAISupabase.getSupabase();
                if (!supabase) throw new Error('Supabase not initialized');
                
                const { data: orders, error } = await supabase
                    .from('auto_reorders')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(20);
                
                if (error) throw error;
                
                if (!orders || orders.length === 0) {
                    logEl.innerHTML = `
                        <div class="text-center text-gray-400 py-8">
                            <i class="fas fa-info-circle mr-2"></i>No AI activity yet
                        </div>
                    `;
                    return;
                }
                
                logEl.innerHTML = orders.map(order => {
                    const date = new Date(order.created_at);
                    const statusClass = order.status === 'completed' ? 'ai-log-success' : 
                                       order.status === 'pending' ? 'ai-log-warning' : 'ai-log-info';
                    const statusIcon = order.status === 'completed' ? 'check-circle' : 
                                      order.status === 'pending' ? 'clock' : 'info-circle';
                    
                    return `
                        <div class="ai-log-item ${statusClass}">
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="font-semibold">
                                        <i class="fas fa-${statusIcon} mr-2"></i>
                                        Auto-ordered ${order.quantity} units of "${order.item_name}"
                                    </div>
                                    <div class="text-sm text-gray-400 mt-1">
                                        ${date.toLocaleString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric', 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                        ${order.expected_delivery ? ` â€¢ Expected: ${new Date(order.expected_delivery).toLocaleDateString()}` : ''}
                                    </div>
                                </div>
                                <span class="text-xs px-2 py-1 rounded" style="background: rgba(255,255,255,0.1);">
                                    ${order.status}
                                </span>
                            </div>
                        </div>
                    `;
                }).join('');
                
            } catch (error) {
                console.error('Error loading AI log:', error);
                logEl.innerHTML = `
                    <div class="text-center text-red-400 py-8">
                        Failed to load activity log
                    </div>
                `;
            }
        }
        
        // Add entry to AI log (for real-time updates)
        function addAILog(message, type = 'info') {
            console.log(`ðŸ¤– AI Agent: ${message}`);
            // Reload the activity log to show latest
            loadAIActivityLog();
        }
    