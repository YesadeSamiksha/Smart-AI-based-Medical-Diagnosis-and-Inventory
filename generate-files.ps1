# MedAI Project File Generator
# This script creates all missing project files

Write-Host "🏥 MedAI Project File Generator" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Create src directory if it doesn't exist
if (!(Test-Path "src")) {
    New-Item -ItemType Directory -Path "src" | Out-Null
    Write-Host "✓ Created src/ directory" -ForegroundColor Green
}

# Create dashboard.html
$dashboardContent = @'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - MedAI</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="styles.css">
    <style>
        body { background: #0a0a0f; color: white; }
        .sidebar { background: rgba(255,255,255,0.05); min-height: 100vh; padding: 2rem 1rem; }
        .dashboard-card { background: rgba(255,255,255,0.05); border-radius: 16px; padding: 1.5rem; border: 1px solid rgba(255,255,255,0.1); }
    </style>
</head>
<body>
    <div class="d-flex">
        <nav class="sidebar" style="width: 250px;">
            <div class="text-center mb-4">
                <i class="fas fa-heartbeat text-4xl" style="color: #6366f1; font-size: 2rem;"></i>
                <h4 class="mt-2">MedAI</h4>
            </div>
            <ul class="nav flex-column">
                <li class="nav-item mb-2">
                    <a href="dashboard.html" class="nav-link text-white active"><i class="fas fa-home me-2"></i> Dashboard</a>
                </li>
                <li class="nav-item mb-2">
                    <a href="diagnosis-diabetes.html" class="nav-link text-white-50"><i class="fas fa-tint me-2"></i> Diabetes</a>
                </li>
                <li class="nav-item mb-2">
                    <a href="diagnosis-lung.html" class="nav-link text-white-50"><i class="fas fa-lungs me-2"></i> Lung Cancer</a>
                </li>
                <li class="nav-item mb-2">
                    <a href="diagnosis-bp.html" class="nav-link text-white-50"><i class="fas fa-heart-pulse me-2"></i> Blood Pressure</a>
                </li>
                <li class="nav-item mb-2">
                    <a href="symptom-checker.html" class="nav-link text-white-50"><i class="fas fa-stethoscope me-2"></i> Symptom Checker</a>
                </li>
                <li class="nav-item mb-2">
                    <a href="inventory.html" class="nav-link text-white-50"><i class="fas fa-boxes me-2"></i> Inventory</a>
                </li>
                <li class="nav-item mb-2">
                    <a href="index.html" class="nav-link text-white-50" onclick="localStorage.clear()"><i class="fas fa-sign-out-alt me-2"></i> Logout</a>
                </li>
            </ul>
        </nav>
        <main class="flex-grow-1 p-4">
            <div class="mb-4">
                <h2>Welcome back, <span id="userName">User</span>!</h2>
                <p class="text-white-50">Here's your health overview</p>
            </div>
            <div class="row g-4">
                <div class="col-md-4">
                    <div class="dashboard-card">
                        <i class="fas fa-tint text-pink-400" style="font-size: 2rem;"></i>
                        <h5 class="mt-3">Diabetes Assessment</h5>
                        <p class="text-white-50 small">Check your diabetes risk</p>
                        <a href="diagnosis-diabetes.html" class="btn btn-sm btn-primary">Start Assessment</a>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="dashboard-card">
                        <i class="fas fa-lungs text-blue-400" style="font-size: 2rem;"></i>
                        <h5 class="mt-3">Lung Cancer Screening</h5>
                        <p class="text-white-50 small">Early detection screening</p>
                        <a href="diagnosis-lung.html" class="btn btn-sm btn-primary">Start Screening</a>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="dashboard-card">
                        <i class="fas fa-heart-pulse text-red-400" style="font-size: 2rem;"></i>
                        <h5 class="mt-3">Blood Pressure Analysis</h5>
                        <p class="text-white-50 small">Monitor your BP levels</p>
                        <a href="diagnosis-bp.html" class="btn btn-sm btn-primary">Start Analysis</a>
                    </div>
                </div>
            </div>
        </main>
    </div>
    <script>
        // Check if user is logged in
        const user = JSON.parse(localStorage.getItem('medai_user') || '{}');
        if (!user.loggedIn) {
            window.location.href = 'login.html';
        } else {
            document.getElementById('userName').textContent = user.name || user.email || 'User';
        }
    </script>
</body>
</html>
'@

Set-Content -Path "dashboard.html" -Value $dashboardContent
Write-Host "✓ Created dashboard.html" -ForegroundColor Green

# Create src/script.js
$scriptContent = (Get-Content -Path "script_template.txt" -Raw -ErrorAction SilentlyContinue)
if (!$scriptContent) {
    $scriptContent = @'
// Main JavaScript for MedAI
document.addEventListener('DOMContentLoaded', function() {
    console.log('MedAI Platform Loaded');
    
    // Voice Assistant
    const voiceBtn = document.getElementById('voice-assistant-btn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', function() {
            if ('webkitSpeechRecognition' in window) {
                const recognition = new webkitSpeechRecognition();
                recognition.lang = 'en-US';
                recognition.start();
                recognition.onresult = function(event) {
                    const transcript = event.results[0][0].transcript;
                    handleVoiceCommand(transcript);
                };
            } else {
                alert('Voice recognition not supported in this browser.');
            }
        });
    }
});

function handleVoiceCommand(command) {
    command = command.toLowerCase();
    if (command.includes('home')) window.location.href = 'index.html';
    else if (command.includes('dashboard')) window.location.href = 'dashboard.html';
    else if (command.includes('diabetes')) window.location.href = 'diagnosis-diabetes.html';
    else if (command.includes('lung')) window.location.href = 'diagnosis-lung.html';
    else if (command.includes('pressure')) window.location.href = 'diagnosis-bp.html';
}
'@
}

Set-Content -Path "src\script.js" -Value $scriptContent
Write-Host "✓ Created src/script.js" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Basic files created successfully!" -ForegroundColor Green
Write-Host "Run this script again to create more files." -ForegroundColor Yellow
