import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  StatusBar,
  Dimensions,
  Modal,
} from 'react-native'
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera'
import * as MediaLibrary from 'expo-media-library'
import * as FileSystem from 'expo-file-system'
import { Ionicons } from '@expo/vector-icons'
import { useAppSelector } from '../store'
import { supabase } from '../lib/supabase'
import ImageFilters from '../components/ImageFilters'

const { width, height } = Dimensions.get('window')

type CameraMode = 'photo'

export default function CameraScreen() {
  const [mode, setMode] = useState<CameraMode>('photo')
  const [facing, setFacing] = useState<CameraType>('back')
  const [flash, setFlash] = useState<FlashMode>('off')
  const [permission, requestPermission] = useCameraPermissions()
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<MediaLibrary.PermissionResponse | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filteredPhotoUri, setFilteredPhotoUri] = useState<string | null>(null)
  const cameraRef = useRef<CameraView>(null)
  const { user } = useAppSelector((state: any) => state.auth)

  useEffect(() => {
    // Request media library permissions
    (async () => {
      const mediaPermission = await MediaLibrary.requestPermissionsAsync()
      setMediaLibraryPermission(mediaPermission)
    })()
  }, [])

  if (!permission) {
    // Camera permissions are still loading
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>📸 Camera Access</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to take photos and videos
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'))
  }

  const toggleFlash = () => {
    setFlash(current => {
      if (current === 'off') return 'on'
      if (current === 'on') return 'auto'
      return 'off'
    })
  }

  const getFlashIcon = () => {
    switch (flash) {
      case 'on': return 'flash'
      case 'auto': return 'flash-outline'
      default: return 'flash-off'
    }
  }

  const takePicture = async () => {
    if (!cameraRef.current) return

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      })

      if (photo) {
        setCapturedPhoto(photo.uri)
      }
    } catch (error) {
      console.error('Error taking picture:', error)
      Alert.alert('Error', 'Failed to take picture')
    }
  }

  const savePhoto = async (photoUri?: string) => {
    const uriToSave = photoUri || filteredPhotoUri || capturedPhoto
    if (!uriToSave) return

    try {
      setIsUploading(true)

      // Save to device gallery
      if (mediaLibraryPermission?.granted) {
        await MediaLibrary.saveToLibraryAsync(uriToSave)
      }

      // Upload to Supabase if user is logged in
      if (user) {
        console.log('Attempting upload for user:', {
          id: user.id,
          email: user.email,
          userObject: user
        })
        try {
          await uploadToSupabase(uriToSave)
          Alert.alert('Success!', 'Photo saved to gallery and cloud storage', [
            { text: 'Take Another', onPress: () => {
              setCapturedPhoto(null)
              setFilteredPhotoUri(null)
              setShowFilters(false)
            }},
            { text: 'Done', onPress: () => {
              setCapturedPhoto(null)
              setFilteredPhotoUri(null)
              setShowFilters(false)
            }}
          ])
        } catch (uploadError: any) {
          // Photo saved locally but cloud upload failed
          console.error('Cloud upload failed:', uploadError)
          
          if (uploadError.message?.includes('Bucket not found')) {
            Alert.alert(
              'Setup Required', 
              'Photo saved locally, but cloud storage needs setup. Please run the storage setup script in Supabase.',
              [
                { text: 'Take Another', onPress: () => {
                  setCapturedPhoto(null)
                  setFilteredPhotoUri(null)
                  setShowFilters(false)
                }},
                { text: 'Done', onPress: () => {
                  setCapturedPhoto(null)
                  setFilteredPhotoUri(null)
                  setShowFilters(false)
                }}
              ]
            )
          } else if (uploadError.message?.includes('row-level security')) {
            Alert.alert(
              'Permission Error', 
              'Photo saved locally, but cloud upload was blocked. Please check your account permissions.',
              [
                { text: 'Take Another', onPress: () => {
                  setCapturedPhoto(null)
                  setFilteredPhotoUri(null)
                  setShowFilters(false)
                }},
                { text: 'Done', onPress: () => {
                  setCapturedPhoto(null)
                  setFilteredPhotoUri(null)
                  setShowFilters(false)
                }}
              ]
            )
          } else {
            Alert.alert(
              'Partial Success', 
              'Photo saved locally, but cloud backup failed. You can try again later.',
              [
                { text: 'Take Another', onPress: () => {
                  setCapturedPhoto(null)
                  setFilteredPhotoUri(null)
                  setShowFilters(false)
                }},
                { text: 'Done', onPress: () => {
                  setCapturedPhoto(null)
                  setFilteredPhotoUri(null)
                  setShowFilters(false)
                }}
              ]
            )
          }
        }
      } else {
        // Not logged in, only local save
        Alert.alert('Success!', 'Photo saved to gallery', [
          { text: 'Take Another', onPress: () => {
            setCapturedPhoto(null)
            setFilteredPhotoUri(null)
            setShowFilters(false)
          }},
          { text: 'Done', onPress: () => {
            setCapturedPhoto(null)
            setFilteredPhotoUri(null)
            setShowFilters(false)
          }}
        ])
      }
    } catch (error) {
      console.error('Error saving photo:', error)
      Alert.alert('Error', 'Failed to save photo. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const uploadToSupabase = async (photoUri: string) => {
    try {
      console.log('Starting upload for user:', user.id)
      
      // Create filename with user folder structure (required for RLS)
      const timestamp = Date.now()
      const filename = `${user.id}/photo_${timestamp}.jpg`
      
      console.log('Uploading to path:', filename)

      // Read file as base64 for more reliable upload
      const base64Data = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      })
      
      // Convert base64 to Uint8Array for Supabase
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const uint8Array = new Uint8Array(byteNumbers)

      console.log('File size:', uint8Array.length, 'bytes')

      // Upload using Supabase client (should be more reliable)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filename, uint8Array, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      console.log('Upload successful:', uploadData)

      // Try signed URL first (more reliable than public URL)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('photos')
        .createSignedUrl(filename, 60 * 60 * 24 * 365) // 1 year expiry

      let imageUrl: string
      
      if (signedUrlError) {
        console.error('Signed URL error:', signedUrlError)
        // Fallback to public URL
        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(filename)
        imageUrl = urlData.publicUrl
        console.log('Using public URL (fallback):', imageUrl)
      } else {
        imageUrl = signedUrlData.signedUrl
        console.log('Using signed URL:', imageUrl)
      }
      
      // Test if the URL is accessible
      try {
        const testResponse = await fetch(imageUrl)
        console.log('URL accessibility test:', testResponse.status, testResponse.ok)
        if (!testResponse.ok) {
          const errorText = await testResponse.text()
          console.error('URL error response:', errorText)
        }
      } catch (testError) {
        console.error('URL not accessible:', testError)
      }

      // Save photo metadata to database
      const { data: photoData, error: dbError } = await supabase
        .from('photos')
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          caption: '',
          is_public: true,
        })
        .select()

      if (dbError) {
        console.error('Database error:', dbError)
        console.error('Current user ID:', user.id)
        throw new Error(`Database insert failed: ${dbError.message}`)
      }

      console.log('Photo saved to database:', photoData)
      
      // Update user stats - increment snaps_shared count
      const { error: statsError } = await supabase
        .from('users')
        .update({
          stats: {
            ...user.stats,
            snaps_shared: (user.stats.snaps_shared || 0) + 1
          },
          snap_score: (user.snap_score || 0) + 10 // Give 10 points per photo
        })
        .eq('id', user.id)

      if (statsError) {
        console.error('Error updating user stats:', statsError)
      } else {
        console.log('User stats updated - snaps shared:', (user.stats.snaps_shared || 0) + 1)
      }
      
    } catch (error) {
      console.error('Error uploading to Supabase:', error)
      throw error
    }
  }

  const discardPhoto = () => {
    setCapturedPhoto(null)
    setFilteredPhotoUri(null)
    setShowFilters(false)
  }

  const openFilters = () => {
    if (capturedPhoto) {
      setShowFilters(true)
    }
  }

  const handleFilterApplied = (filteredUri: string) => {
    setFilteredPhotoUri(filteredUri)
  }

  const handleFilterSave = (uri: string) => {
    setFilteredPhotoUri(uri)
    setShowFilters(false)
    savePhoto(uri)
  }

  const handleFilterClose = () => {
    setShowFilters(false)
  }

  // Show photo preview if photo was captured
  if (capturedPhoto && !showFilters) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Image 
          source={{ uri: filteredPhotoUri || capturedPhoto }} 
          style={styles.previewImage} 
        />
        
        <View style={styles.previewControls}>
          <TouchableOpacity style={styles.previewButton} onPress={discardPhoto}>
            <Ionicons name="close" size={30} color="white" />
            <Text style={styles.previewButtonText}>Discard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.previewButton} onPress={openFilters}>
            <Ionicons name="color-palette" size={30} color="white" />
            <Text style={styles.previewButtonText}>Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.previewButton, styles.saveButton]} 
            onPress={() => savePhoto()}
            disabled={isUploading}
          >
            <Ionicons name="download" size={30} color="white" />
            <Text style={styles.previewButtonText}>
              {isUploading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Show filter modal
  if (showFilters && capturedPhoto) {
    return (
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ImageFilters
          imageUri={capturedPhoto}
          onFilterApplied={handleFilterApplied}
          onClose={handleFilterClose}
          onSave={handleFilterSave}
        />
      </Modal>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Ionicons name={getFlashIcon()} size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.flashIndicator}>
            <Text style={styles.flashText}>{flash.toUpperCase()}</Text>
          </View>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'photo' && styles.activeModeButton]}
            onPress={() => setMode('photo')}
          >
            <Ionicons name="camera" size={20} color={mode === 'photo' ? '#000' : 'white'} />
            <Text style={[styles.modeText, mode === 'photo' && styles.activeModeText]}>Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.galleryButton}>
            <Ionicons name="images" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.captureButton} 
            onPress={takePicture}
          >
            <View style={[styles.captureButtonInner, mode === 'video' && styles.videoCaptureButton]}>
              <Ionicons 
                name={mode === 'photo' ? 'camera' : 'videocam'} 
                size={24} 
                color={mode === 'photo' ? '#000' : 'white'} 
              />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#FFFC00',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashIndicator: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  flashText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modeSelector: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  activeModeButton: {
    backgroundColor: '#FFFC00',
  },
  modeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  activeModeText: {
    color: '#000',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFC00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoCaptureButton: {
    backgroundColor: '#ff4444',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'cover',
  },
  previewControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previewButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  saveButton: {
    backgroundColor: '#FFFC00',
  },
  previewButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
}) 