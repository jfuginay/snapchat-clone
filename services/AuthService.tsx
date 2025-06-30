import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { supabase, User, testSupabaseConnection } from '../lib/supabase'
import { useAppDispatch, useAppSelector } from '../store'
import { setAuth, setLoading, clearAuth, updateUser } from '../store/authSlice'
import { Session } from '@supabase/supabase-js'
import { GoogleSignInService } from './GoogleSignInService'
import { TwitterSignInService } from './TwitterSignInService'
import { AppleSignInService } from './AppleSignInService'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'

// Navigation helper for OAuth redirects
let navigationRef: any = null

export const setNavigationRef = (ref: any) => {
  navigationRef = ref
}

const navigateToMapAfterOAuth = () => {
  if (navigationRef?.current) {
    // Navigate to the Map tab after OAuth authentication
    navigationRef.current.navigate('Main', { 
      screen: 'Map',
      initial: false 
    })
  }
}

interface AuthContextType {
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  signInWithTwitter: () => Promise<{ error?: string }>
  signInWithApple: () => Promise<{ error?: string }>
  signOut: () => Promise<{ error?: string }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  enableGoogleSignIn: (email: string) => Promise<{ error?: string; success?: boolean; message?: string }>
  updateProfile: (updates: Partial<User>) => Promise<{ error?: string }>
  refreshUser: () => Promise<void>
  testConnection: () => Promise<boolean>
  linkTwitterAccount: () => Promise<{ error?: string }>
  clearSession: () => Promise<{ error?: string }>
  setNavigationRef: typeof setNavigationRef
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
      
