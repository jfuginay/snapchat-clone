import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { Alert } from 'react-native'

// Google Sign-In with development fallback for Expo Go
let GoogleSignin: any = null
let statusCodes: any = null
let isExpoGo = false

try {
  const googleSignInModule = require('@react-native-google-signin/google-signin')
  GoogleSignin = googleSignInModule.GoogleSignin
  statusCodes = googleSignInModule.statusCodes
  console.log('✅ Google Sign-In module loaded successfully')
} catch (error) {
  console.log('📱 Google Sign In not available (Expo Go mode)')
  console.log('    This is normal when running in Expo Go')
  console.log('    Using development fallback for testing...')
  isExpoGo = true
}

export class GoogleSignInService {
  static async configure() {
    try {
      if (isExpoGo) {
        console.log('✅ Google Sign In configured for Expo Go (development mode)')
        console.log('- Using mock Google authentication for testing')
        console.log('- This will create real users in your database')
        return true
      }

      // Check if Google Sign-In is available
      if (!GoogleSignin) {
        console.error('❌ Google Sign-In module not available')
        return false
      }

      // Production Google OAuth client IDs - these work for both dev and prod
      const iosClientId = '928204958033-cupnqdn1nglhhfmj5pe5vl0oql4heg9s.apps.googleusercontent.com'
      const webClientId = '928204958033-cupnqdn1nglhhfmj5pe5vl0oql4heg9s.apps.googleusercontent.com'
      
      // Always configure for development - no environment checks
      await GoogleSignin.configure({
        iosClientId,
        webClientId,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        // Add these for better development support
        scopes: ['openid', 'profile', 'email'],
        hostedDomain: '',
        loginHint: '',
        includeServerAuthCode: false,
      })
      
      console.log('✅ Google Sign In configured successfully for development')
      console.log('- iOS Client ID:', iosClientId ? 'Present' : 'Missing')
      console.log('- Web Client ID:', webClientId ? 'Present' : 'Missing')
      console.log('- Environment: Development (always enabled)')
      return true
    } catch (error) {
      console.error('❌ Google Sign In configuration error:', error)
      return false
    }
  }

  static async signIn() {
    try {
      if (isExpoGo) {
        console.log('🔐 Starting Google Sign In (Expo Go development mode)...')
        
        // Show development alert
        return new Promise((resolve) => {
          Alert.alert(
            'Google Sign-In (Development)',
            'Choose a test Google account for development:',
            [
              {
                text: 'Test User 1',
                onPress: () => {
                  console.log('✅ Development Google Sign In - Test User 1 selected')
                  resolve({
                    user: {
                      email: 'testuser1@gmail.com',
                      name: 'Test User One',
                      photo: 'https://via.placeholder.com/150/0066cc/FFFFFF?text=T1',
                      id: 'google_test_user_1'
                    },
                    idToken: 'dev_token_123'
                  })
                }
              },
              {
                text: 'Test User 2', 
                onPress: () => {
                  console.log('✅ Development Google Sign In - Test User 2 selected')
                  resolve({
                    user: {
                      email: 'testuser2@gmail.com',
                      name: 'Test User Two',
                      photo: 'https://via.placeholder.com/150/ff6600/FFFFFF?text=T2',
                      id: 'google_test_user_2'
                    },
                    idToken: 'dev_token_456'
                  })
                }
              },
              {
                text: 'Your Email',
                onPress: () => {
                  console.log('✅ Development Google Sign In - Real user selected')
                  resolve({
                    user: {
                      email: 'j.wylie.81@gmail.com',
                      name: 'Grant Wylie',
                      photo: 'https://via.placeholder.com/150/9900cc/FFFFFF?text=GW',
                      id: 'google_real_user'
                    },
                    idToken: 'dev_token_real'
                  })
                }
              },
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  console.log('⚠️ Development Google Sign In cancelled')
                  resolve({ error: 'Google Sign-In was cancelled' })
                }
              }
            ]
          )
        })
      }

      // Real Google Sign-In for production builds
      if (!GoogleSignin || !statusCodes) {
        console.error('❌ Google Sign-In not available')
        return { error: 'Google Sign-In is not available. Please make sure the app is properly configured.' }
      }

      console.log('🔍 Checking Google Play Services availability...')
      
      // Check Google Play Services (Android) or continue on iOS
      try {
        await GoogleSignin.hasPlayServices()
        console.log('✅ Google Play Services available')
      } catch (playServicesError: any) {
        console.log('⚠️ Google Play Services check:', playServicesError)
        // On iOS this might fail, but we can continue
        if (Platform.OS === 'android' && playServicesError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          return { error: 'Google Play Services not available. Please update Google Play Services and try again.' }
        }
        console.log('📱 Continuing (iOS device or Play Services available)')
      }
      
      console.log('🚀 Starting Google Sign In...')
      const userInfo = await GoogleSignin.signIn()
      
      console.log('✅ Google Sign In successful:', {
        email: userInfo.data?.user?.email,
        name: userInfo.data?.user?.name,
        photo: userInfo.data?.user?.photo,
        hasIdToken: !!userInfo.data?.idToken
      })

      // Return real Google user info for processing
      return { 
        googleUser: userInfo.data,
        user: userInfo.data?.user,
        idToken: userInfo.data?.idToken
      }
    } catch (error: any) {
      console.error('❌ Google Sign In error:', error)
      
      if (isExpoGo) {
        return { error: 'Development Google Sign-In failed. Please try again.' }
      }
      
      if (!statusCodes) {
        return { error: 'Google Sign-In encountered an error. Please try again or use email/password authentication.' }
      }
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { error: 'Google Sign-In was cancelled. Please try again.' }
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return { error: 'Google Sign-In is already in progress. Please wait.' }
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { error: 'Google Play Services not available. Please update Google Play Services.' }
      } else {
        console.error('❌ Unexpected Google Sign In error:', {
          code: error.code,
          message: error.message,
          domain: error.domain
        })
        return { error: error.message || 'Google Sign-In failed. Please try again.' }
      }
    }
  }

  static async signOut() {
    try {
      if (isExpoGo) {
        console.log('✅ Google Sign Out (development mode)')
        return true
      }

      if (!GoogleSignin) {
        console.log('⚠️ Google Sign-In not available for sign out')
        return true
      }

      await GoogleSignin.signOut()
      console.log('✅ Google Sign Out successful')
      return true
    } catch (error) {
      console.error('❌ Google Sign Out error:', error)
      return false
    }
  }

  static async getCurrentUser() {
    try {
      if (isExpoGo) {
        return null
      }

      if (!GoogleSignin) {
        return null
      }

      const userInfo = await GoogleSignin.getCurrentUser()
      return userInfo
    } catch (error) {
      console.error('❌ Get current Google user error:', error)
      return null
    }
  }

  static async isSignedIn() {
    try {
      if (isExpoGo) {
        return false
      }

      if (!GoogleSignin) {
        return false
      }

      const isSignedIn = await GoogleSignin.getCurrentUser()
      return !!isSignedIn
    } catch (error) {
      console.error('❌ Check Google sign in status error:', error)
      return false
    }
  }

  // Check if Google Sign-In is available in the current environment
  static isAvailable() {
    return !!GoogleSignin || isExpoGo
  }
}
