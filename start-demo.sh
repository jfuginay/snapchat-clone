#!/bin/bash

# TribeFind Demo Startup Script
# For instructors and students to quickly start the demo

echo "🎬 Starting TribeFind Demo..."
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "⚙️ Creating demo environment file..."
    cat > .env.local << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://rfvlxtzjtcaxkxisyuys.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdmx4dHpqdGNheGt4aXN5dXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3Nzg3NDgsImV4cCI6MjA2NjM1NDc0OH0.OrN9YGA5rzcC1mUjxd2maeAUFmnx9VixMgnm_LdLIVM
GOOGLE_PLACES_API_KEY=AIzaSyBYv5SK3gpQnNaMF9IKu3uIx_V-y2nDLho
EOF
    echo "✅ Environment file created!"
else
    echo "✅ Environment file already exists!"
fi

echo ""
echo "🚀 Demo Accounts Ready:"
echo "   Email: demo@tribefind.app"
echo "   Password: DemoUser123!"
echo ""
echo "   Test Account 1: test1@tribefind.app / TestUser123!"
echo "   Test Account 2: test2@tribefind.app / TestUser123!"
echo ""
echo "📱 Starting Expo development server..."
echo "   - Press 'i' for iOS simulator"
echo "   - Press 'a' for Android emulator"
echo "   - Scan QR code for physical device"
echo ""

# Start Expo development server
npx expo start --clear 