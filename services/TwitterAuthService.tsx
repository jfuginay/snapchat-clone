import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Twitter OAuth 2.0 Configuration
const TWITTER_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_TWITTER_CLIENT_ID || '',
  clientSecret: process.env.EXPO_PUBLIC_TWITTER_CLIENT_SECRET || '',
  redirectUri: AuthSession.makeRedirectUri({
    scheme: 'tribefind',
    path: 'auth/twitter',
  }),
  scopes: ['tweet.read', 'users.read', 'offline.access'],
  additionalParameters: {},
  customParameters: {
    code_challenge_method: 'S256',
  },
};

// Twitter API endpoints
const TWITTER_ENDPOINTS = {
  authorization: 'https://twitter.com/i/oauth2/authorize',
  token: 'https://api.twitter.com/2/oauth2/token',
  userInfo: 'https://api.twitter.com/2/users/me',
  userFields: 'id,name,username,profile_image_url,description,public_metrics,verified',
};

export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  description?: string;
  verified?: boolean;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
}

export interface TwitterAuthResult {
  success: boolean;
  user?: TwitterUser;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

class TwitterAuthService {
  private codeVerifier: string = '';

  /**
   * Generate PKCE code verifier and challenge for OAuth 2.0
   */
  private async generatePKCE() {
    // Generate random string for code verifier
    const codeVerifier = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15) +
                        Math.random().toString(36).substring(2, 15);
    
    const codeChallenge = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    
    this.codeVerifier = codeVerifier;
    return { codeVerifier, codeChallenge };
  }

