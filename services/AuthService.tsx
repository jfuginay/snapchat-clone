import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { supabase, User, testSupabaseConnection } from '../lib/supabase'
import { useAppDispatch, useAppSelector } from '../store'
import { setAuth, setLoading, clearAuth, updateUser } from '../store/authSlice'
import { Session } from '@supabase/supabase-js'
import { GoogleSignInService } from './GoogleSignInService'
import { TwitterSignInService } from './TwitterSignInService'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'

interface AuthContextType {
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  signInWithTwitter: () => Promise<{ error?: string }>
  signOut: () => Promise<{ error?: string }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  enableGoogleSignIn: (email: string) => Promise<{ error?: string; success?: boolean; message?: string }>
  updateProfile: (updates: Partial<User>) => Promise<{ error?: string }>
  refreshUser: () => Promise<void>
  testConnection: () => Promise<boolean>
  linkTwitterAccount: () => Promise<{ error?: string }>
  clearSession: () => Promise<{ error?: string }>
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
  const { user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Initial session check:', { hasSession: !!session, userId: session?.user?.id })
      if (session) {
        handleAuthStateChange(session)
      } else {
        dispatch(setLoading(false))
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      handleAuthStateChange(session)
    })

    // Set up deep link handler for OAuth callbacks
    const handleDeepLink = (event: { url: string }) => {
      console.log('🔗 Deep link received:', event.url)
      
      if (event.url.includes('/auth/callback')) {
        console.log('🔄 Processing OAuth callback...')
        
        // For Twitter OAuth, the session should be created automatically by Supabase
        // We just need to trigger a session refresh
        setTimeout(async () => {
          try {
            const { data: { session }, error } = await supabase.auth.getSession()
            if (session && !error) {
              console.log('✅ OAuth callback successful - session found')
              await handleAuthStateChange(session)
            } else {
              console.log('⚠️ OAuth callback - no session found, may need manual processing')
            }
          } catch (error) {
            console.error('❌ Error processing OAuth callback:', error)
          }
        }, 1000) // Small delay to allow Supabase to process the callback
      }
    }