      // Handle different OAuth callback patterns
      if (event.url.includes('/auth/callback') || event.url.includes('/auth/twitter') || event.url.includes('tribefind://auth')) {
        console.log('🔄 Processing OAuth callback...', { url: event.url })
        
        // For Twitter OAuth, extract the code and handle manually
        if (event.url.includes('/auth/twitter') || event.url.includes('tribefind://auth/twitter')) {
          console.log('🐦 Twitter OAuth callback detected')
          // Twitter callback is handled by TwitterSignInService directly
          // No additional processing needed here
          return
        }
        
        // For other OAuth providers (Google, etc.), refresh session
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
          
          // Generate a unique username
          let baseUsername = session.user.user_metadata?.username || 
                           session.user.user_metadata?.name?.toLowerCase().replace(/\s+/g, '_') ||
                           session.user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
                           'user'
          
          // Ensure username is unique by checking database and adding suffix if needed
          let username = baseUsername
          let usernameAttempt = 0
          let usernameExists = true
          
          while (usernameExists && usernameAttempt < 10) {
            const { data: existingUsername } = await supabase
              .from('users')
              .select('username')
              .eq('username', username)
              .maybeSingle()
            
            if (!existingUsername) {
              usernameExists = false
            } else {
              usernameAttempt++
              username = `${baseUsername}_${usernameAttempt}`
            }
          }
          
          // If still not unique after 10 attempts, use timestamp
          if (usernameExists) {
            username = `${baseUsername}_${Date.now()}`
          }

          // Create profile data from auth session
          const profileData = {
            id: session.user.id,
            email: session.user.email || '',
            username: username,
            display_name: session.user.user_metadata?.display_name || 
                         session.user.user_metadata?.name || 
                         'User',
            avatar: session.user.user_metadata?.picture || 
                   session.user.user_metadata?.avatar_url || 
                   null,
            bio: null,
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

          console.log('💾 Attempting to create profile with unique username:', {
            userId: profileData.id,
            email: profileData.email,
            username: profileData.username
          })

          // Try to insert new profile with proper error handling
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert(profileData)
            .select()
            .single()

          if (createError) {
            console.error('❌ Error creating user profile:', createError)
            
            // If it's a duplicate key error, try to fetch and update existing profile
            if (createError.code === '23505') {
              console.log('🔄 Profile already exists, fetching and updating existing profile...')
              
              // Check if it's a duplicate ID or username
              if (createError.message.includes('users_pkey')) {
                console.log('🔍 Duplicate ID error - fetching existing profile by ID')
                const { data: existingProfile, error: fetchError } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', session.user.id)
                  .single()
                
                if (!fetchError && existingProfile) {
                  console.log('✅ Found existing profile by ID, updating it')
                  const { data: updatedProfile, error: updateError } = await supabase
                    .from('users')
                    .update({
                      display_name: profileData.display_name || existingProfile.display_name,
                      avatar: profileData.avatar || existingProfile.avatar,
                      last_active: new Date().toISOString(),
                      is_online: true
                    })
                    .eq('id', session.user.id)
                    .select()
                    .single()
                  
                  if (!updateError && updatedProfile) {
                    console.log('✅ Existing profile updated successfully')
                    dispatch(setAuth({ user: updatedProfile, session }))
                  } else {
                    console.log('✅ Using existing profile as-is')
                    dispatch(setAuth({ user: existingProfile, session }))
                  }
                } else {
                  console.log('⚠️ Could not find existing profile by ID')
                  dispatch(setAuth({ user: null, session }))
                }
              } else if (createError.message.includes('users_username_key')) {
                console.log('🔍 Duplicate username error - generating new unique username')
                
                // Generate a new unique username with timestamp
                const newUsername = `${baseUsername}_${Date.now()}`
                const updatedProfileData = { ...profileData, username: newUsername }
                
                console.log('🔄 Retrying profile creation with new username:', newUsername)
                
                const { data: retryProfile, error: retryError } = await supabase
                  .from('users')
                  .insert(updatedProfileData)
                  .select()
                  .single()
                
                if (!retryError && retryProfile) {
                  console.log('✅ Profile created successfully with new username')
                  dispatch(setAuth({ user: retryProfile, session }))
                } else {
                  console.error('❌ Failed to create profile even with new username:', retryError)
                  dispatch(setAuth({ user: null, session }))
                }
              } else {
                console.log('🔍 Other duplicate key error - trying general fallback')
                // Try to find existing profile by email
                const { data: profileByEmail, error: fetchByEmailError } = await supabase
                  .from('users')
                  .select('*')
                  .eq('email', session.user.email || '')
                  .maybeSingle()
                
                if (!fetchByEmailError && profileByEmail) {
                  console.log('✅ Found existing profile by email')
                  dispatch(setAuth({ user: profileByEmail, session }))
                } else {
                  console.log('⚠️ Could not find or create profile, proceeding with session only')
                  dispatch(setAuth({ user: null, session }))
                }
              }
            } else {
              console.log('⚠️ Profile creation failed with non-duplicate error, proceeding with session only')
              dispatch(setAuth({ user: null, session }))
            }
          } else {
            console.log('✅ New user profile created successfully:', {
              id: newProfile.id,
              email: newProfile.email,
              username: newProfile.username
            })
            dispatch(setAuth({ user: newProfile, session }))
            
            // Check if this is an OAuth user and redirect to Map
            if (session.user.user_metadata?.provider === 'google' || session.user.user_metadata?.provider === 'twitter' || session.user.user_metadata?.provider === 'apple') {
              console.log('🗺️ OAuth user detected, navigating to Map screen...')
              setTimeout(() => navigateToMapAfterOAuth(), 500)
            }
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
          
          // Check if this is an OAuth user and redirect to Map
          if (session.user.user_metadata?.provider === 'google' || session.user.user_metadata?.provider === 'twitter' || session.user.user_metadata?.provider === 'apple') {
            console.log('🗺️ OAuth user detected, navigating to Map screen...')
            setTimeout(() => navigateToMapAfterOAuth(), 500)
          }
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

      // Try standard email/password sign-in first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('❌ Email/password sign in error:', error)
        
        if (error.message.includes('Invalid login credentials')) {
          // Check if user exists in our users table (might be OAuth user)
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle()
          
          if (existingUser) {
            console.log('👤 User exists but password failed, trying OAuth passwords...')
            
            // Try OAuth passwords as fallback
            const oauthPasswords = ['google-oauth-user', 'twitter-oauth-user']
            
            for (const oauthPassword of oauthPasswords) {
              const { data: oauthData, error: oauthError } = await supabase.auth.signInWithPassword({
                email,
                password: oauthPassword
              })
              
              if (oauthData?.user && !oauthError) {
                console.log('✅ Successfully signed in with OAuth password')
                return {}
              }
            }
            
            return { error: 'Invalid password. If you signed up with Google or Twitter, please use those sign-in methods.' }
          } else {
            return { error: 'Invalid email or password. Please check your credentials and try again.' }
          }
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
        console.log('✅ Email/password sign in successful')
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

  // Universal user creation/sign-in function - "No Wrong Door" approach
  const createOrSignInUser = async (userInfo: {
    email: string
    name?: string
    avatar?: string
    provider?: 'google' | 'twitter' | 'apple' | 'email'
    username?: string
    twitterData?: any
  }) => {
    try {
      console.log('🚪 Universal sign-in for:', userInfo.email, 'via', userInfo.provider)
      
      // Step 1: Check if user exists in our users table
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userInfo.email)
        .maybeSingle()

      if (existingUser) {
        console.log('👤 Existing user found, signing them in...')
        
        // Try multiple auth methods to sign them in
        const authMethods = [
          `${userInfo.provider}-oauth-user`,
          'google-oauth-user',
          'twitter-oauth-user',
          'apple-oauth-user',
          'password',
          userInfo.email,
          '123456'
        ]
        
        let authSuccess = false
        let authUser = null
        
        for (const password of authMethods) {
          try {
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
              email: userInfo.email,
              password: password
            })
            
            if (authData?.user && !signInError) {
              console.log(`✅ Successfully signed in with password method`)
              authSuccess = true
              authUser = authData.user
              break
            }
          } catch (error) {
            // Continue to next method
            continue
          }
        }
        
        // If no existing auth worked, create new auth user
        if (!authSuccess) {
          console.log('🆕 Creating new auth user for existing profile...')
          const { data: newAuthData, error: authError } = await supabase.auth.signUp({
            email: userInfo.email,
            password: `${userInfo.provider}-oauth-user`,
            options: {
              data: {
                name: userInfo.name,
                picture: userInfo.avatar,
                provider: userInfo.provider
              }
            }
          })
          
          if (newAuthData?.user && !authError) {
            authSuccess = true
            authUser = newAuthData.user
          } else if (authError?.message.includes('User already registered')) {
            // Try to sign in with the new password
            const { data: retryAuth, error: retryError } = await supabase.auth.signInWithPassword({
              email: userInfo.email,
              password: `${userInfo.provider}-oauth-user`
            })
            
            if (retryAuth?.user && !retryError) {
              authSuccess = true
              authUser = retryAuth.user
            }
          }
        }
        
        if (authSuccess && authUser) {
          // Update existing profile with latest info
          await supabase
            .from('users')
            .update({
              display_name: userInfo.name || existingUser.display_name,
              avatar: userInfo.avatar || existingUser.avatar,
              last_active: new Date().toISOString(),
              is_online: true,
              ...(userInfo.twitterData && {
                bio: `Twitter user @${userInfo.twitterData.username} - ${existingUser.bio || ''}`.substring(0, 255)
              })
            })
            .eq('id', existingUser.id)
          
          console.log('✅ Existing user signed in and updated')
          
          // Navigate to Map if OAuth user
          if (userInfo.provider === 'google' || userInfo.provider === 'twitter' || userInfo.provider === 'apple') {
            console.log('🗺️ OAuth user signed in, navigating to Map screen...')
            setTimeout(() => navigateToMapAfterOAuth(), 1000)
          }
          
          return { success: true }
        } else {
          return { error: 'Failed to authenticate existing user. Please try email/password sign-in.' }
        }
      } else {
        // Step 2: New user - create both auth user and profile
        console.log('🆕 Creating new user account...')
        
        // Generate unique username
        let username = userInfo.username
        if (!username) {
          const baseUsername = userInfo.provider === 'twitter' 
            ? `tw_${userInfo.twitterData?.username || 'user'}`
            : userInfo.provider === 'google'
            ? userInfo.name?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'google_user'
            : userInfo.provider === 'apple'
            ? userInfo.name?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'apple_user'
            : userInfo.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')
          
          username = baseUsername
          let attempt = 0
          let usernameExists = true
          
          while (usernameExists && attempt < 10) {
            const { data: existingUsername } = await supabase
              .from('users')
              .select('username')
              .eq('username', username)
              .maybeSingle()
            
            if (!existingUsername) {
              usernameExists = false
            } else {
              attempt++
              username = `${baseUsername}_${attempt}`
            }
          }
          
          if (usernameExists) {
            username = `${baseUsername}_${Date.now()}`
          }
        }
        
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userInfo.email,
          password: `${userInfo.provider}-oauth-user`,
          options: {
            data: {
              name: userInfo.name,
              picture: userInfo.avatar,
              provider: userInfo.provider,
              username: username
            }
          }
        })
        
        if (authError) {
          if (authError.message.includes('User already registered')) {
            // Auth user exists, try to sign them in
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: userInfo.email,
              password: `${userInfo.provider}-oauth-user`
            })
            
            if (signInData?.user && !signInError) {
              console.log('✅ Signed in existing auth user')
              // Continue to profile creation below
            } else {
              return { error: `Failed to authenticate: ${signInError?.message || 'Unknown error'}` }
            }
          } else {
            return { error: `Account creation failed: ${authError.message}` }
          }
        }
        
