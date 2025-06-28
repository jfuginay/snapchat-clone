import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'

// Google Sign-In with proper fallback handling
let GoogleSignin: any = null
let statusCodes: any = null

try {
  const googleSignInModule = require('@react-native-google-signin/google-signin')
  GoogleSignin = googleSignInModule.GoogleSignin
  statusCodes = googleSignInModule.statusCodes
  console.log('✅ Google Sign-In module loaded successfully')
} catch (error) {
  console.log('⚠️ Google Sign-In module not available - this is expected in Expo Go')
  console.log('   Google Sign-In will work in development builds and production')
}

export class GoogleSignInService {
  static async configure() {
    try {
      // Check if Google Sign-In is available
      if (!GoogleSignin) {
        console.log('⚠️ Google Sign-In not available in current environment')
        console.log('   Available in: Development builds, TestFlight, Production')
        console.log('   Demo mode available for testing in Expo Go')
        return true // Return true to enable demo mode
      }

      // Production Google OAuth client IDs
      const iosClientId = '928204958033-cupnqdn1nglhhfmj5pe5vl0oql4heg9s.apps.googleusercontent.com'
      const webClientId = '928204958033-cupnqdn1nglhhfmj5pe5vl0oql4heg9s.apps.googleusercontent.com'
      
      await GoogleSignin.configure({
        iosClientId,
        webClientId,
        offlineAccess: true,
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
        console.log('🎭 Google Sign-In not available - using demo mode for Expo Go')
        
        // Create a realistic demo user for testing
        const demoUser = {
          email: `demo.google.${Date.now()}@tribefind.com`,
          name: 'Google Demo User',
          photo: 'https://via.placeholder.com/150/4285F4/FFFFFF?text=G',
          id: 'google_demo_' + Date.now()
        }
        
        console.log('✅ Demo Google Sign-In successful:', demoUser)
        
        return { 
          googleUser: { user: demoUser },
          user: demoUser,
          idToken: 'demo_id_token_' + Date.now()
        }
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
    // Always return true since we have demo mode for Expo Go
    return true
  }
} 