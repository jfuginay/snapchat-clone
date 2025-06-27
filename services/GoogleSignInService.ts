import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { supabase } from '../lib/supabase'

export class GoogleSignInService {
  static async configure() {
    try {
      GoogleSignin.configure({
        iosClientId: '928204958033-cupnqdn1nglhhfmj5pe5vl0oql4heg9s.apps.googleusercontent.com',
        webClientId: '928204958033-cupnqdn1nglhhfmj5pe5vl0oql4heg9s.apps.googleusercontent.com', // For backend auth
        offlineAccess: true, // To get refresh token
        forceCodeForRefreshToken: true,
      })
      console.log('✅ Google Sign In configured successfully')
      return true
    } catch (error) {
      console.error('❌ Google Sign In configuration error:', error)
      return false
    }
  }

  static async signIn() {
    try {
      console.log('🔍 Checking Google Play Services...')
      await GoogleSignin.hasPlayServices()
      
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
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { error: 'Sign in was cancelled' }
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return { error: 'Sign in is already in progress' }
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { error: 'Google Play Services not available' }
      } else {
        return { error: error.message || 'An unexpected error occurred' }
      }
    }
  }

  static async signOut() {
    try {
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
      const userInfo = await GoogleSignin.getCurrentUser()
      return userInfo
    } catch (error) {
      console.error('❌ Get current Google user error:', error)
      return null
    }
  }

  static async isSignedIn() {
    try {
      const isSignedIn = await GoogleSignin.getCurrentUser()
      return !!isSignedIn
    } catch (error) {
      console.error('❌ Check Google sign in status error:', error)
      return false
    }
  }
} 