# ✅ Supabase Twitter OAuth Setup Guide 🐦

This is the **complete guide** for setting up Twitter OAuth with Supabase and proper deep linking for TribeFind.

## 🎯 **Overview**

Your app uses **Supabase's built-in Twitter OAuth provider**. This is simpler and more reliable than custom OAuth implementations.

## 📋 **Step-by-Step Setup**

### **Step 1: Twitter Developer Portal Setup**

1. **Create Twitter Developer Account**
   - Go to [developer.twitter.com](https://developer.twitter.com)
   - Apply for developer access if needed

2. **Create Twitter App**
   - App Name: `TribeFind` (or your choice)
   - Description: "Social discovery app connecting people through shared interests"
   - Website: Your app website or GitHub URL

3. **Configure OAuth 2.0 Settings**
   - Enable **OAuth 2.0**
   - Set **Type of App**: Web App, Automated App, or Bot
   - **Callback URLs**: Add this **exact URL**:
     ```
     https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference

4. **Get Credentials**
   - Copy **Client ID** (OAuth 2.0 Client ID)
   - Copy **Client Secret** (OAuth 2.0 Client Secret)

### **Step 2: Supabase Configuration**

1. **Open Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to **Authentication** → **Providers**

2. **Enable Twitter Provider**
   - Find **Twitter** in the providers list
   - Toggle it **ON** (enabled)

3. **Add Twitter Credentials**
   - **Client ID**: Paste your Twitter OAuth 2.0 Client ID
   - **Client Secret**: Paste your Twitter OAuth 2.0 Client Secret
   - Click **Save**

4. **Configure Redirect URLs**
   - Go to **Authentication** → **URL Configuration**
   - **Site URL**: Set to `tribefind://`
   - **Redirect URLs**: Add these URLs (one per line):
     ```
     tribefind://auth/callback
     tribefind://
     ```

### **Step 3: App Configuration Verification**

1. **Check app.json**
   ```json
   {
     "expo": {
       "scheme": "tribefind"
     }
   }
   ```

2. **Check Environment Variables**
   - Your `.env` should only have Supabase credentials:
     ```
     EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```
   - **Do NOT add Twitter credentials** to `.env`

3. **Restart Development Server**
   ```bash
   npx expo start --clear
   ```

## 🔄 **How It Works**

1. User taps "Continue with Twitter"
2. App opens Twitter OAuth page in browser
3. User authorizes your app on Twitter
4. Twitter redirects to Supabase callback URL
5. Supabase processes OAuth and creates user session
6. Supabase redirects to your app: `tribefind://auth/callback`
7. Your app's deep link handler completes login

## 🧪 **Testing**

1. **Test Twitter Provider**
   - Open your app
   - Tap "Continue with Twitter"
   - Should open Twitter OAuth page

2. **Complete OAuth Flow**
   - Authorize the app on Twitter
   - Should redirect back to your app
   - User should be logged in

3. **Check User Data**
   - New user should be created in Supabase `auth.users`
   - Profile should be created in your `users` table
   - Twitter data should be in `user_metadata`

## 🚨 **Troubleshooting**

### **"Provider not found" Error**
- ✅ Enable Twitter provider in Supabase Dashboard
- ✅ Add Client ID and Client Secret
- ✅ Save the provider configuration

### **"Invalid redirect URI" Error**
- ✅ Check callback URL in Twitter app matches Supabase format
- ✅ Verify redirect URLs in Supabase URL Configuration

### **App doesn't receive callback**
- ✅ Verify `scheme: "tribefind"` in app.json
- ✅ Test on physical device (deep linking doesn't work in simulator)
- ✅ Check that `tribefind://auth/callback` is in Supabase redirect URLs

### **OAuth hangs or fails**
- ✅ Clear Expo cache: `npx expo start --clear`
- ✅ Check Supabase logs for error details
- ✅ Verify Twitter app has correct permissions

## 📱 **Deep Linking Details**

### **URL Scheme**
- **Scheme**: `tribefind://`
- **Callback Path**: `/auth/callback`
- **Full Callback**: `tribefind://auth/callback`

### **Deep Link Handler**
The app automatically handles OAuth callbacks via the deep link listener in `AuthService.tsx`:

```typescript
// Handles: tribefind://auth/callback?code=...&state=...
const handleDeepLink = async (event: { url: string }) => {
  if (event.url.includes('/auth/callback')) {
    // Process OAuth callback
    // Extract tokens/code and complete authentication
  }
}
```

## ✅ **Final Checklist**

- [ ] Twitter app created with OAuth 2.0 enabled
- [ ] Supabase callback URL added to Twitter app
- [ ] Twitter provider enabled in Supabase
- [ ] Twitter credentials added to Supabase provider
- [ ] Site URL set to `tribefind://` in Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] App scheme is `tribefind` in app.json
- [ ] No Twitter credentials in .env file
- [ ] Expo server restarted with --clear

## 🎉 **Success!**

Once configured correctly:
- Twitter OAuth will open in the system browser
- Users can authorize your app securely
- Deep linking will bring them back to your app
- User profiles will be created automatically
- Everything works seamlessly! 

---

**The setup is now complete and follows Supabase best practices! 🚀** 