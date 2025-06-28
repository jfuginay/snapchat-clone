import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// Environment variables with fallbacks for standalone builds
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rfvlxtzjtcaxkxisyuys.supabase.co'
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdmx4dHpqdGNheGt4aXN5dXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3Nzg3NDgsImV4cCI6MjA2NjM1NDc0OH0.OrN9YGA5rzcC1mUjxd2maeAUFmnx9VixMgnm_LdLIVM'

// Debug environment variables loading
console.log('🔧 Environment variables check:')
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set')
console.log('- EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Loaded' : '❌ Missing')
console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Loaded' : '❌ Missing')
console.log('- Using fallbacks:', !process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Yes (standalone mode)' : '❌ No (development mode)')

// Debug actual values (first/last 10 characters for security)
console.log('🔍 Supabase URL value:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...${supabaseUrl.substring(supabaseUrl.length - 10)}` : 'MISSING')
console.log('🔍 Supabase Key value:', supabaseKey ? `${supabaseKey.substring(0, 20)}...${supabaseKey.substring(supabaseKey.length - 10)}` : 'MISSING')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('This should not happen in standalone builds due to fallbacks.')
  console.error('If you see this error, check your EAS build configuration.')
  throw new Error('Missing Supabase environment variables. Check your EAS build configuration.')
}

console.log('🚀 Creating Supabase client with URL and key...')

export const supabase = createClient(supabaseUrl, supabaseKey, {
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
      'x-my-custom-header': 'tribefind',
      'x-client-info': 'tribefind-mobile',
    },
    fetch: (url, options = {}) => {
      // Custom fetch with mobile-optimized timeouts and retries
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const fetchWithRetry = async (retryCount = 0): Promise<Response> => {
        try {
          console.log(`🌐 Network request attempt ${retryCount + 1}:`, url)
          
          // Debug headers for API key issues
          const finalHeaders = {
            ...options.headers,
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
          
          console.log('📡 Request headers:', Object.keys(finalHeaders))
          console.log('📡 Has apikey header:', finalHeaders.hasOwnProperty('apikey'))
          console.log('📡 Has Authorization header:', finalHeaders.hasOwnProperty('Authorization'))
          
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: finalHeaders,
          })
          
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            console.log(`⚠️ Response not OK (${response.status}):`, response.statusText)
          } else {
            console.log(`✅ Network request successful:`, response.status)
          }
          
          return response
        } catch (error: any) {
          clearTimeout(timeoutId)
          
          console.log(`❌ Network error (attempt ${retryCount + 1}):`, error.message)
          
          // Retry logic for mobile networks
          if (retryCount < 3 && (
            error.name === 'AbortError' ||
            error.message.includes('network') ||
            error.message.includes('timeout') ||
            error.message.includes('fetch')
          )) {
            console.log(`🔄 Retrying in ${(retryCount + 1) * 1000}ms...`)
            await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000))
            return fetchWithRetry(retryCount + 1)
          }
          
          throw error
        }
      }
      
      return fetchWithRetry()
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

// Test Supabase connection with robust mobile network handling
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing Supabase connection with mobile-optimized settings...')
    
    // Simple query with timeout
    const startTime = Date.now()
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    const duration = Date.now() - startTime
    console.log(`⏱️ Connection test took ${duration}ms`)
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    return true
  } catch (error: any) {
    console.error('❌ Supabase connection error:', error.message)
    
    // Provide specific guidance based on error type
    if (error.message.includes('AbortError') || error.message.includes('timeout')) {
      console.error('💡 Network timeout - check your internet connection')
    } else if (error.message.includes('network')) {
      console.error('💡 Network error - try switching between WiFi and cellular')
    } else if (error.message.includes('fetch')) {
      console.error('💡 Fetch error - network request failed')
    }
    
    return false
  }
} 