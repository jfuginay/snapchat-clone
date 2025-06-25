import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useAppSelector } from '../store'

// Import screens
import AuthScreen from '../screens/AuthScreen'
import ProfileSetupScreen from '../screens/ProfileSetupScreen'
import CameraScreen from '../screens/CameraScreen'
import MapScreen from '../screens/MapScreen'
import ProfileScreen from '../screens/ProfileScreen'
import HomeScreen from '../screens/HomeScreen'
import UserSearchScreen from '../screens/UserSearchScreen'
import LocationSettingsScreen from '../screens/LocationSettingsScreen'
import HomeLocationSettingsScreen from '../screens/HomeLocationSettingsScreen'

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

export default function Navigation() {
  const { isAuthenticated, loading, user } = useAppSelector((state) => state.auth)

  /**
   * Check if user profile setup is complete
   */
  const isProfileComplete = (user: any): boolean => {
    if (!user) return false
    
    // Check if required profile fields are filled
    const hasUsername = user.username && user.username.trim() !== ''
    const hasDisplayName = user.display_name && user.display_name.trim() !== ''
    
    // Check if username is not the auto-generated email-based one (indicates manual setup)
    const isUsernameCustom = user.username && !user.username.startsWith('user_')
    
    return hasUsername && hasDisplayName && isUsernameCustom
  }

  if (loading) {
    return null // You could show a loading screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          isProfileComplete(user) ? (
            // User is authenticated and profile is complete - show main app
            <>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen 
                name="ProfileSetup" 
                component={ProfileSetupScreen}
                options={{
                  headerShown: true,
                  title: 'Add Activities',
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
            // User is authenticated but profile setup is incomplete
            <Stack.Screen 
              name="ProfileSetup" 
              component={ProfileSetupScreen}
              options={{
                headerShown: false,
                gestureEnabled: false, // Prevent going back during setup
              }}
            />
          )
        ) : (
          // User is not authenticated - show auth screen
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
} 