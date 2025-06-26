# 🧪 TribeFind Testing Guide

> **Easy installation for iOS and Android testers**

## 📱 **Quick Install Options**

### **Option 1: QR Code (Easiest)**
1. **Open your camera app** (iPhone) or **scan with any QR reader**
2. **Scan the QR code** provided in our messages
3. **Tap the notification** to install
4. **Follow device prompts** to complete installation

### **Option 2: Direct Links**
**iOS Build**: [Install on iPhone/iPad](https://expo.dev/accounts/jfuginay/projects/snapchat-clone/builds/98fadb10-e1fb-469c-a886-4d75320936b7)

**Android Build**: [Install on Android](https://expo.dev/accounts/jfuginay/projects/snapchat-clone/builds/2844ed64-0217-4f71-af7a-cbb45a767640)

---

## 🎯 **What to Test**

### **🔐 Core Features**
- [ ] **Sign in with Twitter** - Test authentication flow
- [ ] **Profile setup** - Add display name, avatar, interests
- [ ] **Location permissions** - Grant when prompted for best experience

### **📸 Media Capture** 
- [ ] **Photo capture** - Take photos with front/back camera
- [ ] **Video recording** - Test 3s, 5s, 10s, and 30s video clips
- [ ] **Gallery viewing** - View your captured photos and videos
- [ ] **Cloud sync** - Photos/videos should save and sync

### **👥 Social Features**
- [ ] **Find friends** - Search for other users
- [ ] **Send friend requests** - Add people to your network
- [ ] **Real-time chat** - Message with friends
- [ ] **Activity matching** - Discover shared interests

### **📍 Location Features**
- [ ] **Map view** - See nearby tribe members (if any)
- [ ] **Location settings** - Set home location
- [ ] **Privacy controls** - Manage location sharing

---

## 🚨 **Known Issues & Workarounds**

### **Maps Not Loading (iOS)**
- **Issue**: "AirGoogleMaps dir must be added" error
- **Status**: Fix in progress, maps will be updated in next build
- **Workaround**: Other features work perfectly

### **Development Build Required**
- **Video recording** requires the development build (not Expo Go)
- **Use the QR codes/links above** for full feature access

### **First Launch**
- **Grant all permissions** when prompted for best experience
- **Internet required** for authentication and cloud features
- **Location services** needed for map and discovery features

---

## 📋 **Testing Checklist**

### **Quick 5-Minute Test**
1. ✅ Install app and sign in with Twitter
2. ✅ Set up profile (name, interests)
3. ✅ Take a photo and record a short video
4. ✅ View your media in the gallery
5. ✅ Try the map view (location permission)

### **Full Feature Test (15 minutes)**
1. ✅ Complete quick test above
2. ✅ Search for other users
3. ✅ Send a friend request
4. ✅ Test real-time chat
5. ✅ Explore activity/interest features
6. ✅ Test all camera modes and durations

---

## 🐛 **How to Report Issues**

### **What to Include**
- **Device type**: iPhone 13, Samsung Galaxy S22, etc.
- **What you were doing**: "Taking a video", "Opening map", etc.
- **What happened**: Error message, crash, unexpected behavior
- **Screenshots/videos**: If possible

### **Where to Report**
- **GitHub Issues**: [Create an issue](https://github.com/jfuginay/snapchat-clone/issues)
- **Direct message**: Send feedback directly to development team
- **In-app**: Use any feedback features if available

---

## 🔧 **Troubleshooting**

### **App Won't Install**
- **iOS**: Check if device is registered for testing
- **Android**: Enable "Install from unknown sources" in settings
- **Both**: Ensure you have sufficient storage space

### **Camera/Video Issues**
- **Grant camera permissions** when prompted
- **Grant microphone permissions** for video recording
- **Check device storage** - videos need space to save

### **Login Problems**
- **Check internet connection**
- **Try Twitter app login** if web login fails
- **Clear browser cache** if login page won't load

### **Map/Location Issues**
- **Grant location permissions** in device settings
- **Enable location services** for the app
- **Check GPS signal** - works better outdoors

---

## 🌟 **App Highlights**

### **What Makes TribeFind Special**
- **FIND Framework**: Find Interest Nurture Discovery
- **Real-time Discovery**: Connect with like-minded people nearby
- **Professional Media**: High-quality photo and video capture
- **Seamless Social**: Chat, activities, and friend management
- **Privacy-First**: Control your location and data sharing

### **Technical Innovation**
- **React Native + Expo**: Cross-platform performance
- **Supabase Backend**: Real-time data and authentication
- **Cloud Storage**: Your media syncs across devices
- **Location Intelligence**: PostGIS-powered discovery

---

## 📱 **Device Requirements**

### **iOS**
- **iOS 13.0+** required
- **Camera access** for photo/video features
- **Location services** for discovery features
- **Internet connection** for authentication and sync

### **Android** 
- **Android 6.0+ (API 23+)** required
- **Camera and microphone** permissions needed
- **Storage permissions** for media saving
- **Google Play Services** for maps (if available)

---

## 🎉 **Thank You for Testing!**

Your feedback helps make TribeFind better for everyone. This app demonstrates **incremental AI-assisted development** - each feature built thoughtfully and tested thoroughly.

**Version**: 1.3.0 (Latest)  
**Last Updated**: January 2025  
**Features**: Photos, Videos, Chat, Discovery, Maps

---

## 📞 **Contact & Support**

- **Development Team**: Available for questions and feedback
- **Response Time**: Usually within 24 hours
- **Priority**: Bug reports and critical issues first

**Happy testing!** 🚀 