import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'

// Conditional import for Google Sign-In (only available in development builds)
let GoogleSignin: any = null
let statusCodes: any = null

try {
  const googleSignInModule = require('@react-native-google-signin/google-signin')
  GoogleSignin = googleSignInModule.GoogleSignin
  statusCodes = googleSignInModule.statusCodes
  console.log('✅ Google Sign-In module loaded (development build)')
} catch (error) {
  console.log('⚠️ Google Sign-In module not available (Expo Go mode)')
  console.log('   This is normal when running in Expo Go. Use a development build for Google Sign-In.')
}

export class GoogleSignInService {
  static async configure() {
    try {
      // Check if Google Sign-In is available
      if (!GoogleSignin) {
        console.log('⚠️ Google Sign-In not available in Expo Go')
        console.log('   To use Google Sign-In, create a development build with:')
        console.log('   npx expo run:ios or eas build --profile development')
        return false
      }

      // Hardcoded client IDs for standalone builds (these are safe to include in production)
      const iosClientId = '928204958033-cupnqdn1nglhhfmj5pe5vl0oql4heg9s.apps.googleusercontent.com'
      const webClientId = '928204958033-cupnqdn1nglhhfmj5pe5vl0oql4heg9s.apps.googleusercontent.com'
      
      GoogleSignin.configure({
        iosClientId,
        webClientId, // For backend auth
        offlineAccess: true, // To get refresh token
        forceCodeForRefreshToken: true,
      })
      console.log('✅ Google Sign In configured successfully')
      console.log('- iOS Client ID:', iosClientId ? 'Present' : 'Missing')
      console.log('- Web Client ID:', webClientId ? 'Present' : 'Missing')
      return true
    } catch (error) {
      console.error('❌ Google Sign In configuration error:', error)
      return false
    }
  }

  static async signIn() {
    try {
      // Check if Google Sign-In is available
      if (!GoogleSignin || !statusCodes) {
        return { 
          error: 'Google Sign-In is not available in Expo Go. Please use a development build or the production app to use Google Sign-In.' 
        }
      }

      console.log('🔍 Checking Google Play Services...')
      
      // Check if Google Play Services are available (Android) or if we're on iOS
      try {
        await GoogleSignin.hasPlayServices()
        console.log('✅ Google Play Services available')
      } catch (playServicesError: any) {
        console.log('⚠️ Google Play Services check:', playServicesError)
        // On iOS, this might fail but that's okay
        if (playServicesError.code !== statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          // If it's not a Play Services issue, it might be iOS - continue anyway
          console.log('📱 Continuing (likely iOS device)')
        } else {
          return { error: 'Google Play Services not available. Please update Google Play Services.' }
        }
      }
      
      console.log('🚀 Starting Google Sign In...')
      const userInfo = await GoogleSignin.signIn()
      
      console.log('✅ Google Sign In successful:', {
        email: userInfo.data?.user?.email,
        name: userInfo.data?.user?.name,
        photo: userInfo.data?.user?.photo,
        hasIdToken: !!userInfo.data?.idToken
      })

      // Return the Google user info for manual processing
      return { 
        googleUser: userInfo.data,
        user: userInfo.data?.user,
        idToken: userInfo.data?.idToken
      }
    } catch (error: any) {
      console.error('❌ Google Sign In error:', error)
      
      if (!statusCodes) {
        return { error: 'Google Sign-In is not available in Expo Go.' }
      }
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { error: 'Sign in was cancelled' }
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return { error: 'Sign in is already in progress' }
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { error: 'Google Play Services not available. Please update Google Play Services.' }
      } else {
        console.error('❌ Unexpected Google Sign In error:', {
          code: error.code,
          message: error.message,
          domain: error.domain
        })
        return { error: error.message || 'Google Sign In failed. Please try again.' }
      }
    }
  }

  static async signOut() {
    try {
      if (!GoogleSignin) {
        console.log('⚠️ Google Sign-In not available for sign out')
        return true // Return success since there's nothing to sign out from
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
    return !!GoogleSignin && !!statusCodes
  }
} 