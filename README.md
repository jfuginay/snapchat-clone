# 🌟 TribeFind - AI-Powered Social Discovery Platform

> **Built with Incremental AI Development** - A React Native app showcasing production-ready AI features and real-time social discovery

[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)](https://github.com/jfuginay/snapchat-clone)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)](https://reactnative.dev/)
[![Framework](https://img.shields.io/badge/framework-React%20Native%20%7C%20Expo-000.svg)](https://expo.dev/)

**TribeFind** is a next-generation social discovery platform that helps users find like-minded people nearby through AI-powered recommendations, shared interests, and real-time location features.

---

## 🎓 **For Instructors - Quick Setup**

### **📱 Test on iPhone Immediately (Recommended)**
**TribeFind is live on TestFlight** - no setup required! Just install and test all features:

📧 **Request TestFlight Access**: Email `j.wylie.81@gmail.com` for instant TestFlight invitation  
📖 **Full TestFlight Guide**: [TESTFLIGHT_DISTRIBUTION_GUIDE.md](TESTFLIGHT_DISTRIBUTION_GUIDE.md)

### **⚡ Local Development (5 minutes)**
**Complete setup guide**: [INSTRUCTOR_QUICK_START.md](INSTRUCTOR_QUICK_START.md)

```bash
git clone [repo-url]
cd snapchat-clone
git checkout demo
npm install
# Follow INSTRUCTOR_QUICK_START.md for .env setup
expo start
```

**Demo Accounts Ready**:
- Email: `demo1@tribefind.com` / Password: `demo123456`
- Email: `demo2@tribefind.com` / Password: `demo123456`

---

## 🚀 **Latest Features & Updates**

### **🧠 NEW: Local Knowledge RAG System** ✨
Just implemented a complete **Retrieval-Augmented Generation (RAG)** system for hyper-local recommendations:

#### **What It Does**:
- **AI Local Expert**: Ask natural language questions about your area
- **Hidden Gems Discovery**: Find local secrets beyond standard maps
- **Real-time Data**: Live events, seasonal activities, insider tips
- **Multi-API Integration**: Google Places, OpenStreetMap, Foursquare, Eventbrite

#### **Try These Queries**:
- *"What activities are popular nearby?"*
- *"Find coffee shops with good wifi in this area"*
- *"What should I do tonight?"*
- *"Recommend places based on my location"*

#### **Technical Implementation**:
- **Vector Database**: Supabase with pgvector for semantic search
- **Multi-Source Data**: 4+ APIs providing comprehensive local data
- **LLM Integration**: Google Gemini for natural language responses
- **Geographic Queries**: PostGIS for location-based filtering

**Full Implementation**: [features/rag/IMPLEMENTATION_PLAN.md](features/rag/IMPLEMENTATION_PLAN.md)

### **🎥 Professional Video Capture** ✅
- **Multiple Durations**: 3s, 5s, 10s, 30s clips
- **Professional UI**: Full-screen recording with progress tracking
- **Cloud Storage**: Automatic upload to Supabase
- **Gallery Management**: Grid view with native video player

### **🔐 Universal Authentication** ✅
- **Twitter OAuth**: Fixed redirect issues, seamless sign-in
- **Google Sign-In**: Universal authentication across platforms
- **Email Auth**: Traditional email/password with verification
- **Profile System**: Complete user profiles with avatar upload

### **📍 Real-time Location & Social** ✅
- **Live Location Sharing**: See friends on interactive map
- **Privacy Controls**: Granular location sharing settings
- **Friend System**: Add/remove friends with real-time status
- **Activity Matching**: Find people with shared interests nearby

### **💬 Real-time Messaging** ✅
- **Instant Chat**: Real-time messaging with Supabase
- **Chat Lists**: Organized conversation management
- **Message Status**: Read receipts and delivery confirmation

### **📸 Advanced Camera System** ✅
- **Snapchat-style Interface**: Familiar, intuitive camera UI
- **Photo Filters**: Real-time image processing
- **Cloud Integration**: Automatic photo backup
- **Media Gallery**: Beautiful grid-based photo management

---

## 🎯 **Key Demo Features**

### **1. AI-Powered Discovery** 🧠
- Ask the AI about local recommendations
- Get personalized suggestions based on location
- Discover events and activities in real-time

### **2. Social Connection** 👥
- Find people with shared interests nearby
- Real-time location sharing with privacy controls
- Instant messaging and friend management

### **3. Professional Media** 📱
- High-quality photo and video capture
- Multiple recording durations
- Cloud storage with instant sync

### **4. Universal Access** 🔑
- Multiple sign-in options (Twitter, Google, Email)
- Cross-platform compatibility (iOS/Android)
- Demo accounts for immediate testing

---

## 🛠 **Technology Stack**

### **Frontend**
- **React Native** with Expo SDK 53
- **TypeScript** for type safety
- **Redux Toolkit** for state management
- **React Navigation** for routing

### **AI & Data**
- **RAG Pipeline**: Vector embeddings with semantic search
- **LLM Integration**: Google Gemini for natural language
- **Multi-API Data**: Google Places, OpenStreetMap, Foursquare
- **Vector Database**: Supabase pgvector for similarity search

### **Backend Services**
- **Supabase**: Database, authentication, real-time, storage
- **PostGIS**: Geographic queries and location data
- **Edge Functions**: Serverless API endpoints
- **Row Level Security**: Data protection and privacy

### **Media & Camera**
- **react-native-vision-camera**: Professional video recording
- **expo-camera**: Photo capture with filters
- **expo-av**: Video playback and media management

---

## 🎓 **Educational Value**

This project demonstrates **production-ready AI development** patterns:

### **✅ RAG Implementation**
- Complete vector database setup
- Multi-source data ingestion
- Semantic search with geographic filtering
- LLM integration with context augmentation

### **✅ Real-time Systems**
- WebSocket connections for messaging
- Live location updates
- Real-time friend status tracking

### **✅ Mobile Development**
- Cross-platform React Native
- Native camera and media APIs
- Cloud storage integration
- Push notifications ready

### **✅ Production Architecture**
- Scalable database design
- Secure authentication flows
- Error handling and monitoring
- Comprehensive documentation

---

## 📚 **Documentation & Guides**

### **Setup & Testing**
- [INSTRUCTOR_QUICK_START.md](INSTRUCTOR_QUICK_START.md) - 5-minute setup
- [TESTFLIGHT_DISTRIBUTION_GUIDE.md](TESTFLIGHT_DISTRIBUTION_GUIDE.md) - iPhone testing
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Comprehensive testing

### **Features & Implementation**
- [features/rag/IMPLEMENTATION_PLAN.md](features/rag/IMPLEMENTATION_PLAN.md) - RAG architecture
- [VIDEO_CAPTURE_IMPLEMENTATION_GUIDE.md](VIDEO_CAPTURE_IMPLEMENTATION_GUIDE.md) - Video features
- [CAMERA_SETUP_GUIDE.md](CAMERA_SETUP_GUIDE.md) - Camera implementation

### **Database & Infrastructure**
- [COMPLETE_DATABASE_SETUP.sql](COMPLETE_DATABASE_SETUP.sql) - Full database schema
- [STORAGE_SETUP_GUIDE.md](STORAGE_SETUP_GUIDE.md) - File storage configuration
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Production deployment

---

## 🎬 **Live Demo Available**

**TestFlight**: Email `j.wylie.81@gmail.com` for immediate access  
**Local Demo**: Use [INSTRUCTOR_QUICK_START.md](INSTRUCTOR_QUICK_START.md)  
**Demo Accounts**: `demo1@tribefind.com` / `demo123456`

---

**Built with ❤️ using incremental AI development**

*TribeFind v1.4.0 - AI-powered social discovery with local knowledge* 🌟 