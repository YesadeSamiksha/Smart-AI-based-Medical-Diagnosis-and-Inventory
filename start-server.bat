@echo off
echo Starting MedAI Local Server...
echo.
echo Server will be available at:
echo   http://localhost:8080
echo.
echo Admin Panel: http://localhost:8080/admin-v2.html
echo Debug Test:  http://localhost:8080/test-admin-debug.html
echo.
echo Press Ctrl+C to stop the server
echo.

python -m http.server 8080