  /**
   * Start Twitter OAuth flow
   */
  async signInWithTwitter(): Promise<TwitterAuthResult> {
    try {
      console.log('🐦 Starting Twitter OAuth flow...');

      // Check if Twitter credentials are configured
      if (!TWITTER_CONFIG.clientId) {
        return {
          success: false,
          error: 'Twitter OAuth not configured. Please add EXPO_PUBLIC_TWITTER_CLIENT_ID to your environment variables.',
        };
      }

      // Generate PKCE parameters
      const { codeVerifier, codeChallenge } = await this.generatePKCE();

      // Configure the auth request
      const request = new AuthSession.AuthRequest({
        clientId: TWITTER_CONFIG.clientId,
        scopes: TWITTER_CONFIG.scopes,
        redirectUri: TWITTER_CONFIG.redirectUri,
        responseType: AuthSession.ResponseType.Code,
        state: Math.random().toString(36).substring(2, 15),
        codeChallenge,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      });

      console.log('🔗 Redirect URI:', TWITTER_CONFIG.redirectUri);
      console.log('🔑 Client ID:', TWITTER_CONFIG.clientId.substring(0, 8) + '...');

      // Start the OAuth flow
      const result = await request.promptAsync({
        authorizationEndpoint: TWITTER_ENDPOINTS.authorization,
      });

      console.log('📱 OAuth result:', result.type);

      if (result.type === 'success') {
        // Exchange authorization code for access token
        const tokenResult = await this.exchangeCodeForToken(result.params.code, codeVerifier);
        
        if (tokenResult.success && tokenResult.accessToken) {
          // Get user information
          const userInfo = await this.getUserInfo(tokenResult.accessToken);
          
          if (userInfo) {
            return {
              success: true,
              user: userInfo,
              accessToken: tokenResult.accessToken,
              refreshToken: tokenResult.refreshToken,
            };
          } else {
            return {
              success: false,
              error: 'Failed to retrieve user information from Twitter.',
            };
          }
        } else {
          return {
            success: false,
            error: tokenResult.error || 'Failed to exchange authorization code for token.',
          };
        }
      } else if (result.type === 'cancel') {
        return {
          success: false,
          error: 'Twitter authentication was cancelled by user.',
        };
      } else {
        return {
          success: false,
          error: 'Twitter authentication failed.',
        };
      }
    } catch (error) {
      console.error('Twitter auth error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Twitter authentication error',
      };
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(TWITTER_ENDPOINTS.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${TWITTER_CONFIG.clientId}:${TWITTER_CONFIG.clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: TWITTER_CONFIG.redirectUri,
          code_verifier: codeVerifier,
        }).toString(),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        console.log('✅ Successfully exchanged code for token');
        return {
          success: true,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        };
      } else {
        console.error('Token exchange failed:', data);
        return {
          success: false,
          error: data.error_description || data.error || 'Token exchange failed',
        };
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed',
      };
    }
  }

  /**
   * Get user information from Twitter API
   */
  private async getUserInfo(accessToken: string): Promise<TwitterUser | null> {
    try {
      const response = await fetch(
        `${TWITTER_ENDPOINTS.userInfo}?user.fields=${TWITTER_ENDPOINTS.userFields}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'TribeFindApp/1.0',
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.data) {
        const user = data.data;
        console.log('✅ Retrieved Twitter user info:', user.username);
        
        return {
          id: user.id,
          name: user.name,
          username: user.username,
          profile_image_url: user.profile_image_url,
          description: user.description,
          verified: user.verified,
          public_metrics: user.public_metrics,
        };
      } else {
        console.error('Failed to get user info:', data);
        return null;
      }
    } catch (error) {
      console.error('User info error:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    success: boolean;
    accessToken?: string;
    newRefreshToken?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(TWITTER_ENDPOINTS.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${TWITTER_CONFIG.clientId}:${TWITTER_CONFIG.clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }).toString(),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        return {
          success: true,
          accessToken: data.access_token,
          newRefreshToken: data.refresh_token || refreshToken,
        };
      } else {
        return {
          success: false,
          error: data.error_description || data.error || 'Token refresh failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  }

  /**
   * Transform Twitter user data to TribeFind user format
   */
  transformTwitterUserToTribeUser(twitterUser: TwitterUser): Partial<any> {
    // Extract username from Twitter handle (remove @ if present)
    const username = twitterUser.username.replace('@', '').toLowerCase();
    
    // Create display name from Twitter name
    const displayName = twitterUser.name || twitterUser.username;
    
    // Use high quality profile image
    const avatar = this.getHighQualityProfileImage(twitterUser.profile_image_url);
    
    // Create bio from Twitter description
    const bio = twitterUser.description || `Twitter user @${twitterUser.username}`;

    return {
      username: `tw_${username}`, // Prefix to avoid conflicts
      display_name: displayName,
      avatar: avatar,
      bio: bio,
      social_accounts: {
        twitter: {
          id: twitterUser.id,
          username: twitterUser.username,
          verified: twitterUser.verified,
          followers: twitterUser.public_metrics?.followers_count || 0,
          following: twitterUser.public_metrics?.following_count || 0,
        },
      },
      auth_provider: 'twitter',
      profile_complete: true, // Twitter provides enough info for complete profile
    };
  }

  /**
   * Get high quality Twitter profile image
   */
  private getHighQualityProfileImage(profileImageUrl?: string): string {
    if (!profileImageUrl) {
      return '🐦'; // Twitter bird emoji as fallback
    }

    // Replace _normal with _400x400 for higher quality
    return profileImageUrl.replace('_normal.', '_400x400.');
  }

  /**
   * Validate Twitter OAuth configuration
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!TWITTER_CONFIG.clientId) {
      errors.push('EXPO_PUBLIC_TWITTER_CLIENT_ID is required');
    }

    if (!TWITTER_CONFIG.clientSecret) {
      errors.push('EXPO_PUBLIC_TWITTER_CLIENT_SECRET is required');
    }

    // Validate redirect URI format
    if (!TWITTER_CONFIG.redirectUri.includes('://')) {
      errors.push('Invalid redirect URI format');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get OAuth configuration info for debugging
   */
  getConfigInfo() {
    return {
      clientId: TWITTER_CONFIG.clientId ? `${TWITTER_CONFIG.clientId.substring(0, 8)}...` : 'Not set',
      redirectUri: TWITTER_CONFIG.redirectUri,
      scopes: TWITTER_CONFIG.scopes,
      endpoints: TWITTER_ENDPOINTS,
    };
  }
}

// Export singleton instance
export const twitterAuthService = new TwitterAuthService();
export default twitterAuthService; 