import { supabase } from '../lib/supabase'
import * as WebBrowser from 'expo-web-browser'
import * as Crypto from 'expo-crypto'
import * as Linking from 'expo-linking'

export interface TwitterUser {
  id: string
  name: string
  username: string
  email?: string
  profile_image_url?: string
  verified?: boolean
  public_metrics?: {
    followers_count: number
    following_count: number
    tweet_count: number
  }
}

export interface TwitterSignInResult {
  success: boolean
  user?: TwitterUser
  accessToken?: string
  error?: string
}

export class TwitterSignInService {
  private static clientId: string | null = null
  private static redirectUri = 'tribefind://auth/twitter'

  static configure(clientId: string) {
    try {
      this.clientId = clientId
      console.log('✅ Twitter Sign In configured successfully')
      return true
    } catch (error) {
      console.error('❌ Twitter Sign In configuration error:', error)
      return false
    }
  }

  static async isConfigured(): Promise<boolean> {
    return !!this.clientId
  }

  private static async generateCodeChallenge(): Promise<{ codeChallenge: string; codeVerifier: string }> {
    // Generate a random code verifier (43-128 characters) using Expo Crypto
    // Create a random string for PKCE code verifier
    const codeVerifier = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Math.random().toString(36) + Date.now().toString(36),
      { encoding: Crypto.CryptoEncoding.BASE64 }
    )
    .then(hash => hash
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substring(0, 43) // PKCE code verifier should be 43-128 characters
    )
    
    // Create SHA256 hash of the code verifier
    const codeChallenge = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    )
    
    // Convert to base64url format
    const base64UrlChallenge = codeChallenge
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    
    return {
      codeVerifier,
      codeChallenge: base64UrlChallenge
    }
  }

  static async signIn(): Promise<TwitterSignInResult> {
    try {
      console.log('🐦 Starting native Twitter Sign In with PKCE...')

      if (!this.clientId) {
        return {
          success: false,
          error: 'Twitter Sign In is not configured. Please check your Client ID.'
        }
      }

      // Generate PKCE challenge for secure mobile OAuth
      const { codeVerifier, codeChallenge } = await this.generateCodeChallenge()
      
      // Generate state parameter for security
      const state = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(36) + Date.now().toString(36),
        { encoding: Crypto.CryptoEncoding.BASE64 }
      )
      .then(hash => hash
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .substring(0, 16) // State should be reasonably short
      )

      // Build Twitter OAuth 2.0 authorization URL
      const authUrl = `https://twitter.com/i/oauth2/authorize?${new URLSearchParams({
        response_type: 'code',
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        scope: 'tweet.read users.read offline.access',
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      }).toString()}`

      console.log('🔗 Opening Twitter OAuth with PKCE...')

      // Open Twitter OAuth in secure in-app browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        this.redirectUri,
        {
          showTitle: true,
          toolbarColor: '#1DA1F2', // Twitter blue
          secondaryToolbarColor: '#ffffff',
          enableBarCollapsing: true,
          showInRecents: false
        }
      )

      if (result.type === 'success' && result.url) {
        console.log('✅ Twitter OAuth completed, processing callback...')
        
        // Extract authorization code from callback URL
        const url = new URL(result.url)
        const code = url.searchParams.get('code')
        const returnedState = url.searchParams.get('state')

        if (!code) {
          return {
            success: false,
            error: 'Authorization code not received from Twitter'
          }
        }

        if (returnedState !== state) {
          return {
            success: false,
            error: 'Invalid state parameter - possible security issue'
          }
        }

        // Exchange authorization code for access token
        const tokenResponse = await this.exchangeCodeForToken(code, codeVerifier)
        if (!tokenResponse.success) {
          return tokenResponse
        }

        // Get user info from Twitter API
        const userResponse = await this.getUserInfo(tokenResponse.accessToken!)
        if (!userResponse.success) {
          return userResponse
        }

        console.log('✅ Twitter Sign In completed successfully')
        return {
          success: true,
          user: userResponse.user,
          accessToken: tokenResponse.accessToken
        }

      } else if (result.type === 'cancel') {
        return {
          success: false,
          error: 'User cancelled Twitter authentication'
        }
      } else {
        return {
          success: false,
          error: 'Twitter authentication was interrupted'
        }
      }

    } catch (error) {
      console.error('❌ Twitter Sign In error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred during Twitter Sign In'
      }
    }
  }

  private static async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TwitterSignInResult> {
    try {
      console.log('🔄 Exchanging authorization code for access token...')

      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.clientId}:`)}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
          code_verifier: codeVerifier,
          client_id: this.clientId!
        }).toString()
      })

      const tokenData = await tokenResponse.json()

      if (!tokenResponse.ok) {
        console.error('❌ Token exchange failed:', tokenData)
        return {
          success: false,
          error: `Token exchange failed: ${tokenData.error_description || tokenData.error}`
        }
      }

      return {
        success: true,
        accessToken: tokenData.access_token
      }

    } catch (error) {
      console.error('❌ Token exchange error:', error)
      return {
        success: false,
        error: 'Failed to exchange authorization code for access token'
      }
    }
  }

  private static async getUserInfo(accessToken: string): Promise<TwitterSignInResult> {
    try {
      console.log('👤 Fetching user info from Twitter API...')

      const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url,verified,public_metrics', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const userData = await userResponse.json()

      if (!userResponse.ok) {
        console.error('❌ User info fetch failed:', userData)
        return {
          success: false,
          error: `Failed to get user info: ${userData.error || 'Unknown error'}`
        }
      }

      const user: TwitterUser = {
        id: userData.data.id,
        name: userData.data.name,
        username: userData.data.username,
        profile_image_url: userData.data.profile_image_url,
        verified: userData.data.verified,
        public_metrics: userData.data.public_metrics
      }

      return {
        success: true,
        user: user
      }

    } catch (error) {
      console.error('❌ User info fetch error:', error)
      return {
        success: false,
        error: 'Failed to fetch user information from Twitter'
      }
    }
  }

  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚪 Signing out of Twitter...')
      
      // Clear any stored Twitter tokens/session data
      // This would be implemented with the actual Twitter SDK
      
      return { success: true }
    } catch (error) {
      console.error('❌ Twitter Sign Out error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred during Twitter Sign Out'
      }
    }
  }

  static async getCurrentUser(): Promise<TwitterUser | null> {
    try {
      // This would check for current Twitter session
      // and return user info if available
      return null
    } catch (error) {
      console.error('❌ Error getting current Twitter user:', error)
      return null
    }
  }

  static async hasPlayServices(): Promise<boolean> {
    // Twitter doesn't require Google Play Services
    return true
  }
} 