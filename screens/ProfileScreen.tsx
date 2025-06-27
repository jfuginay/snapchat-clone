import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  Image,
  ActionSheetIOS,
  Platform,
  ActivityIndicator
} from 'react-native'
import { useAppSelector } from '../store'
import { useAuth } from '../services/AuthService'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import type { NavigationProp } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { Ionicons } from '@expo/vector-icons'
import type { RootStackParamList } from '../types/navigation'

type NavigationProps = NavigationProp<RootStackParamList>

export default function ProfileScreen() {
  const { user } = useAppSelector((state) => state.auth)
  const { signOut, linkTwitterAccount, updateProfile } = useAuth()
  const navigation = useNavigation<NavigationProps>()
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [twitterLinking, setTwitterLinking] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarModalVisible, setAvatarModalVisible] = useState(false)
  const [realStats, setRealStats] = useState({
    snaps_shared: 0,
    friends_count: 0,
    photos_count: 0
  })
  const [updatedUser, setUpdatedUser] = useState(user)

  useEffect(() => {
    if (user) {
      loadRealStats()
    }
  }, [user])

  // Refresh stats when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadRealStats()
      }
    }, [user])
  )

  const loadRealStats = async () => {
    if (!user) return

    try {
      console.log('Loading real stats for user:', user.id)
      
      // Get actual photo count from database
      const { count: photoCount, error: photoError } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (photoError) {
        console.error('Error counting photos:', photoError)
      }

      // Get updated user data from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('Error fetching user data:', userError)
      } else {
        setUpdatedUser(userData)
        console.log('Updated user data:', userData)
      }

      // Get friends count (when friendship system is implemented)
      const { count: friendsCount, error: friendsError } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')

      if (friendsError) {
        console.error('Error counting friends:', friendsError)
      }

      const realStatsData = {
        snaps_shared: userData?.stats?.snaps_shared || photoCount || 0,
        friends_count: friendsCount || 0,
        photos_count: photoCount || 0
      }

      setRealStats(realStatsData)
      console.log('Real stats loaded:', realStatsData)
      
    } catch (error) {
      console.error('Error loading real stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadRealStats()
    setRefreshing(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const goToLocationSettings = () => {
    navigation.navigate('LocationSettings' as never)
  }

  const goToHomeLocationSettings = () => {
    navigation.navigate('HomeLocationSettings' as never)
  }

  const goToActivitiesSettings = () => {
    navigation.navigate('Activities' as never)
  }

  const handleTwitterLink = async () => {
    try {
      setTwitterLinking(true)

      const result = await linkTwitterAccount()

      if (result.error) {
        Alert.alert('Twitter Linking Error', result.error)
      } else {
        Alert.alert(
          'Twitter Linking Started',
          'Your browser will open to link your Twitter account. After authorization, return to the app.',
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while linking Twitter account')
    } finally {
      setTwitterLinking(false)
    }
  }

  /**
   * Handle avatar press - show options to change profile picture
   */
  const handleAvatarPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto()
          } else if (buttonIndex === 2) {
            pickFromGallery()
          }
        }
      )
    } else {
      // For Android, show modal
      setAvatarModalVisible(true)
    }
  }

  /**
   * Take a new photo for avatar
   */
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for avatar
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error taking photo:', error)
      Alert.alert('Error', 'Failed to take photo. Please try again.')
    }
  }

  /**
   * Pick image from gallery for avatar
   */
  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery permission is required to select photos')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for avatar
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error picking from gallery:', error)
      Alert.alert('Error', 'Failed to select photo. Please try again.')
    }
  }

  /**
   * Upload avatar to Supabase and update user profile
   */
  const uploadAvatar = async (imageUri: string) => {
    if (!user) return

    try {
      setUploadingAvatar(true)

      // Create filename for avatar
      const timestamp = Date.now()
      const filename = `${user.id}/avatar_${timestamp}.jpg`

      console.log('Uploading avatar to path:', filename)

      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Convert base64 to Uint8Array for Supabase
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const uint8Array = new Uint8Array(byteNumbers)

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filename, uint8Array, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      console.log('Avatar upload successful:', uploadData)

      // Get signed URL for the avatar
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('photos')
        .createSignedUrl(filename, 60 * 60 * 24 * 365) // 1 year expiry

      let avatarUrl: string

      if (signedUrlError) {
        console.error('Signed URL error:', signedUrlError)
        // Fallback to public URL
        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(filename)
        avatarUrl = urlData.publicUrl
      } else {
        avatarUrl = signedUrlData.signedUrl
      }

      // Update user profile with new avatar
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar: avatarUrl })
        .eq('id', user.id)

      if (updateError) {
        throw new Error(`Profile update failed: ${updateError.message}`)
      }

      // Update local auth state
      await updateProfile({ avatar: avatarUrl })

      // Update local state
      setUpdatedUser(prev => ({ ...prev, avatar: avatarUrl } as any))

      Alert.alert('Success!', 'Profile picture updated successfully!')

    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      Alert.alert('Upload Failed', error.message || 'Failed to update profile picture. Please try again.')
    } finally {
      setUploadingAvatar(false)
      setAvatarModalVisible(false)
    }
  }

  /**
   * Render avatar with upload functionality
   */
  const renderAvatar = () => {
    const currentUser = updatedUser || user
    const avatarSource = currentUser?.avatar && currentUser.avatar.startsWith('http') 
      ? { uri: currentUser.avatar }
      : null

    return (
      <TouchableOpacity 
        style={styles.avatarContainerWrapper} 
        onPress={handleAvatarPress}
        disabled={uploadingAvatar}
      >
        {uploadingAvatar ? (
          <View style={styles.avatarLoading}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        ) : avatarSource ? (
          <Image source={avatarSource} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatar}>{currentUser?.avatar}</Text>
        )}
        
        {/* Camera icon overlay - only show when no image is uploaded */}
        {!avatarSource && !uploadingAvatar && (
          <View style={styles.cameraIconOverlay}>
            <Ionicons name="camera" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    )
  }

  if (!user) {
    return null
  }

  const displayUser = updatedUser || user
  const hasTwitterLinked = displayUser?.social_accounts?.twitter?.id

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000"
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.avatarContainerWrapper}>
            {renderAvatar()}
          </View>
          <Text style={styles.displayName}>{displayUser.display_name}</Text>
          <Text style={styles.username}>@{displayUser.username}</Text>
          <Text style={styles.bio}>{displayUser.bio || 'No bio yet'}</Text>
          
          {/* Twitter Account Status */}
          {hasTwitterLinked && (
            <View style={styles.twitterBadge}>
              <Text style={styles.twitterBadgeText}>
                🐦 Linked to @{displayUser.social_accounts?.twitter?.username}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{realStats.snaps_shared}</Text>
            <Text style={styles.statLabel}>Snaps</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{realStats.friends_count}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{displayUser.snap_score || 0}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
        </View>

        <View style={styles.photoStats}>
          <Text style={styles.photoStatsText}>
            📸 {realStats.photos_count} photos in gallery
          </Text>
        </View>

        <View style={styles.settings}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={goToLocationSettings}>
            <Text style={styles.settingIcon}>📍</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Location Settings</Text>
              <Text style={styles.settingSubtitle}>Privacy and sharing controls</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={goToHomeLocationSettings}>
            <Text style={styles.settingIcon}>🏠</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Home Location</Text>
              <Text style={styles.settingSubtitle}>Set your home address</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={goToActivitiesSettings}>
            <Text style={styles.settingIcon}>🎯</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Activities & Interests</Text>
              <Text style={styles.settingSubtitle}>Select your favorite activities</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          {/* Twitter Account Linking */}
          <TouchableOpacity 
            style={[styles.settingItem, twitterLinking && styles.settingItemDisabled]} 
            onPress={handleTwitterLink}
            disabled={twitterLinking || Boolean(hasTwitterLinked)}
          >
            <Text style={styles.settingIcon}>🐦</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>
                {hasTwitterLinked ? 'Twitter Account' : 'Link Twitter'}
              </Text>
              <Text style={styles.settingSubtitle}>
                {hasTwitterLinked 
                  ? `Connected to @${displayUser.social_accounts?.twitter?.username}` 
                  : 'Connect your Twitter account'
                }
              </Text>
            </View>
            <Text style={[
              styles.settingArrow, 
              hasTwitterLinked && styles.settingArrowLinked
            ]}>
              {twitterLinking ? '⏳' : hasTwitterLinked ? '✅' : '›'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>👥</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Friends</Text>
              <Text style={styles.settingSubtitle}>Manage your friends list</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>🔔</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Push notification settings</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Social Accounts Section */}
        <View style={styles.settings}>
          <Text style={styles.sectionTitle}>Connected Accounts</Text>
          
          {hasTwitterLinked ? (
            <View style={styles.connectedAccountItem}>
              <Text style={styles.settingIcon}>🐦</Text>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Twitter</Text>
                <Text style={styles.settingSubtitle}>
                  @{displayUser.social_accounts?.twitter?.username}
                  {displayUser.social_accounts?.twitter?.verified && ' ✓'}
                </Text>
              </View>
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noAccountsItem}>
              <Text style={styles.noAccountsText}>
                💡 Link your social accounts to expand your network and discover more tribe members
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Android Avatar Modal */}
        {Platform.OS === 'android' && (
          <Modal
            visible={avatarModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setAvatarModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Change Profile Picture</Text>
                
                <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
                  <Ionicons name="camera" size={24} color="#6366f1" />
                  <Text style={styles.modalOptionText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.modalOption} onPress={pickFromGallery}>
                  <Ionicons name="images" size={24} color="#6366f1" />
                  <Text style={styles.modalOptionText}>Choose from Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalOption, styles.cancelOption]} 
                  onPress={() => setAvatarModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                  <Text style={[styles.modalOptionText, styles.cancelText]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1',
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
  },
  avatarContainerWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    fontSize: 40,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 20,
    borderRadius: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  settings: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    padding: 20,
    paddingBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 15,
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
  settingArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  signOutButton: {
    backgroundColor: '#000',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoStats: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  photoStatsText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  twitterBadge: {
    backgroundColor: '#000',
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
  },
  twitterBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  connectedAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  connectedBadge: {
    backgroundColor: '#000',
    padding: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  connectedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noAccountsItem: {
    padding: 20,
    alignItems: 'center',
  },
  noAccountsText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  settingItemDisabled: {
    backgroundColor: '#f0f0f0',
  },
  settingArrowLinked: {
    color: '#000',
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  cameraIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 40,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 10,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginLeft: 10,
  },
  cancelOption: {
    backgroundColor: '#f0f0f0',
  },
  cancelText: {
    color: '#666',
  },
}) 