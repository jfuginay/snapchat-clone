/**
 * TribeFind Location Service Usage Examples
 * Shows how to integrate location services into your React Native components
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import locationService from '../services/locationService';
import { useAuth } from '../../services/AuthService'; // Adjust path as needed

// Example 1: Basic Location Permission and Current Location
export const BasicLocationExample = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = async () => {
    setLoading(true);
    
    // Request permission first
    const permissionResult = await locationService.requestLocationPermission();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', permissionResult.error);
      setLoading(false);
      return;
    }

    // Get current location
    const locationResult = await locationService.getCurrentLocation({
      accuracy: 'high',
      timeout: 10000
    });

    if (locationResult.error) {
      Alert.alert('Location Error', locationResult.error);
    } else {
      setLocation(locationResult.location);
      console.log('Current location:', locationResult.location);
    }
    
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Get Current Location</Text>
      <Button 
        title={loading ? "Getting Location..." : "Request Location"} 
        onPress={requestLocation}
        disabled={loading}
      />
      {location && (
        <View style={styles.locationInfo}>
          <Text>Latitude: {location.latitude.toFixed(6)}</Text>
          <Text>Longitude: {location.longitude.toFixed(6)}</Text>
          <Text>Accuracy: {location.accuracy}m</Text>
          <Text>Timestamp: {new Date(location.timestamp).toLocaleString()}</Text>
        </View>
      )}
    </View>
  );
};

// Example 2: Update User Location in Database
export const UpdateLocationExample = () => {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const updateMyLocation = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to update your location.');
      return;
    }

    setUpdating(true);

    // Get current location
    const locationResult = await locationService.getCurrentLocation();
    
    if (locationResult.error) {
      Alert.alert('Location Error', locationResult.error);
      setUpdating(false);
      return;
    }

    // Update in database
    const updateResult = await locationService.updateUserLocation(
      user.id,
      locationResult.location
    );

    if (updateResult.success) {
      setLastUpdate(new Date().toLocaleString());
      Alert.alert('Success', 'Your location has been updated in TribeFind!');
    } else {
      Alert.alert('Update Failed', updateResult.error);
    }

    setUpdating(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update My Location</Text>
      <Button 
        title={updating ? "Updating..." : "Update Location in TribeFind"} 
        onPress={updateMyLocation}
        disabled={updating || !user}
      />
      {lastUpdate && (
        <Text style={styles.timestamp}>Last updated: {lastUpdate}</Text>
      )}
    </View>
  );
};

// Example 3: Location Tracking with Real-time Updates
export const LocationTrackingExample = () => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState([]);

  const startTracking = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to start location tracking.');
      return;
    }

    const result = await locationService.startLocationTracking(user.id, {
      interval: 30000, // Update every 30 seconds
      accuracy: 'medium',
      onLocationUpdate: (location, updateResult) => {
        // Add to tracking data
        setTrackingData(prev => [
          ...prev.slice(-9), // Keep last 10 updates
          {
            ...location,
            updateSuccess: updateResult.success,
            timestamp: new Date().toLocaleString()
          }
        ]);
        
        console.log('Location updated:', location);
      }
    });

    if (result.success) {
      setIsTracking(true);
      Alert.alert('Tracking Started', 'TribeFind is now tracking your location!');
    } else {
      Alert.alert('Tracking Failed', result.error);
    }
  };

  const stopTracking = () => {
    locationService.stopLocationTracking();
    setIsTracking(false);
    Alert.alert('Tracking Stopped', 'Location tracking has been stopped.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Tracking</Text>
      <Button 
        title={isTracking ? "Stop Tracking" : "Start Tracking"} 
        onPress={isTracking ? stopTracking : startTracking}
        disabled={!user}
      />
      
      {trackingData.length > 0 && (
        <View style={styles.trackingData}>
          <Text style={styles.subtitle}>Recent Updates:</Text>
          {trackingData.slice(-3).map((data, index) => (
            <View key={index} style={styles.trackingItem}>
              <Text>📍 {data.latitude.toFixed(4)}, {data.longitude.toFixed(4)}</Text>
              <Text>⏰ {data.timestamp}</Text>
              <Text>✅ {data.updateSuccess ? 'Saved' : 'Failed'}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Example 4: Find Nearby Tribe Members
export const NearbyTribeMembersExample = () => {
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(5); // 5km default

  const findNearbyUsers = async () => {
    setLoading(true);

    // Get current location
    const locationResult = await locationService.getCurrentLocation();
    
    if (locationResult.error) {
      Alert.alert('Location Error', locationResult.error);
      setLoading(false);
      return;
    }

    // Find nearby tribe members
    const nearbyResult = await locationService.getNearbyTribeMembers(
      locationResult.location,
      radius
    );

    if (nearbyResult.error) {
      Alert.alert('Search Error', nearbyResult.error);
    } else {
      setNearbyUsers(nearbyResult.users);
      Alert.alert(
        'Tribe Members Found', 
        `Found ${nearbyResult.users.length} tribe members within ${radius}km!`
      );
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Nearby Tribe Members</Text>
      <Button 
        title={loading ? "Searching..." : `Find Tribe Members (${radius}km)`} 
        onPress={findNearbyUsers}
        disabled={loading}
      />
      
      {nearbyUsers.length > 0 && (
        <View style={styles.nearbyUsers}>
          <Text style={styles.subtitle}>Nearby Tribe Members:</Text>
          {nearbyUsers.slice(0, 5).map((user) => (
            <View key={user.id} style={styles.userItem}>
              <Text style={styles.userAvatar}>{user.avatar}</Text>
              <View>
                <Text style={styles.userName}>{user.display_name}</Text>
                <Text style={styles.userDistance}>
                  ~{Math.round(user.distance_meters / 1000)}km away
                </Text>
                <Text style={styles.userStatus}>
                  {user.is_online ? '🟢 Online' : '⚫ Offline'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Example 5: Distance Calculator
export const DistanceCalculatorExample = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [targetLocation] = useState({
    latitude: 37.7749, // San Francisco
    longitude: -122.4194,
    name: 'San Francisco'
  });
  const [distance, setDistance] = useState(null);

  const calculateDistance = async () => {
    const locationResult = await locationService.getCurrentLocation();
    
    if (locationResult.error) {
      Alert.alert('Location Error', locationResult.error);
      return;
    }

    setCurrentLocation(locationResult.location);
    
    const calculatedDistance = locationService.calculateDistance(
      locationResult.location,
      targetLocation
    );
    
    setDistance(calculatedDistance);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Distance Calculator</Text>
      <Text>Calculate distance to {targetLocation.name}</Text>
      <Button title="Calculate Distance" onPress={calculateDistance} />
      
      {distance && (
        <View style={styles.distanceInfo}>
          <Text style={styles.distanceText}>
            Distance: {distance.toFixed(2)} km
          </Text>
          {currentLocation && (
            <Text style={styles.coordinates}>
              Your location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
    color: '#555',
  },
  locationInfo: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#e8f5e8',
    borderRadius: 5,
  },
  timestamp: {
    marginTop: 10,
    fontStyle: 'italic',
    color: '#666',
  },
  trackingData: {
    marginTop: 15,
  },
  trackingItem: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 5,
  },
  nearbyUsers: {
    marginTop: 15,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 5,
  },
  userAvatar: {
    fontSize: 24,
    marginRight: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userDistance: {
    fontSize: 14,
    color: '#666',
  },
  userStatus: {
    fontSize: 12,
    color: '#888',
  },
  distanceInfo: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#e8f4fd',
    borderRadius: 5,
  },
  distanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  coordinates: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});

// Export all examples
export default {
  BasicLocationExample,
  UpdateLocationExample,
  LocationTrackingExample,
  NearbyTribeMembersExample,
  DistanceCalculatorExample,
}; 