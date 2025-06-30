import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { Alert } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'

export class AppleSignInService {
  static async isAvailable(): Promise<boolean> {
    try {
      // Apple Sign In is only available on iOS 13+ and macOS 10.15+
      if (Platform.OS !== 'ios') {
        console.log('📱 Apple Sign In not available (Android device)')
        return false
      }

      const isAvailable = await AppleAuthentication.isAvailableAsync()
      console.log('🍎 Apple Sign In availability:', isAvailable)
      return isAvailable
    } catch (error) {
      console.error('❌ Error checking Apple Sign In availability:', error)
      return false
    }
  }

  static async signIn() {
    try {
      console.log('🍎 Starting Apple Sign In process...')

      // Check if Apple Sign In is available
      const available = await this.isAvailable()
      if (!available) {
        return { error: 'Apple Sign In is not available on this device. Please use iOS 13+ or macOS 10.15+.' }
      }

      console.log('🚀 Requesting Apple credentials...')
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      console.log('✅ Apple Sign In successful:', {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        hasIdentityToken: !!credential.identityToken,
        hasAuthorizationCode: !!credential.authorizationCode
      })

      // Extract user information
      const userInfo = {
        id: credential.user,
        email: credential.email,
        name: credential.fullName ? 
          `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() :
          credential.email?.split('@')[0] || 'Apple User',
        photo: undefined, // Apple doesn't provide profile photos
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode
      }

      // Handle cases where email might be hidden
      if (!userInfo.email) {
        console.log('⚠️ Apple Sign In completed but email is hidden by user')
        // Apple might not provide email on subsequent sign-ins if user chose to hide it
        // We'll need to handle this case in the auth service
      }

      return { 
        user: userInfo,
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode
      }
    } catch (error: any) {
      console.error('❌ Apple Sign In error:', error)
      
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return { error: 'Apple Sign In was cancelled. Please try again.' }
      } else if (error.code === 'ERR_INVALID_RESPONSE') {
        return { error: 'Invalid response from Apple. Please try again.' }
      } else if (error.code === 'ERR_REQUEST_FAILED') {
        return { error: 'Apple Sign In request failed. Please check your internet connection and try again.' }
      } else if (error.code === 'ERR_REQUEST_NOT_HANDLED') {
        return { error: 'Apple Sign In is not properly configured. Please contact support.' }
      } else if (error.code === 'ERR_REQUEST_NOT_INTERACTIVE') {
        return { error: 'Apple Sign In requires user interaction. Please try again.' }
      } else {
        console.error('❌ Unexpected Apple Sign In error:', {
          code: error.code,
          message: error.message,
          domain: error.domain
        })
        return { error: error.message || 'Apple Sign In failed. Please try again.' }
      }
    }
  }

  static async signOut() {
    try {
      console.log('🍎 Apple Sign Out (Note: Apple doesn\'t provide a sign out method)')
      // Apple doesn't provide a sign out method like Google
      // The user needs to revoke access from their Apple ID settings
      // We just need to clear our local session
      return true
    } catch (error) {
      console.error('❌ Apple Sign Out error:', error)
      return false
    }
  }

  static async getCredentialState(userID: string) {
    try {
      if (Platform.OS !== 'ios') {
        return AppleAuthentication.AppleAuthenticationCredentialState.NOT_FOUND
      }

      const credentialState = await AppleAuthentication.getCredentialStateAsync(userID)
      console.log('🍎 Apple credential state for user', userID, ':', credentialState)
      return credentialState
    } catch (error) {
      console.error('❌ Error getting Apple credential state:', error)
      return AppleAuthentication.AppleAuthenticationCredentialState.NOT_FOUND
    }
  }

  static async validateCredential(userID: string): Promise<boolean> {
    try {
      const state = await this.getCredentialState(userID)
      return state === AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED
    } catch (error) {
      console.error('❌ Error validating Apple credential:', error)
      return false
    }
  }
}