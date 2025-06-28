# 🗺️ Google Places API Setup Guide

## Problem: API Key Authorization Error

You're seeing this error because your Google Places API key is restricted to specific IP addresses, but your current IP `67.5.101.32` is not authorized.

## ✅ Quick Fix (Choose One Option)

### Option 1: Remove IP Restrictions (Easiest for Development)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Click on your Google Places API key
4. Under **Application restrictions**, select **"None"**
5. Click **Save**

### Option 2: Add Your Current IP Address
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**  
3. Click on your Google Places API key
4. Under **Application restrictions**, select **"IP addresses"**
5. Click **"Add an item"**
6. Enter: `67.5.101.32` (your current IP)
7. Click **Save**

### Option 3: Use Website Restrictions (Recommended for Expo)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Click on your Google Places API key  
4. Under **Application restrictions**, select **"HTTP referrers (web sites)"**
5. Add these referrers:
   - `localhost/*`
   - `*.expo.dev/*` 
   - `exp://*/*`
   - `*.ngrok.io/*` (if using ngrok)
6. Click **Save**

## 🔧 Environment Variable Setup

### Step 1: Create/Update Your .env File
```bash
# In your project root, create or update .env
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_actual_api_key_here
```

### Step 2: Restart Your Development Server
```bash
npx expo start --clear
```

## 🎯 Complete API Key Setup Process

### 1. Create API Key (If You Don't Have One)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services > Library**
4. Search for "Places API" and enable it
5. Go to **APIs & Services > Credentials**
6. Click **"Create Credentials" > "API key"**
7. Copy the generated API key

### 2. Secure Your API Key
1. Click on the API key to edit it
2. Under **API restrictions**:
   - Click **"Restrict key"**
   - Select **"Places API"** from the dropdown
3. Under **Application restrictions**:
   - Choose **"HTTP referrers"** for web apps
   - Or **"None"** for development testing
4. Click **Save**

### 3. Add to Your Project
1. Create `.env` file in your project root:
```bash
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyDzTGzOaQGxnPkRyXqtQgdLwzFPKqZvQVY
```

2. Restart your Expo development server:
```bash
npx expo start --clear
```

## 🧪 Test Your Setup

After following the steps above, your RAG notifications should work with real Google Places data instead of mock data.

You'll see logs like:
```
✅ Google Places API key configured
🔍 Finding places for interests: ["Running", "Coffee"]
✅ Found 8 relevant places
```

Instead of:
```
⚠️ Google Places API key not properly configured. Using mock data.
🎭 Using mock places data (API key not configured)
```

## 🚨 Common Issues & Solutions

### Issue: "This IP, site or mobile application is not authorized"
**Solution**: Follow Option 1, 2, or 3 above to fix application restrictions

### Issue: "API key not valid"
**Solution**: Make sure you've enabled the Places API in Google Cloud Console

### Issue: "Quota exceeded"
**Solution**: Check your billing account is set up in Google Cloud Console

### Issue: Still seeing mock data
**Solution**: 
1. Verify your `.env` file has the correct variable name: `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`
2. Restart Expo with `npx expo start --clear`
3. Check the console logs for API key status

## 🎉 Success Indicators

When everything is working correctly, you'll see:
- ✅ Real place names in your RAG notifications
- ✅ Actual ratings and reviews
- ✅ Real addresses and business information
- ✅ "Google Places API key configured" in console logs

## 💡 Pro Tips

1. **For Production**: Always use application restrictions (IP addresses or HTTP referrers)
2. **For Development**: You can temporarily use "None" for application restrictions
3. **Environment Variables**: Use `EXPO_PUBLIC_` prefix for client-side environment variables in Expo
4. **Testing**: The mock data system will automatically activate if there are any API issues

---

**"That's what she said about this perfectly configured API key!"** - Michael Scott 🗺️ 