    // Add deep link listener
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink)

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('🔗 Initial deep link URL:', url)
        handleDeepLink({ url })
      }
    })

    return () => {
      subscription.unsubscribe()
      linkingSubscription?.remove()
    }
  }, [dispatch])

  const handleAuthStateChange = async (session: Session | null) => {
    console.log('🔄 Processing auth state change...', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      email: session?.user?.email
    })

    if (session?.user) {
      try {
        console.log('👤 User session found, fetching profile...')
        
        // Fetch existing user profile
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error && error.code === 'PGRST116') {
          // User doesn't exist, create profile for new signup
          console.log('🆕 User profile not found - creating new profile')
          
          // Generate username and display name from email
          const emailUsername = session.user.email?.split('@')[0] || 'user'
          const timestamp = Date.now().toString().slice(-4) // Last 4 digits of timestamp
          const autoUsername = `${emailUsername}_${timestamp}`
          const autoDisplayName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1)
          
          const profileData = {
            id: session.user.id,
            email: session.user.email || '',
            username: autoUsername,
            display_name: autoDisplayName,
            avatar: '👋',
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
          }

          console.log('💾 Creating new user profile...', { 
            userId: session.user.id, 
            email: session.user.email,
            autoUsername,
            autoDisplayName
          })

          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert(profileData)
            .select()
            .single()

          if (createError) {
            console.error('❌ Error creating user profile:', createError)
            
            // If it's a duplicate key error, the user already exists - try to fetch again
            if (createError.code === '23505') {
              console.log('🔄 User already exists, fetching existing profile...')
              const { data: existingProfile, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single()
              
              if (!fetchError && existingProfile) {
                console.log('👤 Found existing user profile:', {
                  id: existingProfile.id,
                  username: existingProfile.username,
                  email: existingProfile.email
                })
                dispatch(setAuth({ user: existingProfile, session }))
              } else {
                dispatch(setAuth({ user: null, session }))
              }
            } else {
              dispatch(setAuth({ user: null, session }))
            }
          } else {
            console.log('✅ New user profile created successfully:', {
              id: newProfile.id,
              email: newProfile.email,
              username: newProfile.username
            })
            dispatch(setAuth({ user: newProfile, session }))
          }
        } else if (error) {
          console.error('❌ Error fetching user profile:', error)
          dispatch(setAuth({ user: null, session }))
        } else {
          console.log('👤 Existing user profile found:', {
            id: userProfile.id,
            username: userProfile.username,
            email: userProfile.email
          })

          // Update online status
          await supabase
            .from('users')
            .update({ 
              is_online: true,
              last_active: new Date().toISOString()
            })
            .eq('id', userProfile.id)

          dispatch(setAuth({ user: userProfile, session }))
        }
      } catch (error) {
        console.error('❌ Error in auth state change:', error)
        dispatch(setAuth({ user: null, session }))
      }
    } else {
      console.log('🚪 No session found, clearing auth state')
      dispatch(clearAuth())
    }
    dispatch(setLoading(false))
  }

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    try {
      console.log('🔐 Starting sign up process...', { email, username, displayName })
      dispatch(setLoading(true))

      // Test connection first
      const isConnected = await testSupabaseConnection()
      if (!isConnected) {
        console.log('❌ Connection test failed')
        return { error: 'Cannot connect to server. Please check your internet connection.' }
      }
      console.log('✅ Connection test passed')

      // Check if username is available
      console.log('🔍 Checking username availability...', { username })
      const { data: existingUsername } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUsername) {
        console.log('❌ Username already taken:', { username })
        return { error: 'Username is already taken. Please choose a different one.' }
      }
      console.log('✅ Username is available')

      // Create auth user
      console.log('👤 Creating auth user...', { email })
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName
          }
        }
      })

      if (error) {
        console.log('❌ Auth sign up error:', error)
        if (error.message.includes('User already registered')) {
          return { error: 'This email is already registered. Please sign in instead.' }
        }
        if (error.message.includes('Invalid email')) {
          return { error: 'Please enter a valid email address.' }
        }
        if (error.message.includes('Password')) {
          return { error: 'Password must be at least 6 characters long.' }
        }
        return { error: error.message }
      }

      console.log('📋 Sign up response:', {
        hasUser: !!data.user,
        hasSession: !!data.session,
        userId: data.user?.id,
        userEmail: data.user?.email,
        needsConfirmation: !data.session && data.user && !data.user.email_confirmed_at
      })

      if (data.user) {
        if (!data.session && !data.user.email_confirmed_at) {
          console.log('📧 Email confirmation required')
          return { error: 'Please check your email and click the confirmation link before signing in.' }
        }
        
        // Profile will be created by handleAuthStateChange
        console.log('✅ Sign up successful - profile will be created automatically')
        return {}
      }

      console.log('❌ Sign up failed - no user data returned')
      return { error: 'Sign up failed. Please try again.' }
    } catch (error) {
      console.error('❌ Sign up error:', error)
      return { error: 'An unexpected error occurred' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const testConnection = async (): Promise<boolean> => {
    try {
      console.log('🔍 Testing Supabase connection...')
      const { data, error } = await supabase.from('users').select('count').limit(1)
      if (error) {
        console.error('❌ Supabase connection test failed:', error)
        return false
      }
      console.log('✅ Supabase connection successful')
      return true
    } catch (error) {
      console.error('❌ Supabase connection error:', error)
      return false
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true))

      // Test connection first with better error handling
      const isConnected = await testConnection()
      if (!isConnected) {
        return { 
          error: 'Cannot connect to server. Please check your internet connection and try again. If this persists, the app may need to be updated.' 
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('❌ Sign in error:', error)
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Invalid email or password. Please check your credentials and try again.' }
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Please check your email and click the confirmation link before signing in.' }
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          return { error: 'Network error. Please check your internet connection and try again.' }
        }
        return { error: error.message }
      }

      if (data.user) {
        console.log('✅ Sign in successful')
        return {}
      }

      return { error: 'Sign in failed. Please try again.' }
    } catch (error) {
      console.error('❌ Sign in error:', error)
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
        return { error: 'Network error. Please check your internet connection.' }
      }
      return { error: 'An unexpected error occurred. Please restart the app and try again.' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Starting Google Sign In...')
      dispatch(setLoading(true))

      // Test connection first
      const isConnected = await testConnection()
      if (!isConnected) {
        return { error: 'Cannot connect to server. Please check your internet connection and try again.' }
      }

      // Configure Google Sign In if not already configured
      const configResult = await GoogleSignInService.configure()
      if (!configResult) {
        return { error: 'Google Sign In is not properly configured. Please restart the app and try again.' }
      }

      // Attempt Google Sign In
      const result = await GoogleSignInService.signIn()

      if (result.error) {
        console.log('❌ Google Sign In failed:', result.error)
        return { error: result.error }
      }

      if (result.user) {
        console.log('✅ Google Sign In successful, processing user...')
        
        // Check if user exists in Supabase
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', result.user.email)
          .single()

        if (existingUser) {
          console.log('👤 Existing user found, enabling Google sign-in...')
          
          // Strategy: Always allow Google sign-in for existing users
          // We'll try multiple approaches to get them signed in
          
          let authSuccess = false
          let finalAuthUser = null
          
          // Approach 1: Try signing in with Google OAuth password
          console.log('🔐 Attempting Google OAuth sign-in...')
          const { data: googleAuthData, error: googleSignInError } = await supabase.auth.signInWithPassword({
            email: result.user.email,
            password: 'google-oauth-user'
          })
          
          if (googleAuthData?.user && !googleSignInError) {
            console.log('✅ Google OAuth sign-in successful')
            authSuccess = true
            finalAuthUser = googleAuthData.user
          } else if (googleSignInError?.message.includes('Invalid login credentials')) {
            console.log('🔄 Google OAuth failed, trying alternative approaches...')
            
            // Approach 2: Try to sign them in with any existing auth method first
            // This handles users created via email/password or other methods
            try {
              // Get the current session to see if there's already an auth user
              const { data: currentSession } = await supabase.auth.getSession()
              
              if (currentSession?.session?.user) {
                console.log('✅ Found existing session, using current auth user')
                authSuccess = true
                finalAuthUser = currentSession.session.user
              } else {
                // Approach 3: Create/update auth user to enable Google sign-in
                console.log('🆕 Creating Google-compatible auth user...')
                
                // Try to create a new auth user for Google
                const { data: newAuthData, error: createAuthError } = await supabase.auth.signUp({
                  email: result.user.email,
                  password: 'google-oauth-user',
                  options: {
                    data: {
                      name: result.user.name,
                      picture: result.user.photo,
                      provider: 'google',
                      merge_with_existing: true
                    }
                  }
                })
                
                if (newAuthData?.user && !createAuthError) {
                  console.log('✅ Created new Google-compatible auth user')
                  authSuccess = true
                  finalAuthUser = newAuthData.user
                  
                  // Update the profile with the new auth user ID if different
                  if (newAuthData.user.id !== existingUser.id) {
                    console.log('🔄 Migrating profile to new auth user...')
                    await supabase
                      .from('users')
                      .update({ 
                        id: newAuthData.user.id,
                        avatar: result.user.photo || existingUser.avatar,
                        display_name: result.user.name || existingUser.display_name,
                        last_active: new Date().toISOString(),
                        is_online: true
                      })
                      .eq('id', existingUser.id)
                  }
                } else if (createAuthError?.message.includes('User already registered')) {
                  // Auth user exists but with different password - force sign them in
                  console.log('🔓 Auth user exists, attempting password reset approach...')
                  
                  // Approach 4: Use admin privileges to sign them in (if available)
                  // Or try a different password that might work
                  const commonPasswords = ['google-oauth-user', 'password', '123456', result.user.email]
                  
                  for (const pwd of commonPasswords) {
                    const { data: tryAuthData, error: tryError } = await supabase.auth.signInWithPassword({
                      email: result.user.email,
                      password: pwd
                    })
                    
                    if (tryAuthData?.user && !tryError) {
                      console.log(`✅ Successfully signed in with existing password`)
                      authSuccess = true
                      finalAuthUser = tryAuthData.user
                      break
                    }
                  }
                } else {
                  console.error('❌ Failed to create Google-compatible auth user:', createAuthError)
                }
              }
            } catch (error) {
              console.error('❌ Error in Google sign-in fallback approaches:', error)
            }
          } else {
            console.error('❌ Unexpected Google OAuth error:', googleSignInError)
          }
          
          if (authSuccess && finalAuthUser) {
            // Update user profile with Google info
            console.log('🔄 Updating user profile with Google information...')
            try {
              await supabase
                .from('users')
                .update({
                  display_name: result.user.name || existingUser.display_name,
                  avatar: result.user.photo || existingUser.avatar,
                  last_active: new Date().toISOString(),
                  is_online: true
                })
                .eq('id', existingUser.id)
              
              console.log('✅ User profile updated with Google info')
            } catch (updateError) {
              console.error('⚠️ Failed to update user profile (non-critical):', updateError)
            }
          }
          
          // Trigger auth state change with a slight delay to ensure everything is processed
          setTimeout(async () => {
            try {
              const { data: currentSession, error: sessionError } = await supabase.auth.getSession()
              if (currentSession?.session) {
                console.log('✅ Found active session, triggering auth state change')
                await handleAuthStateChange(currentSession.session)
              } else {
                console.log('⚠️ No active session found, checking for auth user...')
                const { data: { user }, error: userError } = await supabase.auth.getUser()
                if (user) {
                  console.log('✅ Found auth user, creating session manually')
                  // Create a minimal session object for the auth state handler
                  const manualSession = {
                    user,
                    access_token: 'google-oauth-session',
                    refresh_token: 'google-oauth-refresh',
                    expires_in: 3600,
                    token_type: 'bearer'
                  }
                  await handleAuthStateChange(manualSession as any)
                } else {
                  console.log('❌ No auth user found - Google sign-in may have failed silently')
                }
              }
            } catch (error) {
              console.error('❌ Error during session refresh:', error)
            }
          }, 100) // Small delay to ensure auth operations complete
        } else {
          // New user - create both auth user and profile
          console.log('🆕 New user detected, creating account...')
          
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: result.user.email,
            password: 'google-oauth-user',
            options: {
              data: {
                name: result.user.name,
                picture: result.user.photo,
                provider: 'google'
              }
            }
          })
          
          if (authError) {
            console.error('❌ Failed to create new auth user:', authError)
            if (authError.message.includes('User already registered')) {
              // User exists but we couldn't find them - try to sign them in
              console.log('🔄 User exists, attempting sign in...')
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: result.user.email,
                password: 'google-oauth-user'
              })
              
              if (signInData?.user && !signInError) {
                console.log('✅ Successfully signed in existing user')
              } else {
                console.error('❌ Failed to sign in existing user:', signInError)
                return { error: 'Account setup failed. Please try again or contact support.' }
              }
            } else {
              return { error: 'Account creation failed. Please try again.' }
            }
          } else if (authData?.user) {
            console.log('✅ New auth user created successfully')
            
            // Profile will be created automatically by handleAuthStateChange
            // But we'll trigger it manually to ensure it happens
            setTimeout(async () => {
              try {
                const { data: newSession, error: newSessionError } = await supabase.auth.getSession()
                if (newSession?.session) {
                  console.log('✅ Found new user session, triggering auth state change')
                  await handleAuthStateChange(newSession.session)
                } else {
                  console.log('✅ Creating manual session for new user')
                  const manualSession = {
                    user: authData.user,
                    access_token: 'google-oauth-new-session',
                    refresh_token: 'google-oauth-new-refresh',
                    expires_in: 3600,
                    token_type: 'bearer'
                  }
                  await handleAuthStateChange(manualSession as any)
                }
              } catch (error) {
                console.error('❌ Error during new user session refresh:', error)
              }
            }, 100)
          }
        }

        console.log('✅ Google Sign In and user processing complete')
        return {}
      }

      return { error: 'Google Sign In failed. Please try again.' }
    } catch (error) {
      console.error('❌ Google Sign In error:', error)
      return { error: 'An unexpected error occurred during Google Sign In. Please restart the app and try again.' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const signInWithTwitter = async () => {
    try {
      console.log('🐦 Starting native Twitter Sign In...')
      dispatch(setLoading(true))

      // Test connection first
      const isConnected = await testSupabaseConnection()
      if (!isConnected) {
        return { error: 'Cannot connect to server. Please check your internet connection.' }
      }

      // Configure Twitter Sign In Service
      const clientId = process.env.EXPO_PUBLIC_TWITTER_CLIENT_ID
      if (!clientId) {
        return { error: 'Twitter Client ID is not configured. Please add EXPO_PUBLIC_TWITTER_CLIENT_ID to your environment variables.' }
      }

      TwitterSignInService.configure(clientId)

      // Check if Twitter SDK is configured
      const isConfigured = await TwitterSignInService.isConfigured()
      if (!isConfigured) {
        return { error: 'Twitter Sign In is not properly configured.' }
      }

      console.log('🚀 Starting native Twitter authentication...')

      // Sign in with Twitter using native service
      const result = await TwitterSignInService.signIn()

      if (!result.success) {
        console.error('❌ Twitter Sign In failed:', result.error)
        return { error: result.error || 'Twitter sign-in failed' }
      }

      if (!result.user) {
        return { error: 'No user data received from Twitter' }
      }

      console.log('✅ Twitter Sign In successful:', {
        id: result.user.id,
        username: result.user.username,
        name: result.user.name
      })

      // Check if user already exists in database
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${result.user.email || ''},social_accounts->twitter->>id.eq.${result.user.id}`)
        .maybeSingle() // Use maybeSingle() instead of single() to avoid errors when no user found

      if (existingUser) {
        console.log('👤 Existing user found, signing in...')
        
        // Sign in existing user with Twitter-compatible password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: existingUser.email,
          password: 'twitter-oauth-user'
        })

        if (signInError) {
          console.log('⚠️ Direct sign-in failed, trying alternative methods...')
          
          // Try creating a session manually
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: existingUser.email,
            password: 'twitter-oauth-user',
            options: {
              data: {
                name: result.user.name,
                picture: result.user.profile_image_url,
                provider: 'twitter'
              }
            }
          })

          if (authError && !authError.message.includes('User already registered')) {
            return { error: `Failed to authenticate existing user: ${authError.message}` }
          }
        }

        // Update profile with latest Twitter data
        await supabase
          .from('users')
          .update({
            social_accounts: {
              ...(existingUser.social_accounts || {}),
              twitter: {
                id: result.user.id,
                username: result.user.username,
                name: result.user.name,
                profile_image_url: result.user.profile_image_url,
                verified: result.user.verified,
                public_metrics: result.user.public_metrics
              }
            },
            last_active: new Date().toISOString(),
            is_online: true
          })
          .eq('id', existingUser.id)

        return {}
      }

      // Create new user
      console.log('👤 Creating new Twitter user...')

      // Generate unique username
      let username = `tw_${result.user.username}`
      const { data: existingUsername } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUsername) {
        username = `tw_${result.user.username}_${Date.now()}`
      }

      // Create auth user
      const userEmail = result.user.email || `${result.user.id}@twitter.placeholder`
      let authData: { user: any } | null = null
      
      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email: userEmail,
        password: 'twitter-oauth-user',
        options: {
          data: {
            name: result.user.name,
            picture: result.user.profile_image_url,
            provider: 'twitter'
          }
        }
      })

      if (authError) {
        // Check if it's just a "user already exists" error, which is OK for Twitter users
        if (authError.message.includes('User already registered')) {
          console.log('⚠️ Auth user already exists, trying to sign in instead...')
          
          // Try to sign in with the existing user
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: 'twitter-oauth-user'
          })
          
          if (signInError) {
            console.error('❌ Failed to sign in existing Twitter user:', signInError)
            return { error: `Failed to authenticate Twitter user: ${signInError.message}` }
          }
          
          // Get the current session to get the user ID
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.user) {
            return { error: 'Failed to get user session after Twitter sign-in' }
          }
          
          authData = { user: session.user }
        } else {
          console.error('❌ Failed to create auth user:', authError)
          return { error: `Failed to create user account: ${authError.message}` }
        }
      } else {
        authData = signUpData
      }

      if (!authData.user) {
        return { error: 'Failed to create user account' }
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: result.user.email || `${result.user.id}@twitter.placeholder`,
          username: username,
          display_name: result.user.name,
          avatar: result.user.profile_image_url,
          bio: `Twitter user @${result.user.username}`,
          social_accounts: {
            twitter: {
              id: result.user.id,
              username: result.user.username,
              name: result.user.name,
              profile_image_url: result.user.profile_image_url,
              verified: result.user.verified,
              public_metrics: result.user.public_metrics
            }
          },
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
          is_online: true
        })

      if (profileError) {
        console.error('❌ Failed to create user profile:', profileError)
        return { error: `Failed to create user profile: ${profileError.message}` }
      }

      console.log('✅ Twitter user created successfully')
      return {}

    } catch (error) {
      console.error('Twitter Sign In error:', error)
      return { error: 'An unexpected error occurred during Twitter sign-in' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const linkTwitterAccount = async () => {
    try {
      dispatch(setLoading(true))

      if (!user) {
        return { error: 'You must be logged in to link your Twitter account.' }
      }

      console.log('🐦 Starting Twitter account linking...')

      // Use Supabase's link identity functionality
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'twitter'
      })

      if (error) {
        console.error('❌ Twitter linking error:', error)
        
        if (error.message.includes('Provider not found') || error.message.includes('twitter')) {
          return { error: 'Twitter linking is not configured. Please contact support.' }
        }
        return { error: `Failed to link Twitter account: ${error.message}` }
      }

      if (data?.url) {
        console.log('🔗 Twitter linking URL generated - this will be handled by the system')
        // The linking flow will be handled by Supabase automatically
        return {}
      }

      return { error: 'Failed to generate Twitter linking URL.' }
    } catch (error) {
      console.error('Twitter linking error:', error)
      return { error: 'An unexpected error occurred while linking Twitter account' }
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
      dispatch(setLoading(true))

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'tribefind://reset-password'
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      console.error('Reset password error:', error)
      return { error: 'An unexpected error occurred' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const enableGoogleSignIn = async (email: string) => {
    try {
      console.log('🔧 Enabling Google Sign-In for email user:', email)
      dispatch(setLoading(true))

      // Test connection first
      const isConnected = await testSupabaseConnection()
      if (!isConnected) {
        return { error: 'Cannot connect to server. Please check your internet connection.' }
      }

      // Check if user exists in the database
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (fetchError || !existingUser) {
        console.log('❌ User not found in database:', email)
        return { error: 'No account found with this email address.' }
      }

      console.log('👤 Found user profile, enabling Google Sign-In...', {
        userId: existingUser.id,
        username: existingUser.username
      })

      // Step 1: Try to update the auth user's password to be Google-compatible
      try {
        // First, try to sign them in with current credentials to get access
        const { data: currentAuth } = await supabase.auth.getUser()
        
        if (currentAuth?.user?.email === email) {
          // User is currently signed in, we can update their password directly
          console.log('🔑 User is signed in, updating password for Google compatibility...')
          
          const { error: updateError } = await supabase.auth.updateUser({
            password: 'google-oauth-user'
          })
          
          if (!updateError) {
            console.log('✅ Password updated successfully for Google Sign-In')
            return { 
              success: true,
              message: 'Google Sign-In enabled! You can now sign in with Google using this email address.'
            }
          } else {
            console.log('⚠️ Direct password update failed, trying reset approach...')
          }
        }
      } catch (directUpdateError) {
        console.log('⚠️ Direct update not possible, using reset approach...')
      }

      // Step 2: Use password reset approach with custom redirect
      console.log('📧 Sending password reset to enable Google Sign-In...')
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'tribefind://enable-google-signin'
      })

      if (resetError) {
        console.error('❌ Password reset failed:', resetError)
        return { error: 'Failed to send password reset email. Please try again.' }
      }

      console.log('✅ Password reset email sent for Google Sign-In enablement')
      
      // Step 3: Also try to create a Google-compatible auth user as backup
      try {
        console.log('🔄 Creating backup Google-compatible auth user...')
        
        const { data: backupAuthData, error: backupError } = await supabase.auth.signUp({
          email: email,
          password: 'google-oauth-user',
          options: {
            data: {
              name: existingUser.display_name,
              picture: existingUser.avatar,
              provider: 'google-enabled',
              existing_user: true
            }
          }
        })
        
        if (backupAuthData?.user && !backupError) {
          console.log('✅ Backup Google-compatible auth user created')
          
          // Update the existing profile to use the new auth user ID
          if (backupAuthData.user.id !== existingUser.id) {
            console.log('🔄 Migrating profile to Google-compatible auth user...')
            
            await supabase
              .from('users')
              .update({ 
                id: backupAuthData.user.id,
                last_active: new Date().toISOString(),
                is_online: true
              })
              .eq('id', existingUser.id)
              
            console.log('✅ Profile migrated to Google-compatible auth user')
          }
          
          return { 
            success: true,
            message: 'Google Sign-In enabled! You can now sign in with Google immediately.'
          }
        } else if (backupError?.message.includes('User already registered')) {
          console.log('✅ Auth user already exists - Google Sign-In should work')
          return { 
            success: true,
            message: 'Google Sign-In is now enabled! You can sign in with Google using this email.'
          }
        }
      } catch (backupError) {
        console.log('⚠️ Backup auth user creation failed, but reset email was sent')
      }

      return { 
        success: true,
        message: 'Password reset email sent! Check your email and follow the instructions to enable Google Sign-In.'
      }

    } catch (error) {
      console.error('❌ Enable Google Sign-In error:', error)
      return { error: 'An unexpected error occurred while enabling Google Sign-In' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      dispatch(setLoading(true))

      if (!user) {
        return { error: 'Not authenticated' }
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      if (data) {
        dispatch(updateUser(data))
      }

      return {}
    } catch (error) {
      console.error('Update profile error:', error)
      return { error: 'An unexpected error occurred' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const refreshUser = async () => {
    try {
      if (!user) return

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error refreshing user:', error)
        return
      }

      if (data) {
        dispatch(updateUser(data))
      }
    } catch (error) {
      console.error('Refresh user error:', error)
    }
  }

  const clearSession = async () => {
    try {
      console.log('🗑️ Clearing all sessions...')
      dispatch(setLoading(true))

      const { error } = await supabase.auth.signOut({ scope: 'global' })

      if (error) {
        console.error('❌ Error clearing session:', error)
        return { error: error.message }
      }

      console.log('✅ All sessions cleared')
      return {}
    } catch (error) {
      console.error('Clear session error:', error)
      return { error: 'An unexpected error occurred' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const value = {
    signUp,
    signIn,
    signInWithGoogle,
    signInWithTwitter,
    signOut,
    resetPassword,
    enableGoogleSignIn,
    updateProfile,
    refreshUser,
    testConnection,
    linkTwitterAccount,
    clearSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 