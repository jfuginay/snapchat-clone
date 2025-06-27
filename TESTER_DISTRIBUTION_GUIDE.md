# TribeFind Beta Testing Guide 🧪

## Welcome Beta Testers! 🎉

Thank you for helping test TribeFind! This guide will help you install and test the app on your device.

---

## 📱 **Installation Options**

### **Option 1: EAS Development Build (Recommended)**
This is a native build with all features working, including Google Sign In.

#### **For iOS:**
1. **Install via TestFlight** (if provided)
2. **Or Direct Install**: Click the iOS build link when provided
3. **Device Requirements**: iOS 13.0+ required

#### **For Android:**
1. **Download APK**: Click the Android build link when provided
2. **Install APK**: Allow installation from unknown sources if prompted
3. **Device Requirements**: Android 7.0+ required

### **Option 2: Expo Go (Limited Features)**
Quick testing with Expo Go app, but some features may not work.

#### **Steps:**
1. **Download Expo Go** from App Store/Google Play
2. **Scan QR Code**: Use the QR code provided below
3. **Note**: Google Sign In and some native features won't work in Expo Go

---

## 🔗 **Access Links**

### **Development Builds**
- **iOS Build**: [Will be provided after build completes]
- **Android Build**: [Will be provided after build completes]

### **Expo Go Testing**
- **QR Code**: [Scan with Expo Go app]
- **Link**: exp://exp.host/@jfuginay/snapchat-clone

---

## 🧪 **What to Test**

### **Core Features**
- [ ] **Authentication**: Email/password sign up and sign in
- [ ] **Google Sign In**: "Continue with Google" button (Development builds only)
- [ ] **Profile Setup**: Username, display name, avatar selection
- [ ] **Navigation**: All screens accessible and working
- [ ] **Camera**: Photo capture and sharing
- [ ] **Maps**: Location display and nearby users
- [ ] **Chat**: Messaging functionality
- [ ] **Activities**: Activity selection and suggestions

### **User Flows to Test**

#### **1. New User Registration**
1. Open app → Tap "Join Now"
2. Enter email, password, username, display name
3. Complete profile setup
4. Verify you land on HomeScreen

#### **2. Google Sign In (Development builds only)**
1. Open app → Tap "Continue with Google"
2. Sign in with Google account
3. Verify profile created automatically
4. Check all features work normally

#### **3. Existing User Sign In**
1. Sign out if logged in
2. Tap "Sign In" → Enter credentials
3. Verify you're logged back in

#### **4. Core App Usage**
1. Navigate between tabs (Home, Camera, Map, Chat, Profile)
2. Take a photo with camera
3. View map and check location features
4. Update profile information
5. Test chat functionality

---

## 🐛 **Bug Reporting**

### **What to Report**
- **Crashes**: App closes unexpectedly
- **UI Issues**: Broken layouts, missing elements
- **Feature Problems**: Buttons not working, incorrect behavior
- **Performance**: Slow loading, lag, freezing
- **Authentication Issues**: Can't sign in/up, errors

### **How to Report**
1. **Screenshot/Video**: Capture the issue if possible
2. **Steps to Reproduce**: What did you do before the issue?
3. **Device Info**: iPhone/Android model, OS version
4. **Expected vs Actual**: What should happen vs what happened

### **Report To**
- **Email**: [Your email for bug reports]
- **Include**: Screenshots, device info, steps to reproduce

---

## 📋 **Test Scenarios**

### **Scenario 1: First-Time User**
```
Goal: Complete onboarding as a new user
Steps:
1. Download and open app
2. Tap "Join Now"
3. Fill out registration form
4. Complete profile setup
5. Explore all main features
6. Take at least one photo
7. Update profile information

Expected: Smooth onboarding, all features accessible
```

### **Scenario 2: Google Sign In User**
```
Goal: Sign up using Google account
Steps:
1. Open app
2. Tap "Continue with Google"
3. Sign in with Google
4. Verify profile auto-created
5. Test all features work normally

Expected: Quick sign up, profile populated from Google
```

### **Scenario 3: Power User Testing**
```
Goal: Stress test the app
Steps:
1. Sign in/out multiple times
2. Take many photos quickly
3. Navigate rapidly between screens
4. Test edge cases (no internet, background/foreground)
5. Try invalid inputs in forms

Expected: App remains stable, handles errors gracefully
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **"App won't install" (iOS)**
- Check iOS version (13.0+ required)
- Ensure device is registered for testing
- Try restarting device

#### **"Unknown sources" (Android)**
- Go to Settings → Security → Allow unknown sources
- Or Settings → Apps → Special access → Install unknown apps

#### **"Google Sign In not working"**
- Only works in development builds, not Expo Go
- Ensure you're using a development build
- Check internet connection

#### **"Camera not working"**
- Grant camera permissions when prompted
- Check device camera works in other apps
- Restart app if needed

#### **"Location not working"**
- Grant location permissions when prompted
- Enable location services in device settings
- Check internet connection for maps

---

## 📊 **Testing Checklist**

### **Basic Functionality**
- [ ] App launches successfully
- [ ] Registration works
- [ ] Sign in works
- [ ] Google Sign In works (dev builds)
- [ ] All tabs navigate properly
- [ ] Camera captures photos
- [ ] Maps display correctly
- [ ] Profile updates save
- [ ] Sign out works

### **Edge Cases**
- [ ] No internet connection handling
- [ ] Invalid form inputs
- [ ] Background/foreground transitions
- [ ] Device rotation (if applicable)
- [ ] Low memory situations
- [ ] Rapid button tapping

### **Performance**
- [ ] App loads quickly
- [ ] Smooth navigation
- [ ] No crashes during normal use
- [ ] Battery usage reasonable
- [ ] Memory usage stable

---

## 🎯 **Focus Areas**

### **High Priority**
1. **Authentication flows** (email and Google)
2. **Core navigation** between screens
3. **Camera functionality**
4. **Profile management**

### **Medium Priority**
1. **Maps and location features**
2. **Chat functionality**
3. **Activity selection**
4. **Settings and preferences**

### **Low Priority**
1. **UI polish and animations**
2. **Advanced features**
3. **Edge case handling**

---

## 📱 **Device Compatibility**

### **iOS Requirements**
- **Minimum**: iOS 13.0
- **Recommended**: iOS 15.0+
- **Devices**: iPhone 7 and newer
- **Features**: Camera, location, notifications

### **Android Requirements**
- **Minimum**: Android 7.0 (API 24)
- **Recommended**: Android 10+
- **Features**: Camera, location, notifications
- **RAM**: 3GB+ recommended

---

## 🚀 **Getting Started**

1. **Choose your installation method** (Development build recommended)
2. **Install the app** using provided links
3. **Test core features** using the scenarios above
4. **Report any issues** you encounter
5. **Provide feedback** on user experience

---

## 📞 **Support**

### **Need Help?**
- **Technical Issues**: Check troubleshooting section first
- **Bug Reports**: Use the bug reporting format above
- **General Questions**: Contact the development team

### **Thank You!**
Your testing helps make TribeFind better for everyone. We appreciate your time and feedback! 🙏

---

**Happy Testing!** 🎉

*TribeFind Beta v1.3.0 - Built with ❤️ by the EnginDearing team* 