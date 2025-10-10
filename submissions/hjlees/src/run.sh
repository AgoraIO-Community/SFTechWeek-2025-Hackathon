#!/bin/bash

# Luna AI Todo Assistant - Startup Script
# This script helps you start the application quickly

echo "🌙 Luna AI Todo Assistant - Starting..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please copy env.example to .env and fill in your API keys:"
    echo "   cp env.example .env"
    echo "   nano .env"
    echo ""
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
    echo ""
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Check if required environment variables are set
echo "🔍 Checking configuration..."
python3 << END
import os
from dotenv import load_dotenv

load_dotenv()

required_vars = [
    'APPWRITE_PROJECT_ID',
    'APPWRITE_API_KEY',
    'APPWRITE_DATABASE_ID',
    'GROQ_API_KEY',
    'AGORA_APP_ID'
]

missing = [var for var in required_vars if not os.getenv(var)]

if missing:
    print(f"❌ Missing required environment variables:")
    for var in missing:
        print(f"   - {var}")
    print("\n📝 Please update your .env file")
    exit(1)
else:
    print("✅ Configuration looks good!")
END

if [ $? -ne 0 ]; then
    deactivate
    exit 1
fi

echo ""
echo "🚀 Starting Luna AI Todo Assistant..."
echo "🌐 Open your browser to: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the application
python app.py

