import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import MapView, { 
  Marker, 
  Circle, 
  Region,
  Callout,
  PROVIDER_GOOGLE,
  MarkerPressEvent 
} from 'react-native-maps';
import { supabase } from '../lib/supabase';
import { useAppSelector } from '../store';
import locationService from '../src/services/locationService';

const { width, height } = Dimensions.get('window');

interface TribeMember {
  id: string;
  username: string;
  display_name: string;
  avatar: string;
  location: {
    latitude: number;
    longitude: number;
  };
  distance_meters: number;
  shared_activities: {
    id: string;
    name: string;
    icon: string;
    skill_level: string;
  }[];
  last_active: string;
  is_online: boolean;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const MapScreen: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const mapRef = useRef<MapView>(null);
  
  // State management
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [tribeMembers, setTribeMembers] = useState<TribeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TribeMember | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Initial region (San Francisco as default)
  const [region, setRegion] = useState<Region>({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    initializeMap();
  }, [user]);

  /**
   * Initialize map with user location and nearby tribe members
   */
  const initializeMap = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Request location permission
      const permission = await locationService.requestLocationPermission();
      if (!permission.granted) {
        Alert.alert(
          'Location Required',
          'TribeFind needs location access to show nearby tribe members. Please enable location permissions in Settings.',
          [
            { text: 'Settings', onPress: () => {/* Open settings */} },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        setLoading(false);
        return;
      }

      setLocationPermission(true);
      
      // Get current location
      const locationResult = await locationService.getCurrentLocation({
        accuracy: 'high',
        timeout: 15000
      });

      if (locationResult.error) {
        Alert.alert('Location Error', locationResult.error);
        setLoading(false);
        return;
      }

      const location = locationResult.location as UserLocation;
      setUserLocation(location);

      // Update region to user location
      const newRegion: Region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(newRegion);

      // Update user location in database
      await locationService.updateUserLocation(user!.id, location);

      // Load nearby tribe members
      await loadNearbyTribeMembers(location);

    } catch (error) {
      console.error('Error initializing map:', error);
      Alert.alert('Error', 'Failed to initialize map. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load nearby tribe members with shared activities using PostGIS
   */
  const loadNearbyTribeMembers = async (currentLocation: UserLocation) => {
    try {
      console.log('🔍 Loading nearby tribe members...');

      // First, get user's activities to find shared interests
      const { data: userActivities, error: userActivitiesError } = await supabase
        .from('user_activities')
        .select('activity_id, activities(id, name, icon)')
        .eq('user_id', user!.id);

      if (userActivitiesError) {
        console.error('Error loading user activities:', userActivitiesError);
        return;
      }

      if (!userActivities || userActivities.length === 0) {
        console.log('No user activities found');
        setTribeMembers([]);
        return;
      }

      const userActivityIds = userActivities.map(ua => ua.activity_id);

      // Query nearby users with PostGIS ST_DWithin who share activities
      const radiusMeters = radiusKm * 1000;
      
      const { data: nearbyUsers, error } = await supabase.rpc('get_nearby_tribe_members', {
        user_lat: currentLocation.latitude,
        user_lng: currentLocation.longitude,
        radius_meters: radiusMeters,
        activity_ids: userActivityIds
      });

      if (error) {
        console.error('Error loading nearby tribe members:', error);
        Alert.alert('Error', 'Failed to load nearby tribe members');
        return;
      }

      console.log(`✅ Found ${nearbyUsers?.length || 0} nearby tribe members`);
      setTribeMembers(nearbyUsers || []);

    } catch (error) {
      console.error('Error in loadNearbyTribeMembers:', error);
    }
  };

  /**
   * Handle refresh - reload current location and nearby members
   */
  const handleRefresh = useCallback(async () => {
    if (!user || !locationPermission) return;

    setRefreshing(true);
    
    try {
      const locationResult = await locationService.getCurrentLocation();
      if (!locationResult.error && locationResult.location) {
        const location = locationResult.location as UserLocation;
        setUserLocation(location);
        await locationService.updateUserLocation(user!.id, location);
        await loadNearbyTribeMembers(location);
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user, locationPermission, radiusKm]);

  /**
   * Handle marker press to show member details
   */
  const handleMarkerPress = (member: TribeMember) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  /**
   * Get appropriate marker color based on shared activities
   */
  const getMarkerColor = (sharedActivities: any[]) => {
    const count = sharedActivities.length;
    if (count >= 5) return '#10B981'; // Green - Many shared
    if (count >= 3) return '#F59E0B'; // Yellow - Some shared  
    if (count >= 1) return '#EF4444'; // Red - Few shared
    return '#6B7280'; // Gray - No shared (shouldn't happen)
  };

  /**
   * Render tribe member marker
   */
  const renderTribeMemberMarker = (member: TribeMember) => {
    const markerColor = getMarkerColor(member.shared_activities);
    const primaryActivity = member.shared_activities[0];

    return (
      <Marker
        key={member.id}
        coordinate={member.location}
        onPress={() => handleMarkerPress(member)}
        tracksViewChanges={false}
      >
        <View style={[styles.customMarker, { backgroundColor: markerColor }]}>
          <Text style={styles.markerIcon}>
            {primaryActivity?.icon || '👤'}
          </Text>
          {member.is_online && (
            <View style={styles.onlineIndicator} />
          )}
        </View>
        <Callout tooltip>
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{member.display_name}</Text>
            <Text style={styles.calloutSubtitle}>
              {member.shared_activities.length} shared interests
            </Text>
            <Text style={styles.calloutDistance}>
              ~{Math.round(member.distance_meters / 1000)}km away
            </Text>
          </View>
        </Callout>
      </Marker>
    );
  };

  /**
   * Render user location marker
   */
  const renderUserMarker = () => {
    if (!userLocation) return null;

    return (
      <Marker
        coordinate={userLocation}
        title="You are here"
        description="Your current location"
        tracksViewChanges={false}
      >
        <View style={styles.userMarker}>
          <Text style={styles.userMarkerIcon}>📍</Text>
        </View>
      </Marker>
    );
  };

  /**
   * Render member details modal
   */
  const renderMemberModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedMember && (
            <>
              <View style={styles.memberHeader}>
                <Text style={styles.memberAvatar}>{selectedMember.avatar}</Text>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{selectedMember.display_name}</Text>
                  <Text style={styles.memberUsername}>@{selectedMember.username}</Text>
                  <Text style={styles.memberDistance}>
                    📍 {Math.round(selectedMember.distance_meters / 1000)}km away
                  </Text>
                  <Text style={[
                    styles.memberStatus,
                    { color: selectedMember.is_online ? '#10B981' : '#6B7280' }
                  ]}>
                    {selectedMember.is_online ? '🟢 Online' : '⚫ Offline'}
                  </Text>
                </View>
              </View>

              <View style={styles.sharedActivities}>
                <Text style={styles.sectionTitle}>
                  Shared Interests ({selectedMember.shared_activities.length})
                </Text>
                <ScrollView style={styles.activitiesList}>
                  {selectedMember.shared_activities.map((activity) => (
                    <View key={activity.id} style={styles.activityItem}>
                      <Text style={styles.activityIcon}>{activity.icon}</Text>
                      <View style={styles.activityDetails}>
                        <Text style={styles.activityName}>{activity.name}</Text>
                        <Text style={styles.activitySkill}>
                          {activity.skill_level} level
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() => {
                    // TODO: Implement connect/message functionality
                    Alert.alert('Connect', `Send a message to ${selectedMember.display_name}?`);
                  }}
                >
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  /**
   * Handle map ready event
   */
  const onMapReady = () => {
    setMapReady(true);
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Finding your tribe...</Text>
      </View>
    );
  }

  // No permission state
  if (!locationPermission) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>📍</Text>
        <Text style={styles.errorTitle}>Location Required</Text>
        <Text style={styles.errorMessage}>
          TribeFind needs location access to show nearby tribe members with shared interests.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeMap}>
          <Text style={styles.retryButtonText}>Enable Location</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={setRegion}
        onMapReady={onMapReady}
        showsUserLocation={false} // We'll use custom marker
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
      >
        {/* User location marker */}
        {renderUserMarker()}

        {/* Radius circle */}
        {userLocation && (
          <Circle
            center={userLocation}
            radius={radiusKm * 1000}
            strokeColor="rgba(59, 130, 246, 0.5)"
            fillColor="rgba(59, 130, 246, 0.1)"
            strokeWidth={2}
          />
        )}

        {/* Tribe member markers */}
        {tribeMembers.map(renderTribeMemberMarker)}
      </MapView>

      {/* Map Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Text style={styles.controlButtonIcon}>
            {refreshing ? '⟳' : '🔄'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            Alert.alert(
              'Search Radius',
              `Currently searching within ${radiusKm}km`,
              [
                { text: '5km', onPress: () => setRadiusKm(5) },
                { text: '10km', onPress: () => setRadiusKm(10) },
                { text: '25km', onPress: () => setRadiusKm(25) },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
        >
          <Text style={styles.controlButtonText}>{radiusKm}km</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          🎯 {tribeMembers.length} tribe members nearby
        </Text>
      </View>

      {/* Member Details Modal */}
      {renderMemberModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#374151',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8F9FA',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  customMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerIcon: {
    fontSize: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  userMarkerIcon: {
    fontSize: 24,
  },
  callout: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  calloutDistance: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  controls: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'column',
  },
  controlButton: {
    width: 50,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButtonIcon: {
    fontSize: 20,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  stats: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statsText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.8,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  memberAvatar: {
    fontSize: 48,
    marginRight: 15,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  memberUsername: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  memberDistance: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  memberStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  sharedActivities: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  activitiesList: {
    maxHeight: 200,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  activitySkill: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MapScreen; 