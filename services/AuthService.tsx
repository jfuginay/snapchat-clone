import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { supabase, User, testSupabaseConnection } from '../lib/supabase'
import { useAppDispatch, useAppSelector } from '../store'
import { setAuth, setLoading, clearAuth, updateUser } from '../store/authSlice'
import { Session } from '@supabase/supabase-js'

interface AuthContextType {
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<{ error?: string }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  updateProfile: (updates: Partial<User>) => Promise<{ error?: string }>
  refreshUser: () => Promise<void>
  testConnection: () => Promise<boolean>
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
      console.log('Auth state change:', event, session?.user?.email)
      handleAuthStateChange(session)
    })

    return () => subscription.unsubscribe()
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
          console.log('User profile not found - creating basic profile for authenticated user')
          
          // Create a basic user profile for users who have auth but no profile
          try {
            const { error: createError } = await supabase
              .from('users')
              .upsert({
                id: session.user.id,
                email: session.user.email || '',
                username: session.user.email?.split('@')[0] || `user_${session.user.id.substring(0, 8)}`,
                display_name: session.user.email?.split('@')[0] || 'User',
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

  const value = {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshUser,
    testConnection,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 