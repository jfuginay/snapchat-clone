import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// Use environment variables (no fallbacks for security)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// Debug environment variables loading
console.log('🔧 Environment variables check:')
console.log('- EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Loaded' : '❌ Missing')
console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Loaded' : '❌ Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Make sure your .env file exists and contains:')
  console.error('EXPO_PUBLIC_SUPABASE_URL=your-url')
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key')
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-my-custom-header': 'snapchat-clone',
    },
  },
})

// Database table types
export interface User {
  id: string
  email: string
  display_name: string
  username: string
  avatar: string
  bio: string
  snap_score: number
  joined_at: string
  last_active: string
  is_online: boolean
  auth_provider?: string
  profile_complete?: boolean
  social_accounts?: {
    twitter?: {
      id: string
      username: string
      name: string
      verified: boolean
      avatar_url?: string
    }
  }
  settings: {
    share_location: boolean
    allow_friend_requests: boolean
    show_online_status: boolean
    allow_message_from_strangers: boolean
    ghost_mode: boolean
    privacy_level: string
    notifications: {
      push_enabled: boolean
      location_updates: boolean
      friend_requests: boolean
      messages: boolean
    }
  }
  stats: {
    snaps_shared: number
    friends_count: number
    stories_posted: number
  }
  location?: {
    latitude: number
    longitude: number
    timestamp: string
  }
}

export interface Location {
  id: string
  user_id: string
  latitude: number
  longitude: number
  timestamp: string
  accuracy?: number
  heading?: number
  speed?: number
}

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }
    console.log('Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase connection error:', error)
    return false
  }
} 