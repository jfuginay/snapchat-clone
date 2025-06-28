import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import { store } from './store'
import { AuthProvider } from './services/AuthService'
import { GoogleSignInService } from './services/GoogleSignInService'
import { TwitterSignInService } from './services/TwitterSignInService'
import Navigation from './navigation'

export default function App() {
  useEffect(() => {
    console.log('🚀 TribeFind starting up...')
    console.log('🔧 Environment variables check:')
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'development')
    console.log('- EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Loaded' : '❌ Missing (using fallback)')
    console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing (using fallback)')
    console.log('- Using fallbacks:', process.env.NODE_ENV === 'development' ? '❌ No (development mode)' : '✅ Yes (production mode)')
    
    // Initialize authentication services
    const initializeServices = async () => {
      try {
        console.log('🔧 Initializing authentication services...')
        
        // Check if Google Sign-In is available (development build vs Expo Go)
        const googleAvailable = GoogleSignInService.isAvailable()
        if (googleAvailable) {
          // Configure Google Sign In (only in development builds)
          const googleConfigured = await GoogleSignInService.configure()
          if (googleConfigured) {
            console.log('✅ Google Sign In configured successfully')
          } else {
            console.log('⚠️ Google Sign In configuration failed')
          }
        } else {
          console.log('📱 Google Sign In not available (Expo Go mode)')
          console.log('   This is normal when running in Expo Go')
          console.log('   Email/password authentication will work perfectly!')
        }
        
        // Configure Twitter Sign In (works in both Expo Go and development builds)
        try {
          TwitterSignInService.configure()
          console.log('✅ Twitter Sign In configured')
        } catch (twitterError) {
          console.log('⚠️ Twitter Sign In configuration failed:', twitterError)
        }
        
        console.log('🎉 Authentication services initialization complete')
        console.log('📱 App ready for demo and testing!')
      } catch (error) {
        console.error('❌ Authentication service initialization failed:', error)
        console.log('   App will continue to work with basic email/password authentication')
      }
    }
    
    initializeServices()
  }, [])

  return (
    <Provider store={store}>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </Provider>
  )
}