        // Get current session to ensure we have the auth user
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          return { error: 'Failed to create user session' }
        }
        
        // Create user profile
        const profileData = {
          id: session.user.id,
          email: userInfo.email,
          username: username,
          display_name: userInfo.name || 'User',
          avatar: userInfo.avatar || null,
          bio: userInfo.twitterData ? `Twitter user @${userInfo.twitterData.username}` : null,
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
        
        const { error: profileError } = await supabase
          .from('users')
          .insert(profileData)
        
        if (profileError && profileError.code !== '23505') {
          console.error('❌ Failed to create user profile:', profileError)
          return { error: `Failed to create user profile: ${profileError.message}` }
        }
        
        console.log('✅ New user created successfully')
        
        // Navigate to Map if OAuth user
        if (userInfo.provider === 'google' || userInfo.provider === 'twitter' || userInfo.provider === 'apple') {
          console.log('🗺️ New OAuth user created, navigating to Map screen...')
          setTimeout(() => navigateToMapAfterOAuth(), 1000)
        }
        
        return { success: true }
      }
    } catch (error) {
      console.error('❌ Universal sign-in error:', error)
      return { error: 'An unexpected error occurred during sign-in' }
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Starting Google Sign In process...')
      dispatch(setLoading(true))

      // Always configure Google Sign-In for development
      const configured = await GoogleSignInService.configure()
      if (!configured) {
        console.log('❌ Google Sign-In configuration failed')
        return { error: 'Google Sign-In is not properly configured' }
      }

      console.log('✅ Google Sign-In configured, attempting sign in...')
      const result = await GoogleSignInService.signIn() as any

      if (result.error) {
        console.log('❌ Google Sign-In failed:', result.error)
        return { error: result.error }
      }

      if (!result.user) {
        console.log('❌ No user data from Google Sign-In')
        return { error: 'No user information received from Google' }
      }

      console.log('✅ Google Sign-In successful, processing user...', {
        email: result.user.email,
        name: result.user.name,
        hasPhoto: !!result.user.photo
      })

      // Create or sign in user with Google data
      const authResult = await createOrSignInUser({
        email: result.user.email || '',
        name: result.user.name || '',
        avatar: result.user.photo || undefined,
        provider: 'google'
      })

      if (authResult.error) {
        console.log('❌ User creation/sign-in failed:', authResult.error)
        return { error: authResult.error }
      }

      console.log('✅ Google Sign-In and user processing complete')
      
      // Navigate to Map screen after successful Google OAuth
      setTimeout(() => navigateToMapAfterOAuth(), 500)
      
      return {}
    } catch (error) {
      console.error('❌ Google Sign In error:', error)
      return { error: 'An unexpected error occurred with Google Sign In' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const signInWithTwitter = async () => {
    try {
      console.log('🐦 Starting Twitter Sign In process...')
      dispatch(setLoading(true))

      // Configure Twitter Sign-In
      const configured = TwitterSignInService.configure()
      if (!configured) {
        console.log('❌ Twitter Sign-In configuration failed')
        return { error: 'Twitter Sign-In is not properly configured' }
      }

      console.log('✅ Twitter Sign-In configured, attempting sign in...')
      const result = await TwitterSignInService.signIn()

      if (!result.success || result.error) {
        console.log('❌ Twitter Sign-In failed:', result.error)
        return { error: result.error || 'Twitter Sign-In failed' }
      }

      if (!result.user) {
        console.log('❌ No user data from Twitter Sign-In')
        return { error: 'No user information received from Twitter' }
      }

      console.log('✅ Twitter Sign-In successful, processing user...', {
        username: result.user.username,
        name: result.user.name,
        id: result.user.id
      })

      // Create or sign in user with Twitter data
      const authResult = await createOrSignInUser({
        email: result.user.email || `${result.user.username}@twitter.placeholder`,
        name: result.user.name || result.user.username,
        avatar: result.user.profile_image_url || undefined,
        provider: 'twitter',
        username: result.user.username,
        twitterData: result.user
      })

      if (authResult.error) {
        console.log('❌ User creation/sign-in failed:', authResult.error)
        return { error: authResult.error }
      }

      console.log('✅ Twitter Sign-In and user processing complete')
      
      // Navigate to Map screen after successful Twitter OAuth
      setTimeout(() => navigateToMapAfterOAuth(), 500)
      
      return {}
    } catch (error) {
      console.error('❌ Twitter Sign In error:', error)
      return { error: 'An unexpected error occurred with Twitter Sign In' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const signInWithApple = async () => {
    try {
      console.log('🍎 Starting Apple Sign In process...')
      dispatch(setLoading(true))

      // Check if Apple Sign In is available
      const available = await AppleSignInService.isAvailable()
      if (!available) {
        console.log('❌ Apple Sign-In not available')
        return { error: 'Apple Sign In is not available on this device. Please use iOS 13+ or macOS 10.15+.' }
      }

      console.log('✅ Apple Sign-In available, attempting sign in...')
      const result = await AppleSignInService.signIn()

      if (result.error) {
        console.log('❌ Apple Sign-In failed:', result.error)
        return { error: result.error }
      }

      if (!result.user) {
        console.log('❌ No user data from Apple Sign-In')
        return { error: 'No user information received from Apple' }
      }

      console.log('✅ Apple Sign-In successful, processing user...', {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        hasIdentityToken: !!result.identityToken
      })

      // Handle case where Apple hides the email (subsequent sign-ins)
      let userEmail = result.user.email
      if (!userEmail) {
        // For users who chose to hide their email, we need to use their Apple ID
        // We'll create a placeholder email based on their Apple ID
        userEmail = `${result.user.id}@privaterelay.appleid.com`
        console.log('⚠️ Apple email hidden, using Apple ID as email:', userEmail)
      }

      // Create or sign in user with Apple data
      const authResult = await createOrSignInUser({
        email: userEmail,
        name: result.user.name || 'Apple User',
        avatar: undefined, // Apple doesn't provide profile photos
        provider: 'apple'
      })

      if (authResult.error) {
        console.log('❌ User creation/sign-in failed:', authResult.error)
        return { error: authResult.error }
      }

      console.log('✅ Apple Sign-In and user processing complete')
      
      // Navigate to Map screen after successful Apple OAuth
      setTimeout(() => navigateToMapAfterOAuth(), 500)
      
      return {}
    } catch (error) {
      console.error('❌ Apple Sign In error:', error)
      return { error: 'An unexpected error occurred with Apple Sign In' }
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
    signInWithApple,
    signOut,
    resetPassword,
    enableGoogleSignIn,
    updateProfile,
    refreshUser,
    testConnection,
    linkTwitterAccount,
    clearSession,
    setNavigationRef,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 