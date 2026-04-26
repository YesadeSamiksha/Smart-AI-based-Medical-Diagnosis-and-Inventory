/**
 * Trends & Condition Analysis Module
 * Analyzes most common medical conditions based on real user data from the database
 */

var API_URL = 'http://localhost:5000/api';

// Store analysis data
let trendsData = {
    commonConditions: null,
    conditionTrends: null,
    riskAnalysis: null,
    lastUpdated: null
};

/**
 * Load most common conditions from database
 */
async function loadCommonConditionsFromDB(limit = 10) {
    console.log(`📊 Loading top ${limit} common conditions from database...`);
    
    try {
        const token = localStorage.getItem('medai_admin_token');
        if (!token) {
            console.warn('⚠️ No admin token found');
            return null;
        }
        
        const response = await fetch(`${API_URL}/admin/common-conditions?limit=${limit}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.warn(`⚠️ Failed to load common conditions: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        console.log('✅ Common conditions loaded:', data);
        trendsData.commonConditions = data;
        trendsData.lastUpdated = new Date().toLocaleTimeString();
        return data;
    } catch (error) {
        console.error('❌ Error loading common conditions:', error);
        return null;
    }
}

/**
 * Load condition trends over time
 */
async function loadConditionTrendsFromDB() {
    console.log('📈 Loading condition trends from database...');
    
    try {
        const token = localStorage.getItem('medai_admin_token');
        if (!token) {
            console.warn('⚠️ No admin token found');
            return null;
        }
        
        const response = await fetch(`${API_URL}/admin/condition-trends`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.warn(`⚠️ Failed to load condition trends: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        console.log('✅ Condition trends loaded:', data);
        trendsData.conditionTrends = data;
        return data;
    } catch (error) {
        console.error('❌ Error loading condition trends:', error);
        return null;
    }
}

/**
 * Load risk analysis by condition
 */
async function loadRiskAnalysisFromDB() {
    console.log('⚠️ Loading risk analysis by condition from database...');
    
    try {
        const token = localStorage.getItem('medai_admin_token');
        if (!token) {
            console.warn('⚠️ No admin token found');
            return null;
        }
        
        const response = await fetch(`${API_URL}/admin/risk-analysis`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.warn(`⚠️ Failed to load risk analysis: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        console.log('✅ Risk analysis loaded:', data);
        trendsData.riskAnalysis = data;
        return data;
    } catch (error) {
        console.error('❌ Error loading risk analysis:', error);
        return null;
    }
}

/**
 * Format condition data for display
 */
function formatConditionDisplay(data) {
    if (!data || !data.data || !data.data.most_common) {
        return '<p class="text-gray-400">No condition data available</p>';
    }
    
    const conditions = data.data.most_common;
    if (conditions.length === 0) {
        return '<p class="text-gray-400">No conditions found in database</p>';
    }
    
    return conditions.map((item, index) => `
        <div class="p-4 rounded-lg mb-3" style="background: rgba(139, 92, 246, 0.1); border-left: 3px solid #8b5cf6;">
            <div class="flex justify-between items-center">
                <div>
                    <div class="font-bold text-lg">${index + 1}. ${item.condition}</div>
                    <div class="text-sm text-gray-400">
                        ${item.count} cases · ${item.percentage}% of all diagnoses
                    </div>
                </div>
                <div>
                    <span class="px-3 py-1 rounded-full text-sm font-semibold" 
                          style="background: ${getPrevalenceColor(item.prevalence)}; color: white;">
                        ${item.prevalence}
                    </span>
                </div>
            </div>
            <div class="mt-2 w-full bg-gray-700 rounded-full h-2">
                <div style="width: ${item.percentage}%; background: linear-gradient(90deg, #8b5cf6, #6366f1); height: 100%; border-radius: 9999px;"></div>
            </div>
        </div>
    `).join('');
}

/**
 * Get color based on prevalence level
 */
function getPrevalenceColor(prevalence) {
    const colors = {
        'High': '#ef4444',    // Red
        'Medium': '#f59e0b',  // Amber
        'Low': '#10b981'      // Green
    };
    return colors[prevalence] || '#6b7280';
}

/**
 * Create chart for common conditions
 */
function createCommonConditionsChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container #${containerId} not found`);
        return;
    }
    
    if (!data || !data.data || !data.data.most_common) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4">No data available</p>';
        return;
    }
    
    const conditions = data.data.most_common.slice(0, 10);
    const labels = conditions.map(c => c.condition);
    const values = conditions.map(c => c.count);
    const colors = conditions.map(c => {
        switch(c.prevalence) {
            case 'High': return 'rgba(239, 68, 68, 0.8)';   // Red
            case 'Medium': return 'rgba(245, 158, 11, 0.8)'; // Amber
            default: return 'rgba(16, 185, 129, 0.8)';       // Green
        }
    });
    
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    try {
        new Chart(canvas, {
            type: 'horizontalBar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Cases',
                    data: values,
                    backgroundColor: colors,
                    borderColor: '#1e293b',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    } catch (error) {
        console.error('Error creating chart:', error);
        container.innerHTML = '<p class="text-red-400 text-center py-4">Error creating chart</p>';
    }
}

/**
 * Create trend lines chart
 */
function createTrendChart(containerId, trendData) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container #${containerId} not found`);
        return;
    }
    
    if (!trendData || !trendData.trends || trendData.trends.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4">No trend data available</p>';
        return;
    }
    
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
    const datasets = [];
    
    trendData.trends.slice(0, 5).forEach((trend, index) => {
        const dates = trend.trend.map(t => t.date).sort();
        const values = trend.trend.map(t => ({
            date: t.date,
            count: t.count
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        datasets.push({
            label: trend.condition,
            data: values.map(v => v.count),
            borderColor: colors[index % colors.length],
            backgroundColor: `${colors[index % colors.length]}20`,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: colors[index % colors.length],
            pointBorderColor: '#1e293b',
            pointBorderWidth: 1
        });
    });
    
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    try {
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: Array.from({length: 10}, (_, i) => `Week ${i+1}`),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#d1d5db' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#9ca3af' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af' }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating trend chart:', error);
        container.innerHTML = '<p class="text-red-400 text-center py-4">Error creating chart</p>';
    }
}

/**
 * Create risk distribution pie chart
 */
function createRiskDistributionChart(containerId, riskData) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container #${containerId} not found`);
        return;
    }
    
    if (!riskData || !riskData.risk_by_condition) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4">No risk data available</p>';
        return;
    }
    
    // Get the top condition's risk distribution
    const topCondition = riskData.risk_by_condition[0];
    if (!topCondition) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4">No risk data available</p>';
        return;
    }
    
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    try {
        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'],
                datasets: [{
                    data: [
                        topCondition.risk_distribution.low,
                        topCondition.risk_distribution.medium,
                        topCondition.risk_distribution.high,
                        topCondition.risk_distribution.critical
                    ],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',   // Green
                        'rgba(245, 158, 11, 0.8)',    // Amber
                        'rgba(239, 68, 68, 0.8)',     // Red
                        'rgba(139, 92, 246, 0.8)'     // Purple
                    ],
                    borderColor: '#1e293b',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#d1d5db' }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating risk chart:', error);
        container.innerHTML = '<p class="text-red-400 text-center py-4">Error creating chart</p>';
    }
}

