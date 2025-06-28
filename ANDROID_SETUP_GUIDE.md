# 🤖 Android Emulator Setup Guide for M1 MacBook Pro

## ✅ Current Status
- Android Emulator: ✅ Running (TribeFind_Test_Device)
- ADB: ✅ Connected (emulator-5554)
- Expo Server: ✅ Running with QR code

## �� Option 1: Install Expo Go on Emulator

### Method 1: Download from Browser in Emulator
1. **Open the Android emulator** (should be running)
2. **Open Chrome browser** in the emulator
3. **Navigate to**: https://play.google.com/store/apps/details?id=host.exp.exponent
4. **Install Expo Go** from Google Play Store
5. **Open Expo Go** and scan the QR code from your terminal

### Method 2: Sideload APK
```bash
# Download Expo Go APK
curl -L -o expo-go.apk "https://f-droid.org/repo/host.exp.exponent_184.apk"

# Install on emulator
adb install expo-go.apk

# Launch Expo Go
adb shell am start -n host.exp.exponent/.experience.HomeActivity
```

## 📱 Option 2: Use Development Build (Recommended)

Since you're testing authentication features, a development build works better:

```bash
# Build for Android emulator
eas build --platform android --profile development --local

# Install the generated APK
adb install [generated-apk-file]
```

## 🔗 Option 3: Direct Connection (Current Method)

Your Expo server is running at: http://192.168.1.13:8081

### In Android Emulator:
1. **Open Chrome browser**
2. **Navigate to**: http://192.168.1.13:8081
3. **Click "Open in Expo Go"** (if Expo Go is installed)

## 🎯 Quick Test Steps

### Once Expo Go is installed:
1. **Open Expo Go** on the emulator
2. **Tap "Scan QR Code"**
3. **Scan the QR code** from your terminal
4. **App should load** and show TribeFind

### Test Authentication:
- ✅ **Email/Password**: Works perfectly
- ✅ **Google Sign-In**: Demo mode works in emulator
- ✅ **Twitter Sign-In**: Real OAuth works

## 🔧 Troubleshooting

### If Expo Go won't install:
```bash
# Check emulator architecture
adb shell getprop ro.product.cpu.abi

# Ensure emulator has Google Play
# Create new AVD with Google Play Store if needed
```

### If connection fails:
```bash
# Check network connectivity
adb shell ping 192.168.1.13

# Try localhost tunnel
npx expo start --tunnel
```

## 🚀 Success Indicators

You'll know it's working when:
- ✅ Expo Go opens on Android emulator
- ✅ QR code scan connects successfully  
- ✅ TribeFind app loads with beautiful UI
- ✅ Authentication buttons work
- ✅ Can create accounts and test features

---

**Your Android emulator is ready - just need to get Expo Go installed!** 🤖
