import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { supabase, User, testSupabaseConnection } from '../lib/supabase'
import { useAppDispatch, useAppSelector } from '../store'
import { setAuth, setLoading, clearAuth, updateUser } from '../store/authSlice'
import { Session } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import * as AuthSession from 'expo-auth-session'


interface AuthContextType {
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signInWithTwitter: () => Promise<{ error?: string }>
  signOut: () => Promise<{ error?: string }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  updateProfile: (updates: Partial<User>) => Promise<{ error?: string }>
  refreshUser: () => Promise<void>
  testConnection: () => Promise<boolean>
  debugTwitterProvider: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state: any) => state.auth)

  useEffect(() => {
    // Test connection first
    testSupabaseConnection().then((connected) => {
      if (!connected) {
        console.error('Supabase connection failed during initialization')
        dispatch(clearAuth())
        return
      }

      // Get initial session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error getting session:', error)
          if (error.message.includes('network') || error.message.includes('fetch')) {
            console.error('Network error detected. Check your internet connection and Supabase configuration.')
          }
          dispatch(clearAuth())
        } else {
          handleAuthStateChange(session)
        }
      }).catch((error) => {
        console.error('Session fetch error:', error)
        dispatch(clearAuth())
      })
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in:', {
          id: session.user.id,
          email: session.user.email,
          provider: session.user.app_metadata?.provider,
          user_metadata: session.user.user_metadata
        })
      }
      
      handleAuthStateChange(session)
    })

    // Handle deep links for OAuth callback
    const handleDeepLink = async (event: { url: string }) => {
      console.log('🔗 Deep link received:', event.url)
      
      if (event.url.includes('/auth/callback') || event.url.includes('#access_token=') || event.url.includes('?code=')) {
        console.log('🔐 OAuth callback detected, processing...')
        
        try {
          // Parse the URL to extract tokens/code
          const url = new URL(event.url)
          const fragment = url.hash.substring(1)
          const params = new URLSearchParams(fragment || url.search)
          
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          const code = params.get('code')
          
          console.log('🔑 OAuth tokens found:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            hasCode: !!code
          })
          
          if (accessToken) {
            // If we have access token, set the session directly
            const { data: user, error } = await supabase.auth.getUser(accessToken)
            if (user && !error) {
              console.log('✅ User session established from access token')
              // The auth state change will handle profile creation
            }
          } else if (code) {
            // If we have a code, exchange it for session
            console.log('🔄 Exchanging code for session...')
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (!error) {
              console.log('✅ Session established from code exchange')
            } else {
              console.error('❌ Code exchange failed:', error)
            }
          }
          
          // Always refresh session as fallback
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            console.log('✅ Session found after OAuth callback')
            handleAuthStateChange(session)
          } else {
            console.log('⚠️ No session found after OAuth callback')
          }
        } catch (error) {
          console.error('❌ Error processing OAuth callback:', error)
          // Fallback: just refresh session
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            handleAuthStateChange(session)
          }
        }
      }
    }

    // Set up deep link listener
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink)

    return () => {
      subscription.unsubscribe()
      linkingSubscription?.remove()
    }
  }, [dispatch])

  const handleAuthStateChange = async (session: Session | null) => {
    if (session?.user) {
      try {
        // Fetch or create user profile
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error && error.code === 'PGRST116') {
          // User doesn't exist, could be new signup or existing auth user without profile
          console.log('User profile not found - creating profile for authenticated user')
          
          // Check if this is a Twitter user by looking at the auth metadata
          const isTwitterUser = session.user.app_metadata?.provider === 'twitter'
          const twitterData = session.user.user_metadata
          
          console.log('Auth provider:', session.user.app_metadata?.provider)
          console.log('User metadata:', twitterData)
          
          let profileData
          
          if (isTwitterUser && twitterData) {
            // Create profile using Twitter data
            console.log('🐦 Creating profile for Twitter user:', twitterData.user_name || twitterData.name)
            
            // Generate unique username for Twitter users
            let baseUsername = twitterData.user_name || twitterData.preferred_username || twitterData.name?.toLowerCase().replace(/\s+/g, '_')
            let finalUsername = `tw_${baseUsername}`
            let counter = 1
            
            // Check username availability
            while (true) {
              const { data: existingUsername } = await supabase
                .from('users')
                .select('username')
                .eq('username', finalUsername)
                .single()
              
              if (!existingUsername) break
              finalUsername = `tw_${baseUsername}_${counter}`
              counter++
            }
            
            profileData = {
              id: session.user.id,
              email: session.user.email || `${twitterData.user_name}@twitter.local`,
              username: finalUsername,
              display_name: twitterData.name || twitterData.user_name || 'Twitter User',
              avatar: twitterData.avatar_url || twitterData.picture || '🐦',
              bio: twitterData.description || `Twitter user @${twitterData.user_name}`,
              snap_score: 0,
              last_active: new Date().toISOString(),
              is_online: true,
              auth_provider: 'twitter',
              social_accounts: {
                twitter: {
                  id: twitterData.provider_id || twitterData.sub,
                  username: twitterData.user_name || twitterData.preferred_username,
                  name: twitterData.name,
                  verified: twitterData.verified || false,
                  avatar_url: twitterData.avatar_url || twitterData.picture
                }
              },
              settings: {
                share_location: false,
                allow_friend_requests: true,
                show_online_status: true,
                allow_message_from_strangers: false,
                ghost_mode: false,
                privacy_level: 'friends',
                notifications: {
                  push_enabled: true,
                  location_updates: true,
                  friend_requests: true,
                  messages: true
                }
              },
              stats: {
                snaps_shared: 0,
                friends_count: 0,
                stories_posted: 0
              }
            }
          } else {
            // Create profile for email users
            profileData = {
              id: session.user.id,
              email: session.user.email || '',
              username: session.user.email?.split('@')[0] || `user_${session.user.id.substring(0, 8)}`,
              display_name: session.user.email?.split('@')[0] || 'User',
              avatar: '😊',
              bio: '',
              snap_score: 0,
              last_active: new Date().toISOString(),
              is_online: true,
              auth_provider: 'email',
              settings: {
                share_location: false,
                allow_friend_requests: true,
                show_online_status: true,
                allow_message_from_strangers: false,
                ghost_mode: false,
                privacy_level: 'friends',
                notifications: {
                  push_enabled: true,
                  location_updates: true,
                  friend_requests: true,
                  messages: true
                }
              },
              stats: {
                snaps_shared: 0,
                friends_count: 0,
                stories_posted: 0
              }
            }
          }
          
          // Create the user profile
          try {
            const { error: createError } = await supabase
              .from('users')
              .upsert(profileData, {
                onConflict: 'id',
                ignoreDuplicates: false
              })

            if (createError) {
              console.error('Error creating/updating user profile:', createError)
              // Set session but without user profile - user can complete profile later
              dispatch(setAuth({ user: null, session }))
            } else {
              // Fetch the created/updated profile
              const { data: newProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single()
              
              dispatch(setAuth({ user: newProfile, session }))
            }
          } catch (profileCreateError) {
            console.error('Error in profile creation:', profileCreateError)
            dispatch(setAuth({ user: null, session }))
          }
        } else if (error) {
          console.error('Error fetching user profile:', error)
          dispatch(clearAuth())
        } else {
          dispatch(setAuth({ user: userProfile, session }))
        }
      } catch (error) {
        console.error('Error handling auth state change:', error)
        dispatch(clearAuth())
      }
    } else {
      dispatch(clearAuth())
    }
  }

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    try {
      dispatch(setLoading(true))

      // Test connection first
      const isConnected = await testSupabaseConnection()
      if (!isConnected) {
        return { error: 'Cannot connect to server. Please check your internet connection.' }
      }

      // Check if username is available
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUser) {
        return { error: 'Username is already taken' }
      }

      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        if (signUpError.message.includes('network') || signUpError.message.includes('fetch')) {
          return { error: 'Network error. Please check your internet connection and try again.' }
        }
        return { error: signUpError.message }
      }

      if (data.user) {
        // Create or update user profile (UPSERT to handle existing users)
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email,
            username,
            display_name: displayName,
            avatar: '😊',
            bio: '',
            snap_score: 0,
            last_active: new Date().toISOString(),
            is_online: true,
            settings: {
              share_location: false,
              allow_friend_requests: true,
              show_online_status: true,
              allow_message_from_strangers: false,
              ghost_mode: false,
              privacy_level: 'friends',
              notifications: {
                push_enabled: true,
                location_updates: true,
                friend_requests: true,
                messages: true
              }
            },
            stats: {
              snaps_shared: 0,
              friends_count: 0,
              stories_posted: 0
            }
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
          if (profileError.message.includes('network') || profileError.message.includes('fetch')) {
            return { error: 'Network error while creating profile. Please try again.' }
          }
          return { error: 'Failed to create user profile' }
        }

        return {}
      }

      return { error: 'Failed to create account' }
    } catch (error) {
      console.error('Sign up error:', error)
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
        return { error: 'Network error. Please check your internet connection.' }
      }
      return { error: 'An unexpected error occurred' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true))

      // Test connection first
      const isConnected = await testSupabaseConnection()
      if (!isConnected) {
        return { error: 'Cannot connect to server. Please check your internet connection.' }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          return { error: 'Network error. Please check your internet connection and try again.' }
        }
        return { error: error.message }
      }

      return {}
    } catch (error) {
      console.error('Sign in error:', error)
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
        return { error: 'Network error. Please check your internet connection.' }
      }
      return { error: 'An unexpected error occurred' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const signInWithTwitter = async () => {
    try {
      dispatch(setLoading(true))

      // Test connection first
      const isConnected = await testSupabaseConnection()
      if (!isConnected) {
        return { error: 'Cannot connect to server. Please check your internet connection.' }
      }

      console.log('🐦 Starting Supabase Twitter OAuth flow...')

      // Use consistent redirect URI for Supabase OAuth
      const redirectUri = __DEV__ 
        ? 'tribefind://auth/callback'  // Use same URI for both dev and prod
        : 'tribefind://auth/callback'
      
      console.log('🔗 Using redirect URI:', redirectUri)

      // Start Supabase Twitter OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true // We'll handle the browser opening
        }
      })

      if (error) {
        console.error('❌ Twitter OAuth error:', error)
        
        if (error.message.includes('Provider not found') || error.message.includes('twitter')) {
          return { error: 'Twitter OAuth is not configured in Supabase. Please enable Twitter provider in Authentication > Providers and add your Twitter app credentials.' }
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          return { error: 'Network error. Please check your internet connection and try again.' }
        }
        return { error: `Twitter OAuth failed: ${error.message}` }
      }

      if (!data?.url) {
        console.warn('⚠️ No OAuth URL returned from Supabase')
        return { error: 'Failed to generate Twitter authorization URL. Please check your Supabase Twitter OAuth configuration.' }
      }

      console.log('🔗 Twitter OAuth URL generated successfully')
      console.log('🔗 Redirect URL configured:', redirectUri)
      
      // Open the OAuth URL in the system browser
      try {
        console.log('🌐 Opening Twitter OAuth in system browser...')
        await Linking.openURL(data.url)
        
        console.log('🔄 OAuth initiated - waiting for deep link callback...')
        console.log('Expected callback format: tribefind://auth/callback?...')
        
        return {} // Success - deep link handler will complete the flow
      } catch (linkingError) {
        console.error('❌ Failed to open OAuth URL:', linkingError)
        return { error: 'Failed to open Twitter authorization page. Please check if you have a browser installed.' }
      }
    } catch (error) {
      console.error('Twitter sign in error:', error)
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
        return { error: 'Network error. Please check your internet connection.' }
      }
      return { error: 'An unexpected error occurred during Twitter authentication' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const signOut = async () => {
    try {
      dispatch(setLoading(true))

      // Update user online status
      if (user) {
        await supabase
          .from('users')
          .update({ 
            is_online: false,
            last_active: new Date().toISOString()
          })
          .eq('id', user.id)
      }

      const { error } = await supabase.auth.signOut()

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      console.error('Sign out error:', error)
      return { error: 'An unexpected error occurred' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          return { error: 'Network error. Please check your internet connection.' }
        }
        return { error: error.message }
      }

      return {}
    } catch (error) {
      console.error('Reset password error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) {
        return { error: 'No user logged in' }
      }

      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        return { error: error.message }
      }

      // Update local state
      dispatch(updateUser(updates))
      return {}
    } catch (error) {
      console.error('Update profile error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const refreshUser = async () => {
    try {
      if (!user) return

      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!error && userProfile) {
        dispatch(updateUser(userProfile))
      }
    } catch (error) {
      console.error('Refresh user error:', error)
    }
  }

  const testConnection = async () => {
    return await testSupabaseConnection()
  }

  const debugTwitterProvider = async () => {
    try {
      console.log('🔍 Testing Twitter provider configuration...')
      
      // Try to initiate OAuth to see if provider is configured
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: 'tribefind://auth/twitter',
          skipBrowserRedirect: true // Just test, don't actually redirect
        },
      })
      
      if (error) {
        console.error('❌ Twitter provider test failed:', error.message)
        return false
      }
      
      if (data?.url) {
        console.log('✅ Twitter provider is properly configured')
        return true
      }
      
      console.warn('⚠️ Twitter provider test returned no URL')
      return false
    } catch (error) {
      console.error('❌ Twitter provider test error:', error)
      return false
    }
  }

  const value = {
    signUp,
    signIn,
    signInWithTwitter,
    signOut,
    resetPassword,
    updateProfile,
    refreshUser,
    testConnection,
    debugTwitterProvider,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 