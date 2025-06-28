# 📱 iOS Standalone Build Guide - No Expo Go Required

## 🎯 Overview

This guide shows you how to create standalone iOS builds that users can install directly on their devices without needing Expo Go. You have three build types available:

1. **Development Build** - For testing with live updates
2. **Preview Build** - For beta testing and distribution
3. **Production Build** - For App Store submission

## 🔧 Prerequisites

### Required Setup
- EAS CLI installed: `npm install -g @expo/eas-cli`
- Logged into EAS: `eas login`
- Apple Developer Account (for device installation)
- iOS device UDIDs registered (for internal distribution)

### Current Status ✅
Your `eas.json` is already configured with all three build profiles!

## 🚀 Build Options

### Option 1: Development Build (Recommended for Testing)

**What it does:**
- Creates a custom development client with your native dependencies
- Allows over-the-air updates for JavaScript changes
- Perfect for ongoing development and testing

**Command:**
```bash
eas build --platform ios --profile development
```

**Features:**
- ✅ No Expo Go required
- ✅ Includes all your native modules (camera, maps, etc.)
- ✅ Supports live updates
- ✅ Internal distribution
- ✅ Debugging tools included

### Option 2: Preview Build (Beta Testing)

**What it does:**
- Creates a production-like build for internal testing
- More stable than development builds
- Good for beta testers and stakeholders

**Command:**
```bash
eas build --platform ios --profile preview
```

**Features:**
- ✅ No Expo Go required
- ✅ Production-like performance
- ✅ Internal distribution
- ✅ More stable than development builds

### Option 3: Production Build (App Store)

**What it does:**
- Creates the final build for App Store submission
- Optimized for performance and size
- Required for public distribution

**Command:**
```bash
eas build --platform ios --profile production
```

**Features:**
- ✅ App Store ready
- ✅ Fully optimized
- ✅ Production certificates
- ✅ Public distribution

## 📋 Step-by-Step Instructions

### Step 1: Choose Your Build Type
For testing with users, I recommend starting with **Development Build**:

```bash
eas build --platform ios --profile development
```

### Step 2: Register Test Devices (For Internal Distribution)

**Add device UDIDs:**
```bash
eas device:create
```

**Or register devices via website:**
1. Go to https://expo.dev/accounts/[your-username]/projects/snapchat-clone/devices
2. Add device UDIDs manually
3. Rebuild to include new devices

### Step 3: Start the Build

```bash
# Development build (recommended for testing)
eas build --platform ios --profile development

# Preview build (for beta testing)
eas build --platform ios --profile preview

# Production build (for App Store)
eas build --platform ios --profile production
```

### Step 4: Monitor Build Progress

- Build will appear in EAS dashboard
- Receive email notification when complete
- Download .ipa file or install via TestFlight/link

## 📱 Installation Methods

### Method 1: Direct Installation (Development/Preview)

**Via EAS CLI:**
```bash
eas build:run --platform ios --latest
```

**Via Web:**
1. Go to https://expo.dev/accounts/jfuginay/projects/snapchat-clone/builds
2. Click on your build
3. Send installation link to users
4. Users open link on iOS device and install

### Method 2: TestFlight (All Build Types)

**For internal testing:**
```bash
eas submit --platform ios --profile development
```

**For external testing:**
```bash
eas submit --platform ios --profile preview
```

### Method 3: App Store (Production Only)

```bash
eas submit --platform ios --profile production
```

## 🔧 Configuration Details

### Your Current EAS Configuration

```json
{
  "development": {
    "developmentClient": true,      // ✅ Custom development client
    "distribution": "internal",     // ✅ Internal distribution
    "node": "20.18.0",             // ✅ Node version specified
    "cache": { "disabled": true }   // ✅ Fresh builds
  },
  "preview": {
    "distribution": "internal"      // ✅ Internal distribution
  },
  "production": {
    "autoIncrement": true          // ✅ Auto-increment version
  }
}
```

### Key Features Enabled

- **Development Client**: Custom Expo Go with your native modules
- **Internal Distribution**: Install on registered devices
- **Google Services**: Configured for iOS builds
- **Auto-increment**: Automatic version bumping

## 🎯 Recommended Workflow

### For Active Development
```bash
# 1. Build development client
eas build --platform ios --profile development

# 2. Install on test devices
eas build:run --platform ios --latest

# 3. Make JavaScript changes and publish updates
eas update --branch main
```

### For Beta Testing
```bash
# 1. Build preview version
eas build --platform ios --profile preview

# 2. Submit to TestFlight for easier distribution
eas submit --platform ios --profile preview

# 3. Invite beta testers via TestFlight
```

### For App Store Release
```bash
# 1. Build production version
eas build --platform ios --profile production

# 2. Submit to App Store
eas submit --platform ios --profile production

# 3. Manage release in App Store Connect
```

## 🔐 Device Registration

### Add Test Devices

**Method 1: EAS CLI**
```bash
eas device:create
```

**Method 2: Web Dashboard**
1. Visit: https://expo.dev/accounts/jfuginay/projects/snapchat-clone/devices
2. Click "Add Device"
3. Enter device UDID and name
4. Rebuild to include new devices

**Method 3: Automatic Registration**
- Users visit your build URL on their iOS device
- System prompts to register device
- Rebuild automatically includes new devices

### Get Device UDID

**On iOS Device:**
1. Settings → General → About → scroll to UDID
2. Copy UDID value

**Via Xcode:**
1. Connect device to Mac
2. Window → Devices and Simulators
3. Select device, copy UDID

## 📊 Build Comparison

| Feature | Development | Preview | Production |
|---------|-------------|---------|------------|
| **Expo Go Required** | ❌ No | ❌ No | ❌ No |
| **Live Updates** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Debug Tools** | ✅ Yes | ❌ No | ❌ No |
| **Performance** | 🟡 Good | ✅ Great | ✅ Great |
| **Distribution** | 📱 Internal | 📱 Internal | 🏪 App Store |
| **Certificates** | 🔧 Dev | 🔧 Dev | 🏆 Prod |

## 🚨 Troubleshooting

### Common Issues

**Build Fails:**
```bash
# Clear cache and retry
eas build --platform ios --profile development --clear-cache
```

**Device Not Registered:**
```bash
# Add device and rebuild
eas device:create
eas build --platform ios --profile development
```

**Google Services Error:**
- Ensure GoogleService-Info.plist is in project root
- Check EAS secret is configured: `eas secret:list`

**Installation Fails:**
- Verify device UDID is registered
- Check provisioning profile includes device
- Ensure iOS version compatibility

## 🎯 Quick Start Commands

**For immediate testing:**
```bash
# Build and install development client
eas build --platform ios --profile development
eas build:run --platform ios --latest
```

**For beta distribution:**
```bash
# Build preview and submit to TestFlight
eas build --platform ios --profile preview
eas submit --platform ios --profile preview
```

**For App Store release:**
```bash
# Build production and submit to App Store
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

---

## 🎉 Summary

Your EAS configuration is perfect for standalone iOS builds! Choose:

- **Development Build** for active testing and development
- **Preview Build** for beta testing and stakeholder reviews  
- **Production Build** for App Store submission

All builds work without Expo Go and can be installed directly on iOS devices.

**"That's what she said!"** - Michael Scott 📱🚀 