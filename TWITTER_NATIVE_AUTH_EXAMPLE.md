# 🐦 Native Twitter Authentication Example

## Quick Start Example

Here's how to use the new native Twitter authentication in your TribeFind app:

### 1. Environment Setup
```bash
# Add to your .env file
EXPO_PUBLIC_TWITTER_CLIENT_ID=your_twitter_client_id_here
```

### 2. Usage in Components

```typescript
// In your AuthScreen or any component
import { useAuth } from '../services/AuthService'

export default function AuthScreen() {
  const { signInWithTwitter } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleTwitterSignIn = async () => {
    setLoading(true)
    try {
      const result = await signInWithTwitter()
      if (result.error) {
        Alert.alert('Twitter Sign In Error', result.error)
      } else {
        // Success! User is now signed in
        console.log('✅ Twitter sign-in successful!')
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <TouchableOpacity
      style={styles.twitterButton}
      onPress={handleTwitterSignIn}
      disabled={loading}
    >
      <Text style={styles.twitterButtonText}>
        {loading ? 'Signing in...' : 'Continue with Twitter'}
      </Text>
    </TouchableOpacity>
  )
}
```

### 3. Direct Service Usage

```typescript
// Direct usage of TwitterSignInService
import { TwitterSignInService } from '../services/TwitterSignInService'

// Configure the service
TwitterSignInService.configure('your_twitter_client_id')

// Sign in
const result = await TwitterSignInService.signIn()
if (result.success && result.user) {
  console.log('Twitter user:', result.user)
  // Handle successful authentication
} else {
  console.error('Twitter sign-in failed:', result.error)
}
```

## What Happens During Sign-In

1. **User taps "Continue with Twitter"**
2. **PKCE challenge generated** for security
3. **In-app browser opens** with Twitter OAuth page
4. **User authorizes** your app on Twitter
5. **App receives authorization code** via deep link
6. **Code exchanged for access token** using PKCE
7. **User data fetched** from Twitter API
8. **User created/updated** in Supabase database
9. **User signed in** to your app

## User Data Structure

```typescript
interface TwitterUser {
  id: string                    // Twitter user ID
  name: string                  // Display name
  username: string              // @username
  email?: string                // Email (if provided)
  profile_image_url?: string    // Avatar URL
  verified?: boolean            // Verified account
  public_metrics?: {
    followers_count: number
    following_count: number
    tweet_count: number
  }
}
```

## Database Integration

The native Twitter authentication automatically:

- ✅ **Creates Supabase auth user** with Twitter data
- ✅ **Creates user profile** in your `users` table
- ✅ **Stores Twitter data** in `social_accounts` JSONB field
- ✅ **Generates unique username** with `tw_` prefix
- ✅ **Handles existing users** by updating their Twitter connection

## Error Handling

Common errors and solutions:

```typescript
const result = await signInWithTwitter()

switch (result.error) {
  case 'Twitter Client ID is not configured':
    // Add EXPO_PUBLIC_TWITTER_CLIENT_ID to .env
    break
    
  case 'Invalid redirect URI':
    // Check Twitter app callback URL is tribefind://auth/twitter
    break
    
  case 'User cancelled Twitter authentication':
    // User closed the browser - normal behavior
    break
    
  case 'Token exchange failed':
    // Check Twitter app OAuth 2.0 settings
    break
}
```

## Testing Checklist

- [ ] Twitter app configured as **Native App** type
- [ ] Callback URL set to `tribefind://auth/twitter`
- [ ] Client ID added to `.env` file
- [ ] Test on physical device (not simulator)
- [ ] Check deep linking works with `tribefind://` scheme

## Differences from Web OAuth

| Native Authentication | Web OAuth (Old) |
|----------------------|------------------|
| ✅ In-app browser | ❌ System browser |
| ✅ PKCE security | ⚠️ Client secret needed |
| ✅ No Supabase config | ❌ Provider setup required |
| ✅ Direct user management | ❌ Complex session handling |
| ✅ Better UX | ❌ App switching |

---

**Your app now has professional native Twitter authentication! 🚀** 