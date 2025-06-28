# 🎬 TribeFind Demo Setup

## 🎯 For Instructors & Demo Video

This is a complete social discovery app built with React Native/Expo. Students and instructors can run this locally for grading and demonstration.

## ⚡ Quick Start (5 Minutes)

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Setup Environment (IMPORTANT)**
The demo script will automatically create the environment file, but if you need to create it manually:

```bash
# Create .env.local file with demo credentials
cat > .env.local << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://rfvlxtzjtcaxkxisyuys.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdmx4dHpqdGNheGt4aXN5dXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3Nzg3NDgsImV4cCI6MjA2NjM1NDc0OH0.OrN9YGA5rzcC1mUjxd2maeAUFmnx9VixMgnm_LdLIVM
GOOGLE_PLACES_API_KEY=AIzaSyBYv5SK3gpQnNaMF9IKu3uIx_V-y2nDLho
EOF
```

### 3. **Start Expo Development Server**
```bash
npx expo start
```

### 4. **Run on Device/Simulator**
- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal  
- **Physical Device**: Scan QR code with Expo Go app

### 5. **Demo Accounts (Pre-configured)**
```
Primary Demo Account:
Email: demo@tribefind.app
Password: DemoUser123!

Test Account 1:
Email: test1@tribefind.app  
Password: TestUser123!

Test Account 2:
Email: test2@tribefind.app
Password: TestUser123!
```

## 🚀 Key Features to Demo

### **1. Authentication System**
- ✅ Email/Password sign-up and sign-in
- ✅ Google Sign-In integration
- ✅ Twitter OAuth authentication
- ✅ Secure session management

### **2. Social Discovery**
- ✅ Location-based user discovery
- ✅ Interest matching and filtering
- ✅ Real-time nearby users map
- ✅ Activity-based connections

### **3. Communication**
- ✅ Real-time messaging system
- ✅ Chat list with conversation history
- ✅ Friend request system
- ✅ User search and discovery

### **4. Profile Management**
- ✅ Complete profile setup
- ✅ Interest selection (50+ activities)
- ✅ Avatar and bio customization
- ✅ Privacy settings control

### **5. Camera & Media**
- ✅ Camera integration
- ✅ Photo capture and sharing
- ✅ Video recording capabilities
- ✅ Image filters and effects

### **6. Maps & Location**
- ✅ Interactive Google Maps
- ✅ Real-time location sharing
- ✅ Nearby users visualization
- ✅ Location privacy controls

## 📱 Demo Flow for Video/Presentation

### **Part 1: Onboarding (2 minutes)**
1. Open app → Show splash screen
2. Sign up with demo account
3. Complete profile setup
4. Select interests (Photography, Hiking, Coffee, etc.)

### **Part 2: Social Discovery (3 minutes)**
1. Navigate to Map screen → Show nearby users
2. Go to User Search → Find test users
3. Send friend request → Accept on second account
4. Show friend connection success

### **Part 3: Communication (2 minutes)**
1. Open Chat List → Show conversations
2. Start new chat with friend
3. Send messages → Real-time delivery
4. Show message history and timestamps

### **Part 4: Advanced Features (3 minutes)**
1. Camera screen → Take photo with filters
2. Activities screen → Browse interests
3. Profile screen → Show settings
4. Google/Twitter sign-in demonstration

## 🔧 Technical Architecture

### **Frontend**
- **React Native** with Expo SDK 53
- **TypeScript** for type safety
- **Redux Toolkit** for state management
- **React Navigation** for routing

### **Backend**
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security
- **Real-time subscriptions** for live features
- **RESTful API** with automatic generation

### **Key Services**
- **Google Maps API** for location features
- **Google OAuth** for authentication
- **Twitter API v2** for social login
- **Expo Camera** for media capture

## 🎮 Interactive Demo Features

### **Real-time Features**
- Live location updates
- Instant messaging
- Friend request notifications
- Online status indicators

### **Offline Capabilities**
- Cached user data
- Offline message queue
- Progressive loading
- Network resilience

## 📊 Grading Criteria Checklist

### **✅ Code Quality**
- TypeScript implementation
- Component architecture
- State management patterns
- Error handling

### **✅ User Experience**
- Intuitive navigation
- Responsive design
- Loading states
- Error messages

### **✅ Technical Implementation**
- Database design
- API integration
- Authentication flow
- Real-time features

### **✅ Mobile Optimization**
- Performance optimization
- Network handling
- Memory management
- Battery efficiency

## 🐛 Troubleshooting

### **Common Issues**

**"Cannot connect to server"**
- Ensure internet connection
- Try switching between WiFi/cellular
- Restart Expo development server

**"Location not working"**
- Enable location permissions
- Ensure location services are on
- Try on physical device (not simulator)

**"Camera not working"**
- Grant camera permissions
- Test on physical device
- Check camera hardware availability

### **Reset Demo Data**
```bash
# Reset to fresh demo state
git checkout demo
npm install
npx expo start --clear
```

## 📞 Support

**For Instructors:**
- Email: j.wylie.81@gmail.com
- All demo accounts are pre-configured
- No additional setup required

**For Students:**
- Check console logs for debugging
- Use demo accounts for testing
- Follow troubleshooting guide above

---

## 🎉 Demo Success Checklist

- [ ] App starts successfully
- [ ] Demo account sign-in works
- [ ] Map shows nearby users
- [ ] Messaging system functions
- [ ] Camera captures photos
- [ ] All major features demonstrated

**"That's what she said!"** - Michael Scott 🎬

**Ready for demo and grading! All features working and optimized.** ✨ 