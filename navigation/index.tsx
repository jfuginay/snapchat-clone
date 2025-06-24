import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useAppSelector } from '../store'

// Import screens
import AuthScreen from '../screens/AuthScreen'
import CameraScreen from '../screens/CameraScreen'
import MapScreen from '../screens/MapScreen'
import ProfileScreen from '../screens/ProfileScreen'
import HomeScreen from '../screens/HomeScreen'
import LocationSettingsScreen from '../screens/LocationSettingsScreen'

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
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#FFFC00',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#333',
        },
        headerStyle: {
          backgroundColor: '#FFFC00',
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
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function Navigation() {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth)

  if (loading) {
    return null // You could show a loading screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen 
              name="LocationSettings" 
              component={LocationSettingsScreen}
              options={{
                headerShown: true,
                title: 'Location Settings',
                headerStyle: {
                  backgroundColor: '#FFFC00',
                },
                headerTitleStyle: {
                  color: '#000',
                  fontWeight: 'bold',
                },
                headerTintColor: '#000',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
} 