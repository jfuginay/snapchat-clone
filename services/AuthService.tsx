import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { supabase, User, testSupabaseConnection } from '../lib/supabase'
import { useAppDispatch, useAppSelector } from '../store'
import { setAuth, setLoading, clearAuth, updateUser } from '../store/authSlice'
import { Session } from '@supabase/supabase-js'
import { GoogleSignInService } from './GoogleSignInService'

interface AuthContextType {
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  signOut: () => Promise<{ error?: string }>
  resetPassword: (email: string) => Promise<{ error?: string }>
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

    return () => {
      subscription.unsubscribe()
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

  const signIn = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true))

      // Test connection first
      const isConnected = await testSupabaseConnection()
      if (!isConnected) {
        return { error: 'Cannot connect to server. Please check your internet connection.' }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
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
      console.error('Sign in error:', error)
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
        return { error: 'Network error. Please check your internet connection.' }
      }
      return { error: 'An unexpected error occurred' }
    } finally {
      dispatch(setLoading(false))
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Starting Google Sign In...')
      dispatch(setLoading(true))

      // Test connection first
      const isConnected = await testSupabaseConnection()
      if (!isConnected) {
        return { error: 'Cannot connect to server. Please check your internet connection.' }
      }

      // Configure Google Sign In if not already configured
      await GoogleSignInService.configure()

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
          console.log('👤 Existing user found, signing in...')
          
          // Try to sign in with the standard Google OAuth password
          const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email: result.user.email,
            password: 'google-oauth-user'
          })

          if (signInError) {
            if (signInError.message.includes('Invalid login credentials')) {
              console.log('🔄 User exists but needs Google auth setup...')
              // User profile exists but auth user doesn't - this can happen with manual DB entries
              // We need to handle this case by updating the existing user's auth
              
              // First, try to get the current session to see if we can update the auth user
              const { data: currentUser } = await supabase.auth.getUser()
              
              if (!currentUser.user) {
                // No current auth user, so we need to create one for this existing profile user
                console.log('🆕 Creating auth user for existing profile...')
                
                // Since the profile exists, we'll sign them in by creating the auth user
                const { data: newAuthData, error: createAuthError } = await supabase.auth.signUp({
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
                
                if (createAuthError) {
                  if (createAuthError.message.includes('User already registered')) {
                    // Auth user exists but password is different - this shouldn't happen but let's handle it
                    console.log('⚠️ Auth user exists with different credentials')
                    return { error: 'Account exists with different sign-in method. Please use email/password or contact support.' }
                  }
                  console.error('❌ Error creating auth user for existing profile:', createAuthError)
                  return { error: 'Failed to authenticate with Google account' }
                }
                
                // Update the existing profile with the new auth user ID if needed
                if (newAuthData.user && newAuthData.user.id !== existingUser.id) {
                  console.log('🔄 Updating profile with new auth user ID...')
                  await supabase
                    .from('users')
                    .update({ 
                      id: newAuthData.user.id,
                      auth_provider: 'google',
                      avatar: result.user.photo || existingUser.avatar,
                      display_name: result.user.name || existingUser.display_name
                    })
                    .eq('id', existingUser.id)
                }
              }
            } else {
              console.error('❌ Unexpected sign-in error:', signInError)
              return { error: 'Failed to authenticate with Google account' }
            }
          } else {
            console.log('✅ Successfully signed in existing Google user')
          }
        } else {
          console.log('🆕 New user, creating account...')
          
          // Generate username from email
          const emailUsername = result.user.email.split('@')[0]
          const timestamp = Date.now().toString().slice(-4)
          const username = `${emailUsername}_${timestamp}`

          // Create new auth user
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
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

          if (signUpError) {
            console.error('❌ Error creating new user:', signUpError)
            return { error: 'Failed to create account with Google' }
          }

          if (authData.user) {
            // Create user profile
            const profileData = {
              id: authData.user.id,
              email: result.user.email,
              username: username,
              display_name: result.user.name || emailUsername,
              avatar: result.user.photo || '👤',
              bio: '',
              snap_score: 0,
              last_active: new Date().toISOString(),
              is_online: true,
              auth_provider: 'google',
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

            if (profileError) {
              console.error('❌ Error creating user profile:', profileError)
              return { error: 'Failed to create user profile' }
            }
          }
        }

        console.log('✅ Google Sign In and user processing complete')
        return {}
      }

      return { error: 'Google Sign In failed. Please try again.' }
    } catch (error) {
      console.error('Google Sign In error:', error)
      return { error: 'An unexpected error occurred during Google Sign In' }
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

  const testConnection = async (): Promise<boolean> => {
    return await testSupabaseConnection()
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
    signOut,
    resetPassword,
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