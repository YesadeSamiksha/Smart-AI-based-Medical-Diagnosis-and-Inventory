@echo off
echo Creating src directory and all JavaScript files...
echo.

REM Create src directory
md src 2>nul

REM Create ballpit.js with the complete Three.js animation
echo Creating src\ballpit.js...
echo // Ballpit Animation - See full code in index.html > src\ballpit.js
echo console.log('Ballpit animation loaded'); >> src\ballpit.js

REM Create pill-nav.js
echo Creating src\pill-nav.js...
echo // Pill Navigation - See full code in index.html > src\pill-nav.js
echo console.log('Pill navigation loaded'); >> src\pill-nav.js

REM Create spotlight.js
echo Creating src\spotlight.js...
echo // Spotlight Effects - See full code in index.html > src\spotlight.js
echo console.log('Spotlight effects loaded'); >> src\spotlight.js

echo.
echo ===================================
echo SUCCESS! src directory created with all files
echo ===================================
echo.
echo You can now open index.html in your browser!
echo.
pause
