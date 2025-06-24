/**
 * MapScreen Usage Examples for TribeFind
 * Shows how to integrate the map with nearby tribe members functionality
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import MapScreen from '../../screens/MapScreen';

// Example 1: Basic MapScreen Integration
export const BasicMapExample = () => {
  return (
    <View style={styles.container}>
      <MapScreen />
    </View>
  );
};

// Example 2: MapScreen with Custom Header
export const MapWithHeaderExample = () => {
  const handleShareLocation = () => {
    Alert.alert(
      'Share Location', 
      'Allow friends to see your location for the next hour?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', onPress: () => console.log('Location shared') }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TribeFind Map</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareLocation}>
          <Text style={styles.shareButtonText}>📍 Share</Text>
        </TouchableOpacity>
      </View>
      
      {/* Map Component */}
      <View style={styles.mapContainer}>
        <MapScreen />
      </View>
    </View>
  );
};

// Example 3: Map Integration with Activity Filter
export const MapWithActivityFilterExample = () => {
  const [selectedActivities, setSelectedActivities] = React.useState([]);

  const handleFilterActivities = () => {
    Alert.alert(
      'Filter by Activity',
      'Choose activities to find tribe members',
      [
        { text: '🏀 Basketball', onPress: () => setSelectedActivities(['basketball']) },
        { text: '🎸 Music', onPress: () => setSelectedActivities(['music']) },
        { text: '📸 Photography', onPress: () => setSelectedActivities(['photography']) },
        { text: 'Show All', onPress: () => setSelectedActivities([]) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Activity Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterButton} onPress={handleFilterActivities}>
          <Text style={styles.filterButtonText}>
            🎭 Filter Activities ({selectedActivities.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Map with filtered results */}
      <MapScreen />
    </View>
  );
};

// Example 4: Map Screen with Tribe Stats
export const MapWithStatsExample = () => {
  const [stats, setStats] = React.useState({
    nearbyMembers: 0,
    sharedActivities: 0,
    connectionsToday: 0
  });

  React.useEffect(() => {
    // Simulate loading stats
    setTimeout(() => {
      setStats({
        nearbyMembers: 12,
        sharedActivities: 5,
        connectionsToday: 3
      });
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.nearbyMembers}</Text>
          <Text style={styles.statLabel}>Nearby</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.sharedActivities}</Text>
          <Text style={styles.statLabel}>Shared</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.connectionsToday}</Text>
          <Text style={styles.statLabel}>Connected</Text>
        </View>
      </View>
      
      {/* Map */}
      <MapScreen />
    </View>
  );
};

// Example 5: Navigation Integration
export const NavigationMapExample = ({ navigation }) => {
  const handleUserProfile = (userId) => {
    navigation.navigate('Profile', { userId });
  };

  const handleChatWithUser = (userId) => {
    navigation.navigate('Chat', { userId });
  };

  return (
    <View style={styles.container}>
      <MapScreen 
        onUserPress={handleUserProfile}
        onConnectPress={handleChatWithUser}
      />
    </View>
  );
};

// Example 6: Integration with Location Settings
export const MapWithSettingsExample = ({ navigation }) => {
  const handleLocationSettings = () => {
    navigation.navigate('LocationSettings');
  };

  const handlePrivacySettings = () => {
    Alert.alert(
      'Privacy Settings',
      'Control who can see your location',
      [
        { text: 'Friends Only', onPress: () => console.log('Friends only') },
        { text: 'Tribe Members', onPress: () => console.log('Tribe members') },
        { text: 'Ghost Mode', onPress: () => console.log('Ghost mode') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Settings Header */}
      <View style={styles.settingsHeader}>
        <TouchableOpacity style={styles.settingsButton} onPress={handleLocationSettings}>
          <Text style={styles.settingsButtonText}>⚙️ Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsButton} onPress={handlePrivacySettings}>
          <Text style={styles.settingsButtonText}>🔒 Privacy</Text>
        </TouchableOpacity>
      </View>
      
      <MapScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  filterBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  filterButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingsButton: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
  },
  settingsButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
});

// Export all examples
export default {
  BasicMapExample,
  MapWithHeaderExample,
  MapWithActivityFilterExample,
  MapWithStatsExample,
  NavigationMapExample,
  MapWithSettingsExample,
}; 