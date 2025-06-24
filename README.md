# Snapchat Clone - React Native

A full-featured Snapchat clone built with React Native, Expo, and Supabase. Features real-time authentication, camera functionality, cloud photo storage, and a modern user interface.

## 🚀 Features

### ✅ Implemented
- **Authentication System** - Sign up, login, logout with Supabase Auth
- **Camera Integration** - Take photos with front/back camera toggle and flash control
- **Cloud Storage** - Upload and store photos in Supabase Storage with RLS policies
- **Photo Gallery** - View, scroll, and delete your photos
- **Real-time Stats** - Profile stats that update automatically when photos are taken
- **Redux State Management** - Comprehensive state management with 5 slices
- **Location Services** - Privacy-controlled location tracking and settings
- **Secure Configuration** - Environment variable-based configuration (no hardcoded secrets)

### 🔄 In Progress
- Map integration with friend locations
- Real-time messaging between users
- Story/snap sharing with expiration
- Friend discovery and management

## 🛠 Tech Stack

- **Frontend**: React Native with Expo
- **State Management**: Redux Toolkit
- **Backend**: Supabase (Auth, Database, Storage)
- **Database**: PostgreSQL with Row Level Security
- **Storage**: Supabase Storage with signed URLs
- **Navigation**: React Navigation 6
- **Camera**: Expo Camera with media library integration

## 📱 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator or Android Emulator (or Expo Go app)
- Supabase account

### 1. Clone and Install
```bash
git clone https://github.com/jfuginay/snapchat-clone.git
cd snapchat-clone
npm install
```

### 2. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API to get your credentials
3. Run the database setup script in Supabase SQL Editor:
   ```sql
   -- Copy and paste contents of database-setup-safe.sql
   ```
4. Set up storage bucket by running:
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

## 🏗 Project Structure

```
snapchat-clone/
├── screens/           # App screens (Auth, Camera, Home, Profile, etc.)
├── components/        # Reusable UI components
├── navigation/        # React Navigation setup
├── store/            # Redux store and slices
├── services/         # Authentication and API services
├── lib/              # Supabase configuration and utilities
├── assets/           # Images, icons, and static assets
└── database-*.sql    # Database setup scripts
```

## 🔐 Security Features

- ✅ Environment variables for all sensitive data
- ✅ Row Level Security (RLS) policies on all database tables
- ✅ User-specific photo storage with access controls
- ✅ Signed URLs for secure image access
- ✅ No hardcoded credentials in source code
- ✅ Proper authentication flow with session management

## 📊 Database Schema

### Core Tables
- `users` - Extended user profiles with settings and stats
- `photos` - Photo metadata with cloud storage URLs
- `locations` - User location history (privacy-controlled)
- `chat_rooms` - Messaging infrastructure
- `messages` - Chat messages with metadata
- `friendships` - Friend relationships and requests

## 🚀 Deployment

The app supports deployment via Expo Application Services (EAS):

```bash
# Build for iOS
eas build --platform ios

# Build for Android  
eas build --platform android
```

Current deployment: [Expo Build Dashboard](https://expo.dev/accounts/jfuginay/projects/snapchat-clone)

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

## 📖 Additional Documentation

- [Database Setup Guide](DATABASE_FIX_GUIDE.md)
- [Camera Implementation](CAMERA_SETUP_GUIDE.md)
- [Storage Configuration](STORAGE_SETUP_GUIDE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is for educational purposes. Please respect Snapchat's intellectual property and trademarks.

## 🔗 Links

- **GitHub Repository**: https://github.com/jfuginay/snapchat-clone
- **Expo Project**: https://expo.dev/accounts/jfuginay/projects/snapchat-clone
- **Supabase Documentation**: https://supabase.com/docs

---

Built with ❤️ using React Native and Supabase 