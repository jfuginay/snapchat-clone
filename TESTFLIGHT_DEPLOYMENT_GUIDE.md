# TestFlight Deployment Guide - Apple Sign In Update

## 🚀 Deploy TribeFind v1.4.2 to TestFlight

### Pre-Deployment Checklist ✅

- ✅ Apple Sign In implemented (`services/AppleSignInService.ts`)
- ✅ AuthService updated with Apple integration
- ✅ AuthScreen UI updated with Apple Sign In button
- ✅ app.json configured with `expo-apple-authentication` plugin
- ✅ Build number incremented to 22
- ✅ Version updated to 1.4.2

### Step 1: Build for TestFlight

Run the following command to create a production iOS build:

```bash
npx eas-cli build --platform ios --profile production
```

**Expected Output:**
- Build will start on EAS servers
- You'll get a build URL to monitor progress
- Build typically takes 10-20 minutes

### Step 2: Monitor Build Progress

1. **Check build status:**
   ```bash
   npx eas-cli build:list --platform ios --limit 5
   ```

2. **Or visit the EAS dashboard:**
   - Go to https://expo.dev/accounts/jfuginay/projects/snapchat-clone/builds
   - Monitor the build progress in real-time

### Step 3: Automatic TestFlight Upload

Once the build completes successfully:

1. **EAS will automatically upload to TestFlight** (if configured)
2. **Check App Store Connect:**
   - Visit https://appstoreconnect.apple.com
   - Go to "My Apps" → "TribeFind" → "TestFlight"
   - Look for build 22 (v1.4.2)

### Step 4: TestFlight Distribution

1. **Add the build to a test group:**
   - In App Store Connect → TestFlight
   - Select build 22
   - Add to "Internal Testing" or your preferred test group

2. **Send invitations:**
   - Add your Apple ID email to the test group
   - TestFlight will send you an email invitation

### Step 5: Install on iPhone

1. **Install TestFlight app** (if not already installed)
2. **Accept the invitation** from the email
3. **Download TribeFind v1.4.2** from TestFlight
4. **Test Apple Sign In functionality**

### Step 6: Testing Apple Sign In

Once installed on your iPhone:

1. **Open TribeFind app**
2. **Navigate to sign-in screen**
3. **Look for "Continue with Apple" button** (black button with Apple logo)
4. **Tap the Apple Sign In button**
5. **Verify the following:**
   - Apple's authentication dialog appears
   - Face ID/Touch ID/Passcode authentication works
   - Option to hide/share email is presented
   - Successful sign-in navigates to main app
   - User profile is created correctly

### Troubleshooting

#### If Build Fails:
```bash
# Check build logs
npx eas-cli build:view [BUILD_ID]

# Or check the build URL provided when you started the build
```

#### If Apple Sign In Button Doesn't Appear:
- Ensure you're testing on iOS 13+ device
- Check device settings: Settings → Apple ID → Sign-In & Security

#### If Authentication Fails:
- Check device internet connection
- Ensure Apple ID is properly configured
- Try signing out and back into Apple ID in Settings

### Build Information

- **Version**: 1.4.2
- **Build Number**: 22
- **Platform**: iOS
- **Profile**: Production
- **Distribution**: TestFlight (Internal Testing)

### Expected Build Output

```
✅ Build completed successfully
📱 Build uploaded to TestFlight
🔗 TestFlight URL: [Will be provided after upload]
⏱️ Processing time: ~5-10 minutes in TestFlight
```

### Next Steps After Testing

1. **Verify Apple Sign In works correctly**
2. **Test email privacy features**
3. **Confirm user profile creation**
4. **Document any issues found**
5. **Prepare for App Store submission**

### Commands Reference

```bash
# Start build
npx eas-cli build --platform ios --profile production

# Check build status
npx eas-cli build:list --platform ios --limit 5

# View specific build
npx eas-cli build:view [BUILD_ID]

# Check project status
npx eas-cli project:info
```

---

**Ready for Testing!** Once the build completes and uploads to TestFlight, you'll be able to download and test the Apple Sign In functionality on your iPhone.

### Apple App Store Compliance

This build includes the Apple Sign In implementation that addresses Apple's Guideline 4.8 feedback:

- ✅ **Limited data collection** to name and email only
- ✅ **Email privacy protection** with Hide My Email support  
- ✅ **No advertising data collection** without consent
- ✅ **Equivalent login functionality** to other sign-in methods

The app is now ready for App Store resubmission after TestFlight verification!