import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'

// Conditional import for Google Sign-In (with fallback for Expo Go)
let GoogleSignin: any = null
let statusCodes: any = null

try {
  const googleSignInModule = require('@react-native-google-signin/google-signin')
  GoogleSignin = googleSignInModule.GoogleSignin
  statusCodes = googleSignInModule.statusCodes
  console.log('✅ Google Sign-In module loaded (development build)')
} catch (error) {
  console.log('⚠️ Google Sign-In module not available (Expo Go mode)')
  console.log('   Enabling fallback mode for development testing')
  
  // Create mock Google Sign-In for Expo Go development
  GoogleSignin = {
    configure: () => Promise.resolve(),
    hasPlayServices: () => Promise.resolve(),
    signIn: () => Promise.resolve({
      data: {
        user: {
          email: 'demo.google@tribefind.com',
          name: 'Google Demo User',
          photo: 'https://via.placeholder.com/150/4285F4/FFFFFF?text=G',
          id: 'google_demo_' + Date.now()
        },
        idToken: 'mock_google_id_token_' + Date.now()
      }
    }),
    signOut: () => Promise.resolve(),
    getCurrentUser: () => Promise.resolve(null),
    isSignedIn: () => Promise.resolve(false)
  }
  
  statusCodes = {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE'
  }
  
  console.log('✅ Google Sign-In fallback mode enabled for Expo Go')
}

export class GoogleSignInService {
  static async configure() {
    try {
      // Check if Google Sign-In is available
      if (!GoogleSignin) {
        console.log('⚠️ Google Sign-In not available')
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
          error: 'Google Sign-In is not available. Please try again or use email/password authentication.' 
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
          console.log('📱 Continuing (likely iOS device or Expo Go fallback)')
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
        return { error: 'Google Sign-In encountered an error. Please try again.' }
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
    // Always return true now since we have fallback mode
    return !!GoogleSignin && !!statusCodes
  }
} 