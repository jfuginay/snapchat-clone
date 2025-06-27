import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { supabase } from '../lib/supabase'

export class GoogleSignInService {
  static async configure() {
    try {
      GoogleSignin.configure({
        iosClientId: '928204958033-cupnqdn1nglhhfmj5pe5vl0oql4heg9s.apps.googleusercontent.com',
        webClientId: '928204958033-cupnqdn1nglhhfmj5pe5vl0oql4heg9s.apps.googleusercontent.com', // From Google Cloud Console
        offlineAccess: true,
        hostedDomain: '',
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
      
      if (!userInfo.data?.idToken) {
        throw new Error('No ID token received from Google')
      }

      console.log('✅ Google Sign In successful:', {
        email: userInfo.data.user.email,
        name: userInfo.data.user.name,
        hasIdToken: !!userInfo.data.idToken
      })

      // Sign in to Supabase with Google ID token
      console.log('🔐 Signing in to Supabase with Google token...')
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.data.idToken,
      })

      if (error) {
        console.error('❌ Supabase Google sign in error:', error)
        return { error: error.message }
      }

      if (data.user) {
        console.log('✅ Supabase Google sign in successful')
        return { user: data.user, session: data.session }
      }

      return { error: 'Failed to sign in with Google' }
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