/**
 * Main function to refresh all trends data
 */
async function refreshAllTrendsData() {
    console.log('🔄 Refreshing all trends data from database...');
    
    try {
        // Load all data in parallel
        const [conditions, trends, risks] = await Promise.all([
            loadCommonConditionsFromDB(10),
            loadConditionTrendsFromDB(),
            loadRiskAnalysisFromDB()
        ]);
        
        // Update most common condition card
        if (conditions && conditions.data && conditions.data.most_common.length > 0) {
            const topCondition = conditions.data.most_common[0];
            document.getElementById('trend-dominant-disease').textContent = topCondition.condition;
        }
        
        // Update total assessments
        if (conditions && conditions.data && conditions.data.summary) {
            document.getElementById('trend-total-assessments').textContent = 
                conditions.data.summary.total_diagnoses || 0;
        }
        
        // Display common conditions
        const commonConditionsListEl = document.getElementById('commonConditionsList');
        if (commonConditionsListEl && conditions) {
            commonConditionsListEl.innerHTML = formatConditionDisplay(conditions);
        }
        
        // Create charts
        if (conditions) {
            const chartContainer = document.getElementById('commonConditionsChart');
            if (chartContainer) {
                chartContainer.innerHTML = '';
                createCommonConditionsChart('commonConditionsChart', conditions);
            }
        }
        
        if (trends) {
            const trendChartContainer = document.getElementById('conditionTrendChart');
            if (trendChartContainer) {
                trendChartContainer.innerHTML = '';
                createTrendChart('conditionTrendChart', trends);
            }
        }
        
        if (risks) {
            const riskChartContainer = document.getElementById('conditionRiskChart');
            if (riskChartContainer) {
                riskChartContainer.innerHTML = '';
                createRiskDistributionChart('conditionRiskChart', risks);
            }
        }
        
        console.log('✅ All trends data refreshed successfully');
        return true;
    } catch (error) {
        console.error('❌ Error refreshing trends data:', error);
        return false;
    }
}

// Export functions for use in HTML
window.TrendsAnalysis = {
    loadCommonConditionsFromDB,
    loadConditionTrendsFromDB,
    loadRiskAnalysisFromDB,
    refreshAllTrendsData,
    formatConditionDisplay,
    createCommonConditionsChart,
    createTrendChart,
    createRiskDistributionChart
};
