import React from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Switch, 
  TouchableOpacity 
} from 'react-native'
import { useAppSelector, useAppDispatch } from '../store'
import { 
  setShareLocation, 
  setPrivacyLevel, 
  setGhostMode,
  setShowPreciseLocation 
} from '../store/privacySlice'

export default function LocationSettingsScreen() {
  const dispatch = useAppDispatch()
  const { shareLocation, privacyLevel, ghostMode, showPreciseLocation } = useAppSelector(
    (state) => state.privacy
  )
  const { currentLocation, isTracking } = useAppSelector((state) => state.location)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Sharing</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Share Location</Text>
              <Text style={styles.settingSubtitle}>
                Allow friends to see your location
              </Text>
            </View>
            <Switch
              value={shareLocation}
              onValueChange={(value) => { dispatch(setShareLocation(value)) }}
              trackColor={{ false: '#ccc', true: '#FFFC00' }}
              thumbColor={'white'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Precise Location</Text>
              <Text style={styles.settingSubtitle}>
                Show exact location vs approximate area
              </Text>
            </View>
            <Switch
              value={showPreciseLocation}
              onValueChange={(value) => { dispatch(setShowPreciseLocation(value)) }}
              trackColor={{ false: '#ccc', true: '#FFFC00' }}
              thumbColor={'white'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Level</Text>
          
          {(['everyone', 'friends', 'custom', 'nobody'] as const).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.privacyOption,
                privacyLevel === level && styles.privacyOptionSelected
              ]}
              onPress={() => dispatch(setPrivacyLevel(level))}
            >
              <Text style={[
                styles.privacyOptionText,
                privacyLevel === level && styles.privacyOptionTextSelected
              ]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
              {privacyLevel === level && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghost Mode</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Ghost Mode</Text>
              <Text style={styles.settingSubtitle}>
                Hide from all friends temporarily
              </Text>
            </View>
            <Switch
              value={ghostMode.enabled}
              onValueChange={(value) => 
                { dispatch(setGhostMode({ enabled: value, duration: '1h' })) }
              }
              trackColor={{ false: '#ccc', true: '#FFFC00' }}
              thumbColor={'white'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Status</Text>
          
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Location Tracking</Text>
            <Text style={styles.statusValue}>
              {isTracking ? '🟢 Active' : '🔴 Inactive'}
            </Text>
          </View>

          {currentLocation && (
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>Current Location</Text>
              <Text style={styles.statusValue}>
                📍 {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </Text>
              <Text style={styles.statusSubtitle}>
                Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  privacyOptionSelected: {
    backgroundColor: '#FFFC00',
  },
  privacyOptionText: {
    fontSize: 16,
    color: '#000',
  },
  privacyOptionTextSelected: {
    fontWeight: 'bold',
  },
  checkmark: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  statusCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 14,
    color: '#333',
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
}) 