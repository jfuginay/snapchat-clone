import React from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { useAppSelector } from '../store'

export default function MapScreen() {
  const { currentLocation } = useAppSelector((state) => state.location)
  const { contacts } = useAppSelector((state) => state.contacts)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.title}>Map</Text>
          <Text style={styles.subtitle}>
            Your location and friends will appear here
          </Text>
          
          {currentLocation && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                📍 Current Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </Text>
            </View>
          )}
          
          <View style={styles.friendsInfo}>
            <Text style={styles.friendsCount}>
              👥 {contacts.length} friends on the map
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFC00',
  },
  content: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
    margin: 20,
    borderRadius: 20,
    padding: 40,
  },
  mapIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  locationInfo: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
  },
  friendsInfo: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
  },
  friendsCount: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
}) 