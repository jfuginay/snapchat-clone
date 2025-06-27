# 📸 App Store Screenshot Capture Guide

## 🎯 **Required Screenshots for App Store**

You need **5 screenshots** in iPhone 14 Pro Max resolution (1290 x 2796 pixels).

## 📱 **Screenshot Specifications**

### **Technical Requirements**
```
Device: iPhone 14 Pro Max (or simulator)
Resolution: 1290 x 2796 pixels
Format: PNG or JPEG
Color Space: sRGB or P3
Size: Up to 500MB per image
Orientation: Portrait
```

### **Content Requirements**
- Show actual app interface (no mockups)
- Include realistic demo data
- Ensure text is readable
- Show key features clearly
- Use consistent theme/lighting
- Include status bar with good signal/battery

## 📋 **Screenshot Capture Process**

### **Step 1: Set Up iPhone 14 Pro Max Simulator**
```bash
# Open Xcode and launch simulator
open -a Simulator

# Or use iOS Simulator directly
# Device → iPhone 14 Pro Max
# Appearance → Light (recommended for App Store)
```

### **Step 2: Install Your App**
```bash
# Install latest build on simulator
eas build:run --platform ios --latest --simulator
```

### **Step 3: Prepare Demo Data**
- Run the demo accounts SQL script in Supabase
- Sign in with demo@tribefind.app / DemoUser123!
- Complete profile setup with interests

## 🎬 **Screenshot Sequence**

### **Screenshot 1: Authentication Screen**
**File Name**: `01_authentication.png`
**Content**: Sign-in screen with all authentication options

#### **Setup Instructions:**
1. Open app (should show authentication screen)
2. Ensure all buttons are visible:
   - "Sign in with Google" button
   - "Sign in with Twitter" button  
   - Email sign-in option
   - "Create Account" option
3. Clean interface with app logo
4. Good status bar (full battery, strong signal)

#### **Caption for App Store:**
```
Secure sign-in with Google, Twitter, or email
```

### **Screenshot 2: Profile Setup/Interests**
**File Name**: `02_profile_setup.png`
**Content**: Interest selection screen with multiple interests selected

#### **Setup Instructions:**
1. Sign in with demo account
2. Navigate to profile setup or interests screen
3. Show multiple interests selected (Photography, Hiking, Coffee, etc.)
4. Ensure UI shows variety of available interests
5. Clean, organized grid layout

#### **Caption for App Store:**
```
Create your profile and choose your interests
```

### **Screenshot 3: Map View with Nearby Users**
**File Name**: `03_map_view.png`
**Content**: Interactive map showing nearby users with pins

#### **Setup Instructions:**
1. Navigate to map/home screen
2. Ensure location permissions are enabled
3. Map should show:
   - User's current location
   - Nearby test users (test1, test2) as pins
   - Clear map interface
   - Good zoom level showing San Francisco area
4. User pins should be visible and well-distributed

#### **Caption for App Store:**
```
Discover like-minded people nearby
```

### **Screenshot 4: Chat/Messaging Interface**
**File Name**: `04_chat_messaging.png`
**Content**: Active conversation with messages

#### **Setup Instructions:**
1. Navigate to chat/messages screen
2. Open conversation with Test User One
3. Show conversation with sample messages:
   - "Hi there! I noticed we share a love for photography and hiking..."
   - Response messages
   - Clean chat interface
4. Show message input field at bottom
5. Clear, readable message bubbles

#### **Caption for App Store:**
```
Connect and chat with your tribe
```

### **Screenshot 5: Activities/User Discovery**
**File Name**: `05_activities_discovery.png`
**Content**: User profiles or activities screen

#### **Setup Instructions:**
1. Navigate to activities screen or user discovery
2. Show list of nearby users with:
   - Profile photos (or placeholder avatars)
   - Names and interests
   - Distance/location info
   - Shared interests highlighted
3. Clean list layout with user cards
4. Show multiple users for variety

#### **Caption for App Store:**
```
Find people who share your passions
```

## 🛠 **Capture Commands**

