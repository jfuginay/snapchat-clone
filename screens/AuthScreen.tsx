import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../services/AuthService'

const { width, height } = Dimensions.get('window')

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, signUp, clearSession } = useAuth()

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (isSignUp && (!username || !displayName)) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      let result
      if (isSignUp) {
        result = await signUp(email, password, username, displayName)
      } else {
        result = await signIn(email, password)
      }

      if (result.error) {
        Alert.alert('Authentication Error', result.error)
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.appTitle}>TribeFind</Text>
              <Text style={styles.subtitle}>
                {isSignUp ? 'Join your tribe' : 'Welcome back'}
              </Text>
              <Text style={styles.description}>
                Discover and connect with people who share your interests and activities
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              <View style={styles.form}>
                <Text style={styles.formTitle}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>

                {/* Sign Up Fields */}
                {isSignUp && (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Username</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Choose a unique username"
                        placeholderTextColor="#A0A0A0"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Display Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="How should we call you?"
                        placeholderTextColor="#A0A0A0"
                        value={displayName}
                        onChangeText={setDisplayName}
                        autoCorrect={false}
                      />
                    </View>
                  </>
                )}

                {/* Email Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email address"
                    placeholderTextColor="#A0A0A0"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={isSignUp ? "Create a secure password" : "Enter your password"}
                    placeholderTextColor="#A0A0A0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCorrect={false}
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.authButton, loading && styles.authButtonDisabled]}
                  onPress={handleAuth}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={loading ? ['#999', '#666'] : ['#8b5cf6', '#6366f1']}
                    style={styles.authButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.authButtonText}>
                      {loading ? 'Connecting...' : isSignUp ? 'Join TribeFind' : 'Enter TribeFind'}
                    </Text>
                    {!loading && (
                      <Text style={styles.authButtonIcon}>
                        {isSignUp ? '🚀' : '✨'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Switch Auth Mode */}
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setIsSignUp(!isSignUp)}
                >
                  <Text style={styles.switchText}>
                    {isSignUp
                      ? 'Already part of the tribe? '
                      : 'New to TribeFind? '}
                    <Text style={styles.switchTextBold}>
                      {isSignUp ? 'Sign In' : 'Join Now'}
                    </Text>
                  </Text>
                </TouchableOpacity>

                {/* Note about social linking */}
                <Text style={styles.socialNote}>
                  💡 You can link your social accounts after signing in
                </Text>

                {/* Clear Session Button (for debugging/fresh start) */}
                <TouchableOpacity
                  style={styles.clearSessionButton}
                  onPress={async () => {
                    const result = await clearSession()
                    if (!result.error) {
                      Alert.alert('Session Cleared', 'All sessions have been cleared. You can now create a new account or sign in fresh.')
                    }
                  }}
                >
                  <Text style={styles.clearSessionText}>Clear All Sessions</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer Section */}
            <View style={styles.footer}>
              <View style={styles.aiFooter}>
                <Text style={styles.aiFooterText}>🤖 Built with AI-First Principles</Text>
                <Text style={styles.engineeringText}>Engineered at EnginDearing.soy</Text>
                <Text style={styles.taglineText}>Where innovation meets community</Text>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    color: '#E0E7FF',
    marginBottom: 8,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#C7D2FE',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  authButton: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  authButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  authButtonIcon: {
    fontSize: 20,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  switchText: {
    fontSize: 16,
    color: '#6B7280',
  },
  switchTextBold: {
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  socialNote: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  aiFooter: {
    alignItems: 'center',
    marginTop: 20,
  },
  aiFooterText: {
    fontSize: 14,
    color: '#E0E7FF',
    fontWeight: '600',
    marginBottom: 4,
  },
  engineeringText: {
    fontSize: 12,
    color: '#C7D2FE',
    marginBottom: 2,
  },
  taglineText: {
    fontSize: 11,
    color: '#A5B4FC',
    fontStyle: 'italic',
  },
  clearSessionButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  clearSessionText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
}) 