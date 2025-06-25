import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useAppSelector } from '../store'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

// Import screens
import AuthScreen from '../screens/AuthScreen'
import HomeScreen from '../screens/HomeScreen'
import CameraScreen from '../screens/CameraScreen'
import MapScreen from '../screens/MapScreen'
import ProfileScreen from '../screens/ProfileScreen'
import LocationSettingsScreen from '../screens/LocationSettingsScreen'
import HomeLocationSettingsScreen from '../screens/HomeLocationSettingsScreen'
import UserSearchScreen from '../screens/UserSearchScreen'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

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
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline'
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
        name="Friends" 
        component={UserSearchScreen}
        options={{
          headerShown: false, // Hide header for custom gradient design
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
      colors={['#1e1b4b', '#312e81', '#6366f1']}
      style={styles.loadingContainer}
    >
      <View style={styles.logoContainer}>
        {/* TribeFind Logo/Icon */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🎯</Text>
        </View>
        
        {/* Brand Name */}
        <Text style={styles.brandName}>TribeFind</Text>
        <Text style={styles.brandTagline}>Find Your Tribe Through Shared Interests</Text>
      </View>

      {/* Loading Indicator */}
      <View style={styles.loadingIndicator}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Loading your tribe...</Text>
      </View>

      {/* Bottom Branding */}
      <View style={styles.bottomBranding}>
        <Text style={styles.poweredBy}>Built with AI-First Principles</Text>
        <Text style={styles.engineeringBy}>EnginDearing.soy</Text>
      </View>
    </LinearGradient>
  )
}

export default function Navigation() {
  const { isAuthenticated, loading, user } = useAppSelector((state) => state.auth)

  if (loading) {
    return <TribeFindLoadingScreen />
  }

  return (
    <NavigationContainer>
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
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 3,
    borderColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoIcon: {
    fontSize: 50,
    textAlign: 'center',
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