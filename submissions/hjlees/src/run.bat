@echo off
REM Luna AI Todo Assistant - Startup Script for Windows
REM This script helps you start the application quickly

echo 🌙 Luna AI Todo Assistant - Starting...
echo.

REM Check if .env exists
if not exist .env (
    echo ❌ Error: .env file not found!
    echo 📝 Please copy env.example to .env and fill in your API keys:
    echo    copy env.example .env
    echo    notepad .env
    echo.
    exit /b 1
)

REM Check if virtual environment exists
if not exist venv (
    echo 📦 Creating virtual environment...
    python -m venv venv
    echo ✅ Virtual environment created
    echo.
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/update dependencies
echo 📥 Installing dependencies...
pip install -q -r requirements.txt
echo ✅ Dependencies installed
echo.

REM Check configuration
echo 🔍 Checking configuration...
python -c "import os; from dotenv import load_dotenv; load_dotenv(); required=['APPWRITE_PROJECT_ID','APPWRITE_API_KEY','APPWRITE_DATABASE_ID','GROQ_API_KEY','AGORA_APP_ID']; missing=[v for v in required if not os.getenv(v)]; exit(1) if missing else print('✅ Configuration looks good!')"

if errorlevel 1 (
    echo.
    echo ❌ Missing required environment variables!
    echo 📝 Please update your .env file
    deactivate
    exit /b 1
)

echo.
echo 🚀 Starting Luna AI Todo Assistant...
echo 🌐 Open your browser to: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Run the application
python app.py

