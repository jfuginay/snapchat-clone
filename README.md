# 🌟 TribeFind - Social Discovery Platform

> **Built with Incremental AI Development** - A React Native app demonstrating the power of iterative AI-assisted development

[![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)](https://github.com/jfuginay/snapchat-clone)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)](https://reactnative.dev/)
[![Framework](https://img.shields.io/badge/framework-React%20Native%20%7C%20Expo-000.svg)](https://expo.dev/)

**TribeFind** helps you discover and connect with like-minded people nearby through shared interests and activities. Built using the **FIND Framework** - **Find Interest Nurture Discovery**.

---

## 🚀 **Try TribeFind Now!**

### **📱 Install on Your Device**

Test all features including **professional video recording** and **real-time social discovery**:

#### **iOS (iPhone/iPad)**
<div align="center">

![iOS QR Code](https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://expo.dev/accounts/jfuginay/projects/snapchat-clone/builds/98fadb10-e1fb-469c-a886-4d75320936b7)

**[📱 Direct Install Link](https://expo.dev/accounts/jfuginay/projects/snapchat-clone/builds/98fadb10-e1fb-469c-a886-4d75320936b7)**
</div>

#### **Android**
<div align="center">

![Android QR Code](https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://expo.dev/accounts/jfuginay/projects/snapchat-clone/builds/2844ed64-0217-4f71-af7a-cbb45a767640)

**[🤖 Direct Install Link](https://expo.dev/accounts/jfuginay/projects/snapchat-clone/builds/2844ed64-0217-4f71-af7a-cbb45a767640)**
</div>

### **⚡ Quick Test (2 minutes)**
1. **📷 Scan QR code** with your camera app
2. **🔑 Sign in with Twitter** 
3. **📸 Take a photo** and **🎥 record a video** (3s, 5s, 10s, or 30s!)
4. **👥 Explore social features** and **📍 location discovery**

**Need help?** Check out our [Quick Start Guide](TESTER_QUICK_START.md) or [Full Testing Guide](TESTING_GUIDE.md).

---

## 🎯 **Incremental AI Development Journey**

This project showcases **incremental AI-assisted development** - building features step-by-step with AI guidance, resulting in production-ready code.

### **Phase 1: Foundation** ✅
- **Auth System**: Complete Twitter OAuth + Supabase integration
- **Core Navigation**: Tab-based navigation with 5 main screens
- **Profile Management**: User profiles with avatar upload
- **Location Services**: Real-time location tracking with privacy controls

### **Phase 2: Social Features** ✅
- **Friend System**: Add/remove friends with real-time status
- **Chat Integration**: Real-time messaging with Supabase
- **Activities System**: Discover shared interests and activities
- **Map Integration**: Find nearby tribe members with shared interests

### **Phase 3: Media Capture** ✅ **[LATEST]**
- **Photo Capture**: Full-featured camera with cloud storage
- **Video Recording**: Professional video capture (3s, 5s, 10s, 30s clips)
- **Media Gallery**: Grid-based photo/video galleries with playback
- **Storage Integration**: Supabase storage with RLS policies

### **Phase 4: Advanced Features** 🚧 **[COMING SOON]**
- **Stories/Temporary Content**: Disappearing photos/videos
- **Video Filters**: Real-time video effects and filters
- **Group Activities**: Create and join group events
- **Push Notifications**: Real-time activity notifications

---

## 🎥 **Latest Feature: Video Capture**

Just implemented professional-grade video recording with:

### **🎬 Recording Features**
- **Multiple Durations**: 3, 5, 10, and 30-second clips
- **Professional UI**: Full-screen recording interface with progress tracking
- **Camera Controls**: Front/back camera switching with flash control
- **Auto-Stop**: Automatic recording termination at selected duration

### **📱 Media Management**
- **Cloud Storage**: Videos uploaded to Supabase with user-specific folders
- **Gallery View**: Grid-based video gallery with play button overlays
- **Full-Screen Player**: Native video controls with seek, play, pause
- **User Stats**: Track videos_shared count and snap_score points

---

## 🚀 **Quick Start (5 Minutes)**

### Prerequisites
- Node.js 18+ 
- iOS device or Android device (for video features)
- Supabase account

### 1. Clone & Install
```bash
git clone <repository-url>
cd snapchat-clone
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp env-template.txt .env

# Add your Supabase credentials to .env:
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
Run these SQL scripts in your Supabase SQL Editor:
```bash
# 1. Core database
COMPLETE_DATABASE_SETUP.sql

# 2. Storage buckets
supabase-storage-setup.sql

# 3. Video infrastructure (new!)
create-videos-bucket.sql
video-database-setup.sql
```

### 4. Development Build (Required for Video)
```bash
# iOS
eas build --platform ios --profile development

# Android  
eas build --platform android --profile development
```

### 5. Test the App
Install the development build on your device and test all features!

---

## 🛠 **Technology Stack**

### **Frontend**
- **React Native** with Expo SDK 53
- **TypeScript** for type safety
- **Redux Toolkit** for state management
- **React Navigation** for routing

### **Camera & Media**
- **react-native-vision-camera** for professional video recording
- **expo-camera** for photo capture
- **expo-av** for video playback
- **expo-media-library** for device storage

### **Backend Services**
- **Supabase** for database, auth, and storage
- **PostGIS** for location-based queries
- **Row Level Security** for data protection

---

## 🎯 **AI Development Methodology**

This project demonstrates **incremental AI-assisted development**:

### **✅ Iterative Feature Building**
- Start with core functionality
- Add features incrementally
- Test and validate each step
- Build on previous successes

### **✅ AI-Guided Architecture**
- AI helps design scalable patterns
- Consistent code organization
- Proper error handling throughout
- Production-ready implementations

### **✅ Comprehensive Documentation**
- Every feature fully documented
- Setup guides for quick onboarding
- Troubleshooting for common issues
- Clear next steps for expansion

---

**Built with ❤️ using incremental AI development**

*TribeFind v1.3.0 - Find your tribe, nurture connections, discover together* 🌟 