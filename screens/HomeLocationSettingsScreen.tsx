import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAppSelector } from '../store';
import { supabase } from '../lib/supabase';
import locationService from '../src/services/locationService';

const { width, height } = Dimensions.get('window');

interface HomeLocation {
  latitude: number;
  longitude: number;
  address: string;
  nickname?: string;
}

const HomeLocationSettingsScreen: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const mapRef = useRef<MapView>(null);

  // State management
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Map region state
  const [region, setRegion] = useState<Region>({
    latitude: 37.7749, // Default to San Francisco
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    loadCurrentHomeLocation();
  }, [user]);

  /**
   * Load user's current home location from database
   */
  const loadCurrentHomeLocation = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: userData, error } = await supabase
        .from('users')
        .select('home_location')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading home location:', error);
        return;
      }

      if (userData?.home_location) {
        const homeLocationData = userData.home_location as HomeLocation;
        setHomeLocation(homeLocationData);
        setAddressInput(homeLocationData.address);
        setNicknameInput(homeLocationData.nickname || '');

        // Update map region to home location
        const newRegion: Region = {
          latitude: homeLocationData.latitude,
          longitude: homeLocationData.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
      } else {
        // No home location set, use current location
        await useCurrentLocation();
      }
    } catch (error) {
      console.error('Error loading home location:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Use current location as starting point
   */
  const useCurrentLocation = async () => {
    try {
      const permission = await locationService.requestLocationPermission();
      if (!permission.granted) {
        Alert.alert('Location Permission', 'Please enable location access to use this feature.');
        return;
      }

      const locationResult = await locationService.getCurrentLocation();
      if (!locationResult.error && locationResult.location) {
        const location = locationResult.location as { latitude: number; longitude: number };
        const newRegion: Region = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);

        // Try to get address for current location
        await reverseGeocode(location.latitude, location.longitude);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  /**
   * Search for addresses using a geocoding service
   */
  const searchAddresses = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    try {
      // Using a simple geocoding approach - in production you'd want to use Google Places API
      // For now, we'll simulate address search
      const mockResults = [
        {
          id: '1',
          address: `${query}, San Francisco, CA, USA`,
          latitude: 37.7749 + Math.random() * 0.1 - 0.05,
          longitude: -122.4194 + Math.random() * 0.1 - 0.05,
        },
        {
          id: '2',
          address: `${query}, Los Angeles, CA, USA`,
          latitude: 34.0522 + Math.random() * 0.1 - 0.05,
          longitude: -118.2437 + Math.random() * 0.1 - 0.05,
        },
        {
          id: '3',
          address: `${query}, New York, NY, USA`,
          latitude: 40.7128 + Math.random() * 0.1 - 0.05,
          longitude: -74.0060 + Math.random() * 0.1 - 0.05,
        },
      ];

      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching addresses:', error);
    } finally {
      setSearching(false);
    }
  };

  /**
   * Reverse geocode coordinates to get address
   */
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      // In production, you'd use a proper reverse geocoding service
      // For now, we'll create a simple address format
      const mockAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      setAddressInput(mockAddress);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  /**
   * Handle address selection from search results
   */
  const selectAddress = (result: any) => {
    setAddressInput(result.address);
    const newRegion: Region = {
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(newRegion);
    setSearchResults([]);

    // Update home location preview
    setHomeLocation({
      latitude: result.latitude,
      longitude: result.longitude,
      address: result.address,
      nickname: nicknameInput,
    });
  };

  /**
   * Handle map press to set home location
   */
  const handleMapPress = (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    
    setHomeLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      address: addressInput || `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
      nickname: nicknameInput,
    });

    reverseGeocode(coordinate.latitude, coordinate.longitude);
  };

  /**
   * Save home location to database
   */
  const saveHomeLocation = async () => {
    if (!user || !homeLocation) {
      Alert.alert('Error', 'Please select a home location first.');
      return;
    }

    if (!addressInput.trim()) {
      Alert.alert('Error', 'Please enter an address for your home location.');
      return;
    }

    setSaving(true);

    try {
      const homeLocationData: HomeLocation = {
        latitude: homeLocation.latitude,
        longitude: homeLocation.longitude,
        address: addressInput.trim(),
        nickname: nicknameInput.trim() || undefined,
      };

             const { error } = await supabase
         .from('users')
         .update({ home_location: homeLocationData })
         .eq('id', user!.id);

      if (error) {
        console.error('Error saving home location:', error);
        Alert.alert('Error', 'Failed to save home location. Please try again.');
        return;
      }

      Alert.alert('Success', 'Home location saved successfully!');
      setHomeLocation(homeLocationData);
    } catch (error) {
      console.error('Error saving home location:', error);
      Alert.alert('Error', 'Failed to save home location. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Clear home location
   */
  const clearHomeLocation = () => {
    Alert.alert(
      'Clear Home Location',
      'Are you sure you want to remove your home location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
                             const { error } = await supabase
                 .from('users')
                 .update({ home_location: null })
                 .eq('id', user!.id);

              if (error) {
                console.error('Error clearing home location:', error);
                Alert.alert('Error', 'Failed to clear home location.');
                return;
              }

              setHomeLocation(null);
              setAddressInput('');
              setNicknameInput('');
              Alert.alert('Success', 'Home location cleared.');
            } catch (error) {
              console.error('Error clearing home location:', error);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading home location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Home Location</Text>
          <Text style={styles.subtitle}>
            Set your home location for better activity recommendations and distance calculations.
          </Text>
        </View>

        {/* Address Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Address</Text>
          <TextInput
            style={styles.textInput}
            value={addressInput}
            onChangeText={(text) => {
              setAddressInput(text);
              searchAddresses(text);
            }}
            placeholder="Enter your home address"
            multiline
            numberOfLines={2}
          />

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((result) => (
                <TouchableOpacity
                  key={result.id}
                  style={styles.searchResultItem}
                  onPress={() => selectAddress(result)}
                >
                  <Text style={styles.searchResultText}>{result.address}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Nickname Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Nickname (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={nicknameInput}
            onChangeText={setNicknameInput}
            placeholder="e.g., My Apartment, Family House"
          />
        </View>

        {/* Map */}
        <View style={styles.mapSection}>
          <Text style={styles.inputLabel}>Location on Map</Text>
          <Text style={styles.mapInstruction}>Tap on the map to set your exact home location</Text>
          
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              region={region}
              onRegionChangeComplete={setRegion}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              {homeLocation && (
                <Marker
                  coordinate={{
                    latitude: homeLocation.latitude,
                    longitude: homeLocation.longitude,
                  }}
                  title="Home"
                  description={homeLocation.address}
                >
                  <View style={styles.homeMarker}>
                    <Text style={styles.homeMarkerIcon}>🏠</Text>
                  </View>
                </Marker>
              )}
            </MapView>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={useCurrentLocation}
          >
            <Text style={styles.currentLocationButtonText}>📍 Use Current Location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, !homeLocation && styles.disabledButton]}
            onPress={saveHomeLocation}
            disabled={saving || !homeLocation}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Home Location</Text>
            )}
          </TouchableOpacity>

          {homeLocation && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearHomeLocation}
              disabled={saving}
            >
              <Text style={styles.clearButtonText}>Clear Home Location</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  inputSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
  },
  searchResults: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchResultText: {
    fontSize: 14,
    color: '#374151',
  },
  mapSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mapInstruction: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  mapContainer: {
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  homeMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  homeMarkerIcon: {
    fontSize: 20,
  },
  actions: {
    padding: 16,
  },
  currentLocationButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  currentLocationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeLocationSettingsScreen; 