import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import { store } from './store'
import { AuthProvider } from './services/AuthService'
import { GoogleSignInService } from './services/GoogleSignInService'
import Navigation from './navigation'

export default function App() {
  useEffect(() => {
    console.log('🚀 App starting up...')
    console.log('Environment check:')
    console.log('- NODE_ENV:', process.env.NODE_ENV)
    console.log('- EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing')
    console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing')
    
    // Initialize Google Sign In
    GoogleSignInService.configure()
      .then(() => console.log('✅ Google Sign In configured'))
      .catch(error => console.error('❌ Google Sign In configuration failed:', error))
  }, [])

  return (
    <Provider store={store}>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </Provider>
  )
}
