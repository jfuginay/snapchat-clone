# Twitter OAuth Setup Guide for TribeFind

This guide will help you set up Twitter OAuth authentication for your TribeFind app.

## Prerequisites

- Twitter Developer Account
- Access to Twitter Developer Portal (developer.twitter.com)
- Expo CLI installed
- TribeFind app project

## Step 1: Twitter Developer Portal Setup

### 1.1 Create a Twitter Developer Account
1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Sign in with your Twitter account
3. Apply for a developer account if you haven't already
4. Complete the application process

### 1.2 Create a New App
1. In the Developer Portal, click "Create App"
2. Fill in the app details:
   - **App Name**: `TribeFind` (or your preferred name)
   - **Description**: "Social activity discovery app that connects people with shared interests"
   - **Website URL**: `https://tribefind.app` (or your domain)

### 1.3 Configure OAuth Settings
1. Go to your app settings → "Authentication settings"
2. Enable "OAuth 2.0" 
3. Set **Callback URI**: `tribefind://auth/twitter`
4. Set permissions to "Read" (minimum required)

### 1.4 Get Your API Keys
Copy these from "Keys and Tokens" tab:
- **Client ID** (OAuth 2.0 Client ID)
- **Client Secret** (OAuth 2.0 Client Secret)

## Step 2: Environment Configuration

Add to your `.env` file:
```env
# Twitter OAuth Configuration
EXPO_PUBLIC_TWITTER_CLIENT_ID=your-twitter-client-id
EXPO_PUBLIC_TWITTER_CLIENT_SECRET=your-twitter-client-secret
```

## Step 3: Testing

1. Start Expo: `npx expo start --clear`
2. Test Twitter sign-in flow
3. Verify user creation in database

## Troubleshooting

- **"Twitter OAuth not configured"**: Check environment variables
- **"Redirect URI Mismatch"**: Verify `tribefind://auth/twitter` in Twitter portal
- **Deep linking issues**: Confirm `scheme: "tribefind"` in app.json

## Security Notes

- Never commit `.env` file
- Keep Client Secret secure
- Use different apps for dev/production
- Implement proper session management

---

✅ **Twitter authentication is now ready!** Users can sign in with their Twitter accounts and their profile data will be automatically imported into TribeFind. 