### **Using Simulator**
```bash
# Take screenshot in simulator
# Device → Screenshot (Cmd+S)
# Screenshots saved to Desktop by default
```

### **Using Physical Device**
```bash
# iPhone screenshot
# Press Volume Up + Side Button simultaneously
# Screenshots saved to Photos app
```

### **Using Xcode**
```bash
# Via Xcode Device Window
# Window → Devices and Simulators
# Select device → Take Screenshot
```

## ✨ **Screenshot Enhancement Tips**

### **Before Capturing:**
- [ ] Set simulator to iPhone 14 Pro Max
- [ ] Use Light appearance mode
- [ ] Ensure good status bar (full battery, strong signal, no "Carrier" text)
- [ ] Close any debug overlays or development tools
- [ ] Use realistic demo data
- [ ] Check all text is readable

### **Content Guidelines:**
- [ ] Show actual app functionality
- [ ] Include diverse, realistic user data
- [ ] Highlight key features clearly
- [ ] Ensure consistent visual theme
- [ ] No competitor logos or mentions
- [ ] No placeholder text like "Lorem ipsum"
- [ ] No obvious debug/development content

### **Technical Quality:**
- [ ] Full resolution (1290 x 2796)
- [ ] Clear, sharp images
- [ ] Good contrast and readability
- [ ] Consistent lighting across all screenshots
- [ ] No compression artifacts
- [ ] Proper aspect ratio

## 📁 **File Organization**

### **Recommended File Structure:**
```
Screenshots/
├── iPhone_14_Pro_Max/
│   ├── 01_authentication.png
│   ├── 02_profile_setup.png
│   ├── 03_map_view.png
│   ├── 04_chat_messaging.png
│   └── 05_activities_discovery.png
└── Captions.txt
```

### **Caption File Content:**
```
Screenshot 1: Secure sign-in with Google, Twitter, or email
Screenshot 2: Create your profile and choose your interests  
Screenshot 3: Discover like-minded people nearby
Screenshot 4: Connect and chat with your tribe
Screenshot 5: Find people who share your passions
```

## 🚀 **Upload to App Store Connect**

### **Upload Process:**
1. Go to App Store Connect
2. Select TribeFind app
3. Navigate to "App Store" tab
4. Scroll to "App Screenshots"
5. Select "iPhone 14 Pro Max" size class
6. Drag and drop screenshots in order
7. Add captions for each screenshot
8. Save changes

### **Screenshot Order:**
```
1. Authentication (first impression)
2. Profile Setup (onboarding)
3. Map View (core feature)
4. Chat Interface (engagement)
5. Activities/Discovery (value proposition)
```

## ✅ **Quality Checklist**

Before uploading, verify:
- [ ] All 5 screenshots captured
- [ ] Correct resolution (1290 x 2796)
- [ ] Clear, readable content
- [ ] Consistent app theme
- [ ] Good status bar appearance
- [ ] No development/debug content
- [ ] Realistic demo data used
- [ ] Key features highlighted
- [ ] Professional appearance
- [ ] Files properly named

## 🎯 **Pro Tips**

### **Demo Data Setup:**
- Use demo@tribefind.app account for consistency
- Ensure test users (test1, test2) are visible on map
- Create sample conversations for chat screenshots
- Set up complete user profiles with interests

### **Visual Consistency:**
- Use same time of day for all screenshots
- Maintain consistent status bar appearance
- Use same app theme/mode throughout
- Ensure good lighting and contrast

### **Feature Highlighting:**
- Show unique value propositions clearly
- Highlight social/community aspects
- Demonstrate location-based features
- Show ease of use and clean interface

---

## 🎬 **Final Screenshot Sequence Summary**

1. **Authentication** → First impression, security
2. **Profile Setup** → Personalization, interests
3. **Map View** → Core feature, location-based discovery
4. **Chat Interface** → Social interaction, engagement
5. **Activities** → Value proposition, community

**"That's what she said!"** - Michael Scott 📸📱

Perfect screenshots = successful App Store submission! 🎉 