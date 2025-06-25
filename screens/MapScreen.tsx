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
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAppSelector } from '../store';
import locationService from '../src/services/locationService';
import ActivityFilter from '../components/ActivityFilter';

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
  const navigation = useNavigation<any>();
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
  const [locationTrackingActive, setLocationTrackingActive] = useState(false);
  const locationTrackingRef = useRef<number | null>(null);
  
  // Activity filtering state
  const [selectedActivityFilters, setSelectedActivityFilters] = useState<string[]>([]);
  const [allTribeMembers, setAllTribeMembers] = useState<TribeMember[]>([]); // Store all unfiltered results
  const [filteredTribeMembers, setFilteredTribeMembers] = useState<TribeMember[]>([]); // Store filtered results

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
   * Handle activity filter changes
   */
  const handleActivityFilterChange = useCallback((selectedFilters: string[]) => {
    setSelectedActivityFilters(selectedFilters);
    
    if (selectedFilters.length === 0) {
      // No filters - show all tribe members
      setFilteredTribeMembers(allTribeMembers);
    } else {
      // Filter tribe members by selected activities
      const filtered = allTribeMembers.filter((member: TribeMember) => {
        // Check if member has at least one shared activity that matches the selected filters
        return member.shared_activities.some((activity: any) => 
          selectedFilters.includes(activity.id)
        );
      });
      setFilteredTribeMembers(filtered);
    }
  }, [allTribeMembers]);

  /**
   * Update filtered tribe members when all members change
   */
  useEffect(() => {
    handleActivityFilterChange(selectedActivityFilters);
  }, [allTribeMembers, handleActivityFilterChange]);

  /**
   * Handle real-time location updates from other tribe members
   */
  const handleLocationUpdate = useCallback(async (payload: any) => {
    console.log('📍 Real-time location update:', payload);
    
    if (!userLocation || !user) return;

    try {
      // Check if the updated user is within our current search radius and has shared activities
      const updatedUser = payload.new;
      
      // Skip if it's the current user's own update
      if (updatedUser.id === user.id) return;

      // Calculate distance to see if user is in range
      if (updatedUser.location) {
        const distance = calculateDistance(userLocation, {
          latitude: updatedUser.location.coordinates[1], // PostGIS returns [lng, lat]
          longitude: updatedUser.location.coordinates[0]
        });

        if (distance <= radiusKm * 1000) {
          // User is in range, refresh tribe members to get updated data
          await loadNearbyTribeMembers(userLocation);
        } else {
          // User moved out of range, remove from current tribe members
          setTribeMembers(prev => prev.filter(member => member.id !== updatedUser.id));
        }
      }
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }, [userLocation, user, radiusKm]);

  /**
   * Handle real-time activity updates (when users add/remove activities)
   */
  const handleActivityUpdate = useCallback(async (payload: any) => {
    console.log('🎯 Real-time activity update:', payload);
    
    if (!userLocation) return;

    try {
      // When activities change, refresh nearby tribe members to update shared activities
      await loadNearbyTribeMembers(userLocation);
    } catch (error) {
      console.error('Error handling activity update:', error);
    }
  }, [userLocation]);

  /**
   * Calculate distance between two points in meters
   */
  const calculateDistance = (point1: UserLocation, point2: UserLocation): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLng = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    // Set up real-time subscriptions for live tribe updates
    if (!user || !locationPermission) return;

    console.log('🔄 Setting up real-time tribe subscriptions...');

    // Subscribe to user location and status updates
    const locationSubscription = supabase
      .channel('tribe-locations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `location=neq.null`
      }, handleLocationUpdate)
      .subscribe();

    // Subscribe to user activity changes
    const activitySubscription = supabase
      .channel('tribe-activities')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_activities'
      }, handleActivityUpdate)
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      console.log('🛑 Cleaning up real-time subscriptions...');
      locationSubscription.unsubscribe();
      activitySubscription.unsubscribe();
    };
  }, [user, locationPermission, radiusKm, handleLocationUpdate, handleActivityUpdate]);



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

      // Start battery-efficient location tracking
      startLocationTracking();

    } catch (error) {
      console.error('Error initializing map:', error);
      Alert.alert('Error', 'Failed to initialize map. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start battery-efficient location tracking with adaptive intervals
   */
  const startLocationTracking = useCallback(() => {
    if (locationTrackingActive || !user) return;

    console.log('🔋 Starting battery-efficient location tracking...');
    setLocationTrackingActive(true);

    // Adaptive tracking: more frequent when moving, less when stationary
    let trackingInterval = 30000; // Start with 30 seconds
    let lastKnownLocation = userLocation;
    let stationaryCount = 0;

    const trackLocation = async () => {
      try {
        const locationResult = await locationService.getCurrentLocation({
          accuracy: 'balanced', // Use balanced accuracy for battery efficiency
          timeout: 10000
        });

        if (!locationResult.error && locationResult.location) {
          const newLocation = locationResult.location as UserLocation;
          
          // Calculate distance moved since last update
          const distanceMoved = lastKnownLocation 
            ? calculateDistance(lastKnownLocation, newLocation)
            : 0;

          // Adaptive interval logic
          if (distanceMoved < 50) { // Less than 50 meters
            stationaryCount++;
            // Gradually increase interval when stationary (max 5 minutes)
            trackingInterval = Math.min(300000, 30000 + (stationaryCount * 30000));
          } else {
            stationaryCount = 0;
            // More frequent updates when moving (minimum 15 seconds)
            trackingInterval = Math.max(15000, 30000 - (distanceMoved / 10));
          }

          // Update location if significant movement or if it's been a while
          if (distanceMoved > 25 || stationaryCount === 0) {
            setUserLocation(newLocation);
            await locationService.updateUserLocation(user.id, newLocation);
            lastKnownLocation = newLocation;
            
            // Only refresh tribe members if significant movement
            if (distanceMoved > 100) {
              await loadNearbyTribeMembers(newLocation);
            }
          }

          console.log(`📍 Location tracking: moved ${Math.round(distanceMoved)}m, next update in ${trackingInterval/1000}s`);
        }
      } catch (error) {
        console.error('Error in location tracking:', error);
        // Increase interval on error to avoid battery drain
        trackingInterval = Math.min(300000, trackingInterval * 1.5);
      }

      // Schedule next update with adaptive interval
      if (locationTrackingActive) {
        locationTrackingRef.current = setTimeout(trackLocation, trackingInterval);
      }
    };

    // Start first location check immediately
    trackLocation();
  }, [user, userLocation, locationTrackingActive]);

  /**
   * Stop location tracking to save battery
   */
     const stopLocationTracking = useCallback(() => {
     console.log('🔋 Stopping location tracking...');
     setLocationTrackingActive(false);
     
     if (locationTrackingRef.current) {
       clearTimeout(locationTrackingRef.current);
       locationTrackingRef.current = null;
     }
   }, []);

   // Cleanup location tracking on unmount
   useEffect(() => {
     return () => {
       stopLocationTracking();
     };
   }, [stopLocationTracking]);

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
        
        // Check if it's a missing table error
        if (userActivitiesError.code === 'PGRST200' || userActivitiesError.message.includes('user_activities')) {
          Alert.alert(
            'Database Setup Required',
            'The activities tables need to be set up in your database. Please run the COMPLETE_DATABASE_SETUP.sql script in your Supabase SQL Editor.',
            [
              { text: 'OK', onPress: () => setTribeMembers([]) }
            ]
          );
          return;
        }
        
        // Other database errors
        Alert.alert('Database Error', 'Failed to load user activities. Please try again.');
        return;
      }

      if (!userActivities || userActivities.length === 0) {
        console.log('No user activities found - user needs to select some interests first');
        setTribeMembers([]);
        
        // Show helpful message for users with no activities
        setTimeout(() => {
          Alert.alert(
            'Select Your Interests',
            'To find nearby tribe members, please add some activities to your profile first!',
            [
              { 
                text: 'Add Activities', 
                onPress: () => {
                  // Navigate to Activities screen where users can select their interests
                  navigation.navigate('Activities');
                }
              },
              { text: 'Later', style: 'cancel' }
            ]
          );
        }, 1000);
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
      
      // Update both all members and filtered members
      const membersData = nearbyUsers || [];
      setAllTribeMembers(membersData);
      setTribeMembers(membersData); // Keep for backward compatibility
      
      // Apply current filters to new data
      if (selectedActivityFilters.length === 0) {
        setFilteredTribeMembers(membersData);
      } else {
        const filtered = membersData.filter((member: TribeMember) => {
          return member.shared_activities.some((activity: any) => 
            selectedActivityFilters.includes(activity.id)
          );
        });
        setFilteredTribeMembers(filtered);
      }

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
   * Optimized tribe member marker rendering with memoization
   */
  const renderTribeMemberMarker = useCallback((member: TribeMember) => {
    const markerColor = getMarkerColor(member.shared_activities);
    const primaryActivity = member.shared_activities[0];

    return (
      <Marker
        key={member.id}
        coordinate={member.location}
        onPress={() => handleMarkerPress(member)}
        tracksViewChanges={false} // Prevent unnecessary re-renders
        identifier={member.id} // Unique identifier for optimization
      >
        <View style={[styles.customMarker, { backgroundColor: markerColor }]}>
          <Text style={styles.markerIcon}>
            {primaryActivity?.icon || '👤'}
          </Text>
          {member.is_online && (
            <View style={[styles.onlineIndicator, {
              backgroundColor: member.last_active && 
                new Date(member.last_active) > new Date(Date.now() - 300000) // 5 minutes
                ? '#10B981' // Bright green for recently active
                : '#22C55E'  // Standard green for online
            }]} />
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
            <Text style={styles.calloutLastActive}>
              {member.is_online ? '🟢 Online' : 
               `⚫ ${getTimeAgo(member.last_active)}`}
            </Text>
          </View>
        </Callout>
      </Marker>
    );
  }, []);

  /**
   * Get time ago string for last active status
   */
  const getTimeAgo = (timestamp: string): string => {
    const now = new Date().getTime();
    const time = new Date(timestamp).getTime();
    const diffInMinutes = Math.floor((now - time) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
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
      {/* Activity Filter */}
      <ActivityFilter
        onFilterChange={handleActivityFilterChange}
        selectedActivities={selectedActivityFilters}
        userActivitiesOnly={false}
        userId={user?.id}
      />

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
        {filteredTribeMembers.map(renderTribeMemberMarker)}
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

      {/* Stats with Real-time Indicators */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          🎯 {selectedActivityFilters.length === 0 
            ? `${tribeMembers.length} tribe members nearby`
            : `${filteredTribeMembers.length} of ${tribeMembers.length} members shown`
          }
        </Text>
        <View style={styles.statusIndicators}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { 
              backgroundColor: locationTrackingActive ? '#10B981' : '#EF4444' 
            }]} />
            <Text style={styles.statusText}>
              {locationTrackingActive ? 'Location Tracking' : 'Tracking Paused'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.statusText}>Real-time Updates</Text>
          </View>
        </View>
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
    flex: 1,
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
  calloutLastActive: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
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
  statusIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
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