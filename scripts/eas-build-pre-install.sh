#!/bin/bash

# EAS Build Pre-Install Hook
# This script runs before dependencies are installed

echo "🔧 EAS Build Pre-Install Hook Starting..."

# Create GoogleService-Info.plist from environment variable
if [ -n "$GOOGLE_SERVICE_INFO_PLIST" ]; then
    echo "📱 Creating GoogleService-Info.plist from EAS secret..."
    echo "$GOOGLE_SERVICE_INFO_PLIST" > ./GoogleService-Info.plist
    echo "✅ GoogleService-Info.plist created successfully"
    
    # Verify the file was created
    if [ -f "./GoogleService-Info.plist" ]; then
        echo "✅ GoogleService-Info.plist file exists and is ready for build"
        # Show first few lines to confirm it's valid (without exposing sensitive data)
        echo "📋 File preview (first 3 lines):"
        head -n 3 ./GoogleService-Info.plist
    else
        echo "❌ Failed to create GoogleService-Info.plist"
        exit 1
    fi
else
    echo "⚠️  GOOGLE_SERVICE_INFO_PLIST environment variable not found"
    echo "❌ Cannot create GoogleService-Info.plist - build will likely fail"
    exit 1
fi

echo "🎯 EAS Build Pre-Install Hook Complete" 