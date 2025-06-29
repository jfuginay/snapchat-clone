import React, { useRef, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useAppSelector } from '../store'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../services/AuthService'
import TribeFindLogo from '../components/TribeFindLogo'

// Import screens
import AuthScreen from '../screens/AuthScreen'
import HomeScreen from '../screens/HomeScreen'
import CameraScreen from '../screens/CameraScreen'
import MapScreen from '../screens/MapScreen'
import ProfileScreen from '../screens/ProfileScreen'
import LocationSettingsScreen from '../screens/LocationSettingsScreen'
import HomeLocationSettingsScreen from '../screens/HomeLocationSettingsScreen'
import ActivitiesScreen from '../screens/ActivitiesScreen'
import UserSearchScreen from '../screens/UserSearchScreen'
import ChatListScreen from '../screens/ChatListScreen'
import ChatScreen from '../screens/ChatScreen'
import AIChatScreen from '../screens/AIChatScreen'
import SubscriptionScreen from '../screens/SubscriptionScreen'

// Import types
import { RootStackParamList, TabParamList } from '../types/navigation'

const Stack = createStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home'

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'Camera') {
            iconName = focused ? 'camera' : 'camera-outline'
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarStyle: {
          backgroundColor: '#1e1b4b',
          borderTopColor: '#312e81',
        },
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTitleStyle: {
          color: '#000',
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{
          headerShown: false, // Hide header for camera for full screen experience
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatListScreen}
        options={{
          title: 'Tribe Chat',
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTitleStyle: {
            color: '#fff',
            fontWeight: 'bold',
          },
          headerTintColor: '#fff',
        }}
      />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

// Branded Loading Screen Component
function TribeFindLoadingScreen() {
  return (
    <LinearGradient
      colors={['#1a2f1a', '#2d5f3f', '#4a7c59', '#6366f1']}
      style={styles.loadingContainer}
    >
      <View style={styles.logoContainer}>
        {/* TribeFIND Logo */}
        <TribeFindLogo size={140} style={styles.logo} />
        
        {/* Brand Name */}
        <Text style={styles.brandName}>TribeFIND</Text>
        <Text style={styles.brandTagline}>Find Interests • Nurture Discovery</Text>
      </View>

      {/* Loading Indicator */}
      <View style={styles.loadingIndicator}>
        <ActivityIndicator size="large" color="#a78bfa" />
        <Text style={styles.loadingText}>Connecting to your network...</Text>
      </View>

      {/* Bottom Branding */}
      <View style={styles.bottomBranding}>
        <Text style={styles.poweredBy}>AI-Powered Social Discovery</Text>
        <Text style={styles.engineeringBy}>Built with ❤️ by EnginDearing</Text>
      </View>
    </LinearGradient>
  )
}

export default function Navigation() {
  const { isAuthenticated, loading, user } = useAppSelector((state) => state.auth)
  const { setNavigationRef } = useAuth()
  const navigationRef = useRef(null)

  // Set up navigation ref for OAuth redirects
  useEffect(() => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef)
    }
  }, [setNavigationRef])

  if (loading) {
    return <TribeFindLoadingScreen />
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated && user ? (
          // User is authenticated - show main app
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen 
              name="LocationSettings" 
              component={LocationSettingsScreen}
              options={{
                headerShown: true,
                title: 'Location Settings',
                headerStyle: {
                  backgroundColor: '#6366f1',
                },
                headerTitleStyle: {
                  color: '#fff',
                  fontWeight: 'bold',
                },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen 
              name="HomeLocationSettings" 
              component={HomeLocationSettingsScreen}
              options={{
                headerShown: true,
                title: 'Home Location',
                headerStyle: {
                  backgroundColor: '#6366f1',
                },
                headerTitleStyle: {
                  color: '#fff',
                  fontWeight: 'bold',
                },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen 
              name="Activities" 
              component={ActivitiesScreen}
              options={{
                presentation: 'modal',
                headerShown: false, // Using custom header in the component
              }}
            />
            <Stack.Screen 
              name="UserSearch" 
              component={UserSearchScreen}
              options={{
                headerShown: true,
                title: 'Find Friends',
                headerStyle: {
                  backgroundColor: '#6366f1',
                },
                headerTitleStyle: {
                  color: '#fff',
                  fontWeight: 'bold',
                },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen 
              name="ChatScreen" 
              component={ChatScreen}
              options={{
                headerShown: false, // Using custom header in the component
              }}
            />
            <Stack.Screen 
              name="AIChatScreen" 
              component={AIChatScreen}
              options={{
                headerShown: true,
                headerTitle: 'AI Assistant',
                headerStyle: { backgroundColor: '#6366f1' },
                headerTintColor: 'white',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen 
              name="SubscriptionScreen" 
              component={SubscriptionScreen}
              options={{
                headerShown: true,
                headerTitle: 'Upgrade',
                headerStyle: { backgroundColor: '#6366f1' },
                headerTintColor: 'white',
                headerTitleStyle: { fontWeight: 'bold' },
                presentation: 'modal',
              }}
            />
          </>
        ) : (
          // User is not authenticated - show auth screen
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    marginBottom: 30,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  brandName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 16,
    color: '#C4B5FD',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  loadingIndicator: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#DDD6FE',
    marginTop: 15,
    fontWeight: '500',
  },
  bottomBranding: {
    alignItems: 'center',
  },
  poweredBy: {
    fontSize: 12,
    color: '#A78BFA',
    marginBottom: 4,
    fontWeight: '500',
  },
  engineeringBy: {
    fontSize: 11,
    color: '#8B5CF6',
    fontStyle: 'italic',
  },
}); 