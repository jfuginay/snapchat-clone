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

  const { signIn, signUp } = useAuth()

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
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoEmoji}>🎯</Text>
                <View style={styles.logoTextContainer}>
                  <Text style={styles.logoText}>TribeFind</Text>
                  <Text style={styles.logoSubtext}>Find Your Tribe</Text>
                </View>
              </View>
              
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeTitle}>
                  {isSignUp ? 'Join the Tribe' : 'Welcome Back'}
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  {isSignUp 
                    ? 'Connect with people who share your passions'
                    : 'Ready to discover your tribe?'
                  }
                </Text>
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              <View style={styles.form}>
                {isSignUp && (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Username</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Choose your username"
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
                        placeholder="What should we call you?"
                        placeholderTextColor="#A0A0A0"
                        value={displayName}
                        onChangeText={setDisplayName}
                        autoCorrect={false}
                      />
                    </View>
                  </>
                )}
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="#A0A0A0"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Create a secure password"
                    placeholderTextColor="#A0A0A0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.authButton, loading && styles.authButtonDisabled]}
                  onPress={handleAuth}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={loading ? ['#999', '#666'] : ['#FF6B6B', '#4ECDC4']}
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoEmoji: {
    fontSize: 48,
    marginRight: 12,
  },
  logoTextContainer: {
    alignItems: 'flex-start',
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  logoSubtext: {
    fontSize: 16,
    color: '#F0F0F0',
    fontWeight: '500',
    marginTop: 2,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#F0F0F0',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 28,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  authButton: {
    marginTop: 12,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  authButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  switchText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
  switchTextBold: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  aiFooter: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    marginHorizontal: 20,
  },
  aiFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  engineeringText: {
    fontSize: 13,
    color: '#F0F0F0',
    marginBottom: 2,
    textAlign: 'center',
  },
  taglineText: {
    fontSize: 12,
    color: '#E0E0E0',
    fontStyle: 'italic',
    textAlign: 'center',
  },
}) 