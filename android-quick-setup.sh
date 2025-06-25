#!/bin/bash

# 🤖 TribeFind Android Quick Setup Script
# This script automates the Android development environment setup

set -e  # Exit on any error

echo "🚀 TribeFind Android Development Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS. For other systems, please follow the manual setup in android-setup-commands.txt"
    exit 1
fi

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

# Check Expo CLI
if command -v expo &> /dev/null; then
    print_status "Expo CLI found"
else
    print_warning "Expo CLI not found. Installing..."
    npm install -g @expo/cli
fi

# Check if Homebrew is available
if command -v brew &> /dev/null; then
    HAS_BREW=true
    print_status "Homebrew detected"
else
    HAS_BREW=false
    print_warning "Homebrew not found. Will use manual installation."
fi

# Function to install Android Studio
install_android_studio() {
    echo "📱 Installing Android Studio..."
    
    if $HAS_BREW; then
        print_info "Installing Android Studio via Homebrew..."
        brew install --cask android-studio
        print_status "Android Studio installed via Homebrew"
    else
        print_info "Please install Android Studio manually:"
        print_info "1. Go to https://developer.android.com/studio"
        print_info "2. Download Android Studio for macOS"
        print_info "3. Install and run the setup wizard"
        echo ""
        read -p "Press Enter after installing Android Studio..."
    fi
}

# Check if Android Studio is installed
check_android_studio() {
    if [ -d "/Applications/Android Studio.app" ]; then
        print_status "Android Studio found"
        return 0
    else
        print_warning "Android Studio not found"
        return 1
    fi
}

# Setup environment variables
setup_environment() {
    echo "🌍 Setting up environment variables..."
    
    # Detect shell
    if [[ "$SHELL" == *"zsh"* ]]; then
        SHELL_CONFIG="$HOME/.zshrc"
    else
        SHELL_CONFIG="$HOME/.bash_profile"
    fi
    
    # Android SDK path (common locations)
    ANDROID_SDK_PATHS=(
        "$HOME/Library/Android/sdk"
        "$HOME/Android/Sdk"
        "/usr/local/share/android-sdk"
    )
    
    ANDROID_HOME=""
    for path in "${ANDROID_SDK_PATHS[@]}"; do
        if [ -d "$path" ]; then
            ANDROID_HOME="$path"
            break
        fi
    done
    
    if [ -z "$ANDROID_HOME" ]; then
        print_warning "Android SDK not found. Using default path."
        ANDROID_HOME="$HOME/Library/Android/sdk"
    fi
    
    # Add environment variables to shell config
    print_info "Adding environment variables to $SHELL_CONFIG"
    
    cat >> "$SHELL_CONFIG" << EOF

# TribeFind Android Development Environment
export ANDROID_HOME=$ANDROID_HOME
export PATH=\$PATH:\$ANDROID_HOME/emulator
export PATH=\$PATH:\$ANDROID_HOME/platform-tools
export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin

# Java for Android Studio
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
EOF
    
    # Source the config
    source "$SHELL_CONFIG"
    print_status "Environment variables configured"
}

