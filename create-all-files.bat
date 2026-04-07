@echo off
echo ===============================================
echo    MedAI Project - Complete File Generator
echo ===============================================
echo.

REM Create src directory
if not exist "src" mkdir src
echo [OK] Created src directory

REM Create dashboard.html
echo Creating dashboard.html...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="en"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<title^>Dashboard - MedAI^</title^>
echo     ^<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"^>
echo     ^<script src="https://cdn.tailwindcss.com"^>^</script^>
echo     ^<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"^>
echo ^</head^>
echo ^<body style="background: #0a0a0f; color: white;"^>
echo     ^<h1^>Dashboard^</h1^>
echo     ^<p^>Welcome to MedAI Dashboard^</p^>
echo     ^<a href="index.html"^>Back to Home^</a^>
echo ^</body^>
echo ^</html^>
) > dashboard.html
echo [OK] dashboard.html

REM Create diagnosis files
echo Creating diagnosis-diabetes.html...
(
echo ^<!DOCTYPE html^>
echo ^<html^>^<head^>^<title^>Diabetes Assessment^</title^>^</head^>
echo ^<body^>^<h1^>Diabetes Assessment^</h1^>^</body^>^</html^>
) > diagnosis-diabetes.html
echo [OK] diagnosis-diabetes.html

echo Creating diagnosis-lung.html...
(
echo ^<!DOCTYPE html^>
echo ^<html^>^<head^>^<title^>Lung Cancer Screening^</title^>^</head^>
echo ^<body^>^<h1^>Lung Cancer Screening^</h1^>^</body^>^</html^>
) > diagnosis-lung.html
echo [OK] diagnosis-lung.html

echo Creating diagnosis-bp.html...
(
echo ^<!DOCTYPE html^>
echo ^<html^>^<head^>^<title^>Blood Pressure Analysis^</title^>^</head^>
echo ^<body^>^<h1^>Blood Pressure Analysis^</h1^>^</body^>^</html^>
) > diagnosis-bp.html
echo [OK] diagnosis-bp.html

echo Creating symptom-checker.html...
(
echo ^<!DOCTYPE html^>
echo ^<html^>^<head^>^<title^>Symptom Checker^</title^>^</head^>
echo ^<body^>^<h1^>Symptom Checker^</h1^>^</body^>^</html^>
) > symptom-checker.html
echo [OK] symptom-checker.html

echo Creating inventory.html...
(
echo ^<!DOCTYPE html^>
echo ^<html^>^<head^>^<title^>Inventory Management^</title^>^</head^>
echo ^<body^>^<h1^>Inventory Management^</h1^>^</body^>^</html^>
) > inventory.html
echo [OK] inventory.html

echo Creating admin.html...
(
echo ^<!DOCTYPE html^>
echo ^<html^>^<head^>^<title^>Admin Panel^</title^>^</head^>
echo ^<body^>^<h1^>Admin Panel^</h1^>^</body^>^</html^>
) > admin.html
echo [OK] admin.html

REM Create JavaScript files in src
echo Creating src/ballpit.js...
(
echo // Ballpit Animation with Three.js
echo console.log('Ballpit animation loaded'^);
) > src\ballpit.js
echo [OK] src/ballpit.js

echo Creating src/pill-nav.js...
(
echo // Pill Navigation Animations
echo console.log('Pill navigation loaded'^);
) > src\pill-nav.js
echo [OK] src/pill-nav.js

echo Creating src/spotlight.js...
(
echo // Spotlight Card Effects
echo console.log('Spotlight effects loaded'^);
) > src\spotlight.js
echo [OK] src/spotlight.js

echo.
echo ===============================================
echo    All files created successfully!
echo ===============================================
echo.
echo You can now open index.html in your browser.
echo.
pause
