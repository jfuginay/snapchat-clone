import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';

/**
 * TribeFind Location Service
 * Handles location permissions, tracking, and PostGIS integration
 * Find your tribe through shared locations and memories
 */

class LocationService {
  constructor() {
    this.watchSubscription = null;
    this.lastKnownLocation = null;
  }

  /**
   * Request location permissions from the user
   * @returns {Promise<{granted: boolean, error?: string}>}
   */
  async requestLocationPermission() {
    try {
      console.log('🔒 Requesting location permissions...');
      
      // Check current permission status
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        console.log('✅ Location permission already granted');
        return { granted: true };
      }

      // Request permission if not already granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        console.log('✅ Location permission granted');
        return { granted: true };
      } else {
        console.log('❌ Location permission denied');
        return { 
          granted: false, 
          error: 'Location permission is required to find your tribe and share memories with nearby users.' 
        };
      }
    } catch (error) {
      console.error('❌ Error requesting location permission:', error);
      return { 
        granted: false, 
        error: 'Failed to request location permission. Please check your device settings.' 
      };
    }
  }

  /**
   * Get the current location of the user
   * @param {Object} options - Location options
   * @param {string} options.accuracy - 'high', 'medium', or 'low'
   * @param {number} options.timeout - Timeout in milliseconds
   * @returns {Promise<{location?: Object, error?: string}>}
   */
  async getCurrentLocation(options = {}) {
    try {
      console.log('📍 Getting current location...');
      
      // Check permissions first
      const permissionResult = await this.requestLocationPermission();
      if (!permissionResult.granted) {
        return { error: permissionResult.error };
      }

      // Set accuracy based on options
      let accuracy = Location.Accuracy.Balanced;
      switch (options.accuracy) {
        case 'high':
          accuracy = Location.Accuracy.BestForNavigation;
          break;
        case 'medium':
          accuracy = Location.Accuracy.Balanced;
          break;
        case 'low':
          accuracy = Location.Accuracy.Low;
          break;
        default:
          accuracy = Location.Accuracy.Balanced;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy,
        timeout: options.timeout || 15000, // 15 second timeout
        maximumAge: 10000, // Accept cached location up to 10 seconds old
      });

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: new Date(location.timestamp).toISOString(),
      };

      this.lastKnownLocation = locationData;
      console.log('✅ Location obtained:', {
        lat: locationData.latitude.toFixed(6),
        lng: locationData.longitude.toFixed(6),
        accuracy: locationData.accuracy
      });

      return { location: locationData };

    } catch (error) {
      console.error('❌ Error getting current location:', error);
      
      let errorMessage = 'Failed to get current location.';
      if (error.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = 'Location request timed out. Please ensure you have a clear view of the sky and try again.';
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'Location services are not available on this device.';
      } else if (error.code === 'E_LOCATION_SETTINGS_UNSATISFIED') {
        errorMessage = 'Location settings need to be adjusted. Please enable high accuracy location.';
      }

      return { error: errorMessage };
    }
  }

  /**
   * Update user location in Supabase profiles table using PostGIS POINT
   * @param {string} userId - The user's ID
   * @param {Object} location - Location object with latitude and longitude
   * @param {number} location.latitude - Latitude coordinate
   * @param {number} location.longitude - Longitude coordinate
   * @param {number} [location.accuracy] - Location accuracy in meters
   * @param {string} [location.timestamp] - ISO timestamp of location
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateUserLocation(userId, location) {
    try {
      console.log('💾 Updating user location in database...', {
        userId: userId?.substring(0, 8) + '...',
        lat: location.latitude?.toFixed(6),
        lng: location.longitude?.toFixed(6)
      });

      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      if (!location || !location.latitude || !location.longitude) {
        return { success: false, error: 'Valid location with latitude and longitude is required' };
      }

      // Validate coordinates
      if (location.latitude < -90 || location.latitude > 90) {
        return { success: false, error: 'Invalid latitude. Must be between -90 and 90.' };
      }

      if (location.longitude < -180 || location.longitude > 180) {
        return { success: false, error: 'Invalid longitude. Must be between -180 and 180.' };
      }

      // Update user profile with PostGIS POINT
      // PostGIS uses POINT(longitude latitude) format - note the order!
      const { data, error } = await supabase
        .from('users')
        .update({
          location: `POINT(${location.longitude} ${location.latitude})`,
          location_accuracy: location.accuracy || null,
          location_updated_at: location.timestamp || new Date().toISOString(),
          last_active: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('id, username, location');

      if (error) {
        console.error('❌ Database error updating location:', error);
        return { 
          success: false, 
          error: `Failed to update location in database: ${error.message}` 
        };
      }

      if (!data || data.length === 0) {
        console.error('❌ No user found with ID:', userId);
        return { 
          success: false, 
          error: 'User not found. Please make sure you are logged in.' 
        };
      }

      console.log('✅ Location updated successfully for user:', data[0].username);
      return { success: true, data: data[0] };

    } catch (error) {
      console.error('❌ Error updating user location:', error);
      return { 
        success: false, 
        error: `Unexpected error updating location: ${error.message}` 
      };
    }
  }

  /**
   * Start watching user location changes
   * @param {string} userId - User ID to update location for
   * @param {Object} options - Watch options
   * @param {number} options.interval - Update interval in milliseconds (default: 30000)
   * @param {string} options.accuracy - Location accuracy ('high', 'medium', 'low')
   * @param {Function} options.onLocationUpdate - Callback when location updates
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async startLocationTracking(userId, options = {}) {
    try {
      console.log('🎯 Starting location tracking for TribeFind...');

      // Check permissions
      const permissionResult = await this.requestLocationPermission();
      if (!permissionResult.granted) {
        return { success: false, error: permissionResult.error };
      }

      // Stop existing tracking
      if (this.watchSubscription) {
        this.stopLocationTracking();
      }

      const interval = options.interval || 30000; // 30 seconds default
      let accuracy = Location.Accuracy.Balanced;
      
      switch (options.accuracy) {
        case 'high':
          accuracy = Location.Accuracy.BestForNavigation;
          break;
        case 'low':
          accuracy = Location.Accuracy.Low;
          break;
      }

      // Start watching location
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy,
          timeInterval: interval,
          distanceInterval: 50, // Update if moved 50 meters
        },
        async (location) => {
          const locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: new Date(location.timestamp).toISOString(),
          };

          // Update in database
          const updateResult = await this.updateUserLocation(userId, locationData);
          
          // Call callback if provided
          if (options.onLocationUpdate) {
            options.onLocationUpdate(locationData, updateResult);
          }

          console.log('📍 Location tracking update:', {
            lat: locationData.latitude.toFixed(6),
            lng: locationData.longitude.toFixed(6),
            success: updateResult.success
          });
        }
      );

      console.log('✅ Location tracking started');
      return { success: true };

    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop location tracking
   */
  stopLocationTracking() {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
      console.log('🛑 Location tracking stopped');
    }
  }

  /**
   * Get nearby tribe members (users within a certain radius)
   * @param {Object} location - Current location {latitude, longitude}
   * @param {number} radiusKm - Radius in kilometers (default: 5)
   * @returns {Promise<{users?: Array, error?: string}>}
   */
  async getNearbyTribeMembers(location, radiusKm = 5) {
    try {
      console.log('🔍 Finding nearby tribe members...');

      if (!location || !location.latitude || !location.longitude) {
        return { error: 'Current location is required' };
      }

      // Use PostGIS ST_DWithin to find nearby users
      // ST_DWithin uses meters, so convert km to meters
      const radiusMeters = radiusKm * 1000;

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          display_name,
          avatar,
          location,
          last_active,
          is_online
        `)
        .not('location', 'is', null)
        .neq('id', 'current_user_id') // This would be replaced with actual current user ID
        .rpc('nearby_users', {
          user_lat: location.latitude,
          user_lng: location.longitude,
          radius_meters: radiusMeters
        });

      if (error) {
        console.error('❌ Error finding nearby users:', error);
        return { error: 'Failed to find nearby tribe members' };
      }

      console.log(`✅ Found ${data?.length || 0} nearby tribe members`);
      return { users: data || [] };

    } catch (error) {
      console.error('❌ Error getting nearby tribe members:', error);
      return { error: error.message };
    }
  }

  /**
   * Calculate distance between two points in kilometers
   * @param {Object} point1 - {latitude, longitude}
   * @param {Object} point2 - {latitude, longitude}
   * @returns {number} Distance in kilometers
   */
  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees 
   * @returns {number} Radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }
}

// Export singleton instance
const locationService = new LocationService();
export default locationService;

// Named exports for specific functions
export const {
  requestLocationPermission,
  getCurrentLocation,
  updateUserLocation,
  startLocationTracking,
  stopLocationTracking,
  getNearbyTribeMembers,
  calculateDistance
} = locationService; 