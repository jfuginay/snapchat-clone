# TribeFind - Find Your Tribe Through Shared Interests

**Find Interest Nurture Development (FIND)**

TribeFind is a revolutionary social discovery platform that connects people through shared passions and interests. Built with AI-first principles at [EnginDearing.soy](https://tribefind.engindearing.soy/), TribeFind helps you discover your tribe by finding others who share your hobbies, skills, and interests in your local area.

## 🎯 The FIND Framework

**F** - **Find** people with shared interests and passions  
**I** - **Interest** discovery through activities and hobbies  
**N** - **Nurture** meaningful connections and relationships  
**D** - **Development** of skills and community growth  

Visit us at: **[https://tribefind.engindearing.soy/](https://tribefind.engindearing.soy/)**

## 🚀 TribeFind Features

### ✅ Core FIND Features
- **🎯 Interest Discovery** - Select activities and hobbies that define your passions
- **🗺️ Tribe Mapping** - Find nearby people with shared interests using PostGIS spatial queries
- **📍 Location-Based Discovery** - Discover tribe members within configurable radius (5km/10km/25km)
- **🤝 Activity Matching** - Connect with people who share your specific interests and skill levels
- **📱 Beautiful Onboarding** - TribeFind-branded authentication with AI-first principles messaging
- **🔒 Privacy First** - Granular privacy controls for location sharing and tribe visibility
- **📊 Real-time Stats** - Track your tribe connections and shared activity discoveries

### ✅ Technical Implementation
- **Authentication System** - Secure signup/login with Supabase Auth and profile creation
- **Camera Integration** - Capture and share moments with your tribe
- **Cloud Storage** - Secure photo storage with Row Level Security policies
- **Redux State Management** - Comprehensive state management across 5 slices
- **PostGIS Integration** - Advanced spatial queries for nearby tribe member discovery
- **Activity System** - Comprehensive activity database with categories and skill levels

### 🔄 Tribe Development Roadmap
- Enhanced tribe messaging and communication
- Activity-based event creation and planning
- Skill sharing and mentorship connections
- Tribe analytics and growth insights
- AI-powered tribe recommendations

## 🛠 Tech Stack

**Built with AI-First Principles at EnginDearing.soy**

- **Frontend**: React Native with Expo
- **State Management**: Redux Toolkit
- **Backend**: Supabase (Auth, Database, Storage)
- **Database**: PostgreSQL with PostGIS for spatial queries
- **Location Services**: PostGIS ST_DWithin for nearby tribe discovery
- **Maps**: React Native Maps with custom tribe member markers
- **Storage**: Supabase Storage with Row Level Security
- **Navigation**: React Navigation 6 with tab-based tribe discovery
- **Camera**: Expo Camera for tribe moment capture

## 📱 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator or Android Emulator (or Expo Go app)
- Supabase account

### 1. Clone and Install
```bash
git clone https://github.com/jfuginay/tribefind.git
cd tribefind
npm install
```

### 2. Supabase Setup for TribeFind
1. Create a new project at [supabase.com](https://supabase.com)
2. **Enable PostGIS Extension** for spatial tribe discovery
3. Go to Project Settings → API to get your credentials
4. Run the complete TribeFind database setup:
   ```sql
   -- Copy and paste contents of COMPLETE_DATABASE_SETUP.sql
   -- This creates activities, user_activities, spatial indexes, and PostGIS functions
   ```
5. Set up photo storage bucket:
   ```sql
   -- Copy and paste contents of supabase-storage-setup.sql
   ```

### 3. Environment Configuration
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Fill in your Supabase credentials in `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### 4. Run the App
```bash
npx expo start
```

Scan the QR code with Expo Go (Android) or Camera app (iOS) to run on your device.

## 🏗 TribeFind Project Structure

```
tribefind/
├── screens/           # TribeFind screens (Auth, Camera, Home, Map, Profile)
│   ├── MapScreen.tsx     # Nearby tribe member discovery with PostGIS
│   ├── AuthScreen.tsx    # Beautiful TribeFind-branded authentication
│   └── ProfileScreen.tsx # User profile with tribe stats
├── components/        # Reusable tribe discovery components
│   └── ActivitySelector.js # Interest and hobby selection
├── src/
│   ├── services/         # Location service with PostGIS integration
│   ├── sql/             # PostGIS functions and activity schemas
│   └── examples/        # Usage examples for tribe features
├── store/            # Redux store for tribe state management
├── services/         # Authentication and tribe services
├── lib/              # Supabase configuration for TribeFind
├── assets/           # TribeFind branding and icons
└── *_SETUP.sql       # Complete database setup for tribe discovery
```

## 🔐 Security Features

- ✅ Environment variables for all sensitive data
- ✅ Row Level Security (RLS) policies on all database tables
- ✅ User-specific photo storage with access controls
- ✅ Signed URLs for secure image access
- ✅ No hardcoded credentials in source code
- ✅ Proper authentication flow with session management

## 📊 TribeFind Database Schema

### Core Tribe Discovery Tables
- `users` - Extended profiles with PostGIS location and tribe stats
- `activities` - Comprehensive activity/interest database with categories and icons
- `user_activities` - User's selected interests with skill levels (beginner/intermediate/advanced)
- `photos` - Tribe moment photos with cloud storage URLs
- `friendships` - Tribe member connections and requests
- `chat_rooms` - Tribe communication channels
- `messages` - Tribe chat messages with metadata

### PostGIS Spatial Features
- **Location Column**: `GEOMETRY(POINT, 4326)` for precise coordinate storage
- **Spatial Indexes**: GIST indexes for optimal nearby tribe member queries
- **ST_DWithin Function**: Efficient radius-based tribe member discovery
- **Distance Calculations**: Real-time distance sorting for nearby tribe members

## 🚀 Deployment

The app supports deployment via Expo Application Services (EAS):

```bash
# Build for iOS
eas build --platform ios

# Build for Android  
eas build --platform android
```

Current deployment: [Expo Build Dashboard](https://expo.dev/accounts/jfuginay/projects/tribefind)

## 🔧 Development

### Debug Logs
The app includes comprehensive debug logging:
- Environment variable loading
- Authentication state changes
- Photo upload/download processes
- Database connection status

### Common Issues
1. **Images not loading**: Check Supabase storage bucket configuration
2. **Authentication fails**: Verify environment variables and Supabase setup
3. **Camera not working**: Ensure proper permissions in app.json

## 📖 TribeFind Documentation

- [Complete Database Setup](COMPLETE_DATABASE_SETUP.sql) - PostGIS and activity tables
- [Database Error Fix Guide](DATABASE_ERROR_FIX.md) - Troubleshooting setup issues
- [MapScreen Implementation](MAP_SCREEN_FIX_GUIDE.md) - Nearby tribe member discovery
- [Camera Implementation](CAMERA_SETUP_GUIDE.md) - Tribe moment capture
- [Storage Configuration](STORAGE_SETUP_GUIDE.md) - Cloud photo storage
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Expo deployment process

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

TribeFind is built with AI-first principles for connecting communities through shared interests. This project demonstrates modern React Native development with PostGIS spatial databases for social discovery platforms.

## 🔗 TribeFind Links

- **TribeFind Website**: [https://tribefind.engindearing.soy/](https://tribefind.engindearing.soy/)
- **GitHub Repository**: https://github.com/jfuginay/tribefind
- **Expo Project**: https://expo.dev/accounts/jfuginay/projects/tribefind
- **EnginDearing.soy**: AI-First Engineering Principles
- **Supabase Documentation**: https://supabase.com/docs
- **PostGIS Documentation**: https://postgis.net/docs

---

**Built with AI-First Principles at EnginDearing.soy**  
🎯 **TribeFind** - Where innovation meets community  
**FIND**: Find Interest Nurture Development  

*Connecting tribes through shared passions* ❤️ 