# Create AVD function
create_avd() {
    echo "📱 Creating TribeFind Android Virtual Device..."
    
    # Check if AVD already exists
    if emulator -list-avds | grep -q "TribeFind_Test_Device"; then
        print_status "TribeFind_Test_Device AVD already exists"
        return 0
    fi
    
    # Detect architecture for optimal image
    ARCH=$(uname -m)
    if [[ "$ARCH" == "arm64" ]]; then
        SYSTEM_IMAGE_ARCH="arm64-v8a"
        print_info "Apple Silicon Mac detected. Using ARM image for best performance."
    else
        SYSTEM_IMAGE_ARCH="x86_64"
        print_info "Intel Mac detected. Using x86_64 image."
    fi

    SYSTEM_IMAGE_TAG="system-images;android-33;google_apis;$SYSTEM_IMAGE_ARCH"
    
    print_info "Will use system image: $SYSTEM_IMAGE_TAG"

    # Check if system image is installed
    if ! avdmanager list target | grep -q "$SYSTEM_IMAGE_TAG"; then
        print_warning "Android 33 system image for your architecture is not installed."
        print_info "Downloading required system image..."
        yes | sdkmanager "$SYSTEM_IMAGE_TAG"
    fi
    
    # Create AVD
    print_info "Creating TribeFind_Test_Device AVD..."
    
    # Create the AVD
    echo "no" | avdmanager create avd \
        -n "TribeFind_Test_Device" \
        -k "$SYSTEM_IMAGE_TAG" \
        -d "pixel_7_pro" || true
    
    # Configure AVD settings
    AVD_CONFIG="$HOME/.android/avd/TribeFind_Test_Device.avd/config.ini"
    if [ -f "$AVD_CONFIG" ]; then
        echo "hw.ramSize=4096" >> "$AVD_CONFIG"
        echo "disk.dataPartition.size=8G" >> "$AVD_CONFIG"
        echo "hw.accelerometer=yes" >> "$AVD_CONFIG"
        echo "hw.gps=yes" >> "$AVD_CONFIG"
        echo "hw.camera=yes" >> "$AVD_CONFIG"
        print_status "AVD configured with enhanced settings"
    fi
}

# Test setup function
test_setup() {
    echo "🧪 Testing Android setup..."
    
    # Test adb
    if command -v adb &> /dev/null; then
        print_status "ADB found: $(adb --version | head -n1)"
    else
        print_error "ADB not found in PATH"
    fi
    
    # Test emulator
    if command -v emulator &> /dev/null; then
        print_status "Emulator found"
        
        # List AVDs
        echo "Available AVDs:"
        emulator -list-avds
    else
        print_error "Emulator not found in PATH"
    fi
    
    # Test AVD creation
    if emulator -list-avds | grep -q "TribeFind_Test_Device"; then
        print_status "TribeFind_Test_Device AVD ready"
    else
        print_warning "TribeFind_Test_Device AVD not found"
    fi
}

# Launch emulator and app
launch_tribefind() {
    echo "🚀 Launching TribeFind on Android..."
    
    print_info "Starting Android emulator..."
    emulator @TribeFind_Test_Device &
    
    # Wait a moment for emulator to start
    sleep 3
    
    print_info "Starting Expo development server..."
    print_info "The emulator will take 2-3 minutes to boot completely."
    print_info "Once you see the Android home screen, TribeFind should load automatically."
    
    # Start Expo
    npx expo start --android
}

# Main execution
main() {
    echo "Starting TribeFind Android setup..."
    echo ""
    
    # Check Android Studio
    if ! check_android_studio; then
        read -p "Install Android Studio? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_android_studio
        else
            print_error "Android Studio is required. Please install manually."
            exit 1
        fi
    fi
    
    # Setup environment
    print_info "Setting up environment variables..."
    setup_environment
    
    # Create AVD
    read -p "Create TribeFind Android Virtual Device? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_avd
    fi
    
    # Test setup
    echo ""
    test_setup
    
    # Launch option
    echo ""
    read -p "Launch TribeFind on Android emulator now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        launch_tribefind
    else
        echo ""
        print_status "Setup complete! To launch TribeFind later, run:"
        print_info "emulator @TribeFind_Test_Device & npx expo start --android"
    fi
}

# Run main function
main

echo ""
echo "🎉 TribeFind Android setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Wait for Android emulator to fully boot (2-3 minutes)"
echo "2. Grant camera and location permissions when prompted"
echo "3. Test TribeFind features:"
echo "   - Authentication (sign up/login)"
echo "   - Camera (take photos)"
echo "   - Location (enable GPS)"
echo "   - Activities (select interests)"
echo "   - Map (view nearby tribe members)"
echo ""
echo "🔧 Troubleshooting:"
echo "- If emulator is slow: Close other apps"
echo "- If app won't install: Run 'adb devices' to check connection"
echo "- If environment issues: Restart terminal and try again"
echo ""
echo "📖 For detailed setup guide, see: android-setup-commands.txt"
echo ""
print_status "Happy coding with TribeFind! 🚀" 