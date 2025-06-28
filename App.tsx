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
    console.log('Environment check:')
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set')
    console.log('- EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing (using fallback)')
    console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing (using fallback)')
    console.log('- EXPO_PUBLIC_TWITTER_CLIENT_ID:', process.env.EXPO_PUBLIC_TWITTER_CLIENT_ID ? 'Present' : 'Missing (using fallback)')
    
    // Initialize authentication services
    const initializeServices = async () => {
      try {
        // Configure Google Sign In
        await GoogleSignInService.configure()
        console.log('✅ Google Sign In configured')
        
        // Configure Twitter Sign In
        TwitterSignInService.configure()
        console.log('✅ Twitter Sign In configured')
        
        console.log('🎉 All authentication services initialized successfully')
      } catch (error) {
        console.error('❌ Authentication service initialization failed:', error)
        // Don't crash the app, just log the error
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
