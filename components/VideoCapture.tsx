import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as MediaLibrary from 'expo-media-library'
import { useAppSelector } from '../store'
import { supabase } from '../lib/supabase'
import * as FileSystem from 'expo-file-system'

const { width, height } = Dimensions.get('window')

// Conditional import for react-native-vision-camera (only available in development builds)
let Camera: any = null
let useCameraDevices: any = null
let useCameraPermission: any = null
let useMicrophonePermission: any = null

try {
  const visionCameraModule = require('react-native-vision-camera')
  Camera = visionCameraModule.Camera
  useCameraDevices = visionCameraModule.useCameraDevices
  useCameraPermission = visionCameraModule.useCameraPermission
  useMicrophonePermission = visionCameraModule.useMicrophonePermission
  console.log('✅ Vision Camera module loaded (development build)')
} catch (error) {
  console.log('⚠️ Vision Camera module not available (Expo Go mode)')
  console.log('   Advanced video recording requires a development build')
}

// Video duration options in seconds
const VIDEO_DURATIONS = [3, 5, 10, 30]

interface VideoCaptureProps {
  onVideoRecorded?: (videoUri: string) => void
  onClose?: () => void
}

export default function VideoCapture({ onVideoRecorded, onClose }: VideoCaptureProps) {
  // Check if Vision Camera is available
  if (!Camera || !useCameraDevices || !useCameraPermission || !useMicrophonePermission) {
    return (
      <View style={styles.container}>
        <View style={styles.unavailableContainer}>
          <Ionicons name="videocam-off" size={80} color="#666" />
          <Text style={styles.unavailableTitle}>Advanced Video Recording</Text>
          <Text style={styles.unavailableText}>
            Advanced video recording with react-native-vision-camera requires a development build.
          </Text>
          <Text style={styles.unavailableSubtext}>
            This feature is not available in Expo Go.
          </Text>
          
          <View style={styles.featuresList}>
            <Text style={styles.featuresTitle}>Available in Development Build:</Text>
            <Text style={styles.featureItem}>• Multiple video durations (3s, 5s, 10s, 30s)</Text>
            <Text style={styles.featureItem}>• Front/back camera switching</Text>
            <Text style={styles.featureItem}>• Real-time recording progress</Text>
            <Text style={styles.featureItem}>• Cloud storage integration</Text>
            <Text style={styles.featureItem}>• High-quality video recording</Text>
          </View>

          <View style={styles.buildInstructions}>
            <Text style={styles.buildTitle}>To enable video recording:</Text>
            <Text style={styles.buildStep}>1. Run: eas build --profile development</Text>
            <Text style={styles.buildStep}>2. Install the development build</Text>
            <Text style={styles.buildStep}>3. Full video features will be available</Text>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Back to Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // If Vision Camera is available, use the hooks
  const devices = useCameraDevices()
  const device = devices.find((d: any) => d.position === 'back')
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission()
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission()
  
  const [isRecording, setIsRecording] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState(10) // Default 10 seconds
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back')
  
  const cameraRef = useRef<any>(null)
  const progressAnimation = useRef(new Animated.Value(0)).current
  const recordingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const { user } = useAppSelector((state: any) => state.auth)

  useEffect(() => {
    checkPermissions()
  }, [])

  useEffect(() => {
    // Cleanup timers on unmount
    return () => {
      if (recordingTimer.current) {
        clearTimeout(recordingTimer.current)
      }
      if (progressTimer.current) {
        clearInterval(progressTimer.current)
      }
    }
  }, [])

  const checkPermissions = async () => {
    try {
      if (!hasCameraPermission) {
        const cameraStatus = await requestCameraPermission()
        if (!cameraStatus) {
          Alert.alert('Permission Required', 'Camera permission is required for video recording')
          return
        }
      }

      if (!hasMicrophonePermission) {
        const micStatus = await requestMicrophonePermission()
        if (!micStatus) {
          Alert.alert('Permission Required', 'Microphone permission is required for video recording')
          return
        }
      }
    } catch (error) {
      console.error('Error checking permissions:', error)
    }
  }

  const startRecording = async () => {
    if (!cameraRef.current || !device || isRecording) return

    try {
      setIsRecording(true)
      setRecordingProgress(0)
      
      // Reset and start progress animation
      progressAnimation.setValue(0)
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: selectedDuration * 1000,
        useNativeDriver: false,
      }).start()

      // Start progress tracking
      let progress = 0
      progressTimer.current = setInterval(() => {
        progress += 0.1
        setRecordingProgress(Math.min(progress / selectedDuration, 1))
      }, 100)

      // Start recording
      const video = await cameraRef.current.startRecording({
        onRecordingFinished: async (video: any) => {
          console.log('Video recorded:', video.path)
          await handleVideoRecorded(video.path)
        },
        onRecordingError: (error: any) => {
          console.error('Recording error:', error)
          Alert.alert('Recording Error', 'Failed to record video. Please try again.')
          resetRecording()
        },
      })

      // Auto-stop after selected duration
      recordingTimer.current = setTimeout(() => {
        stopRecording()
      }, selectedDuration * 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.')
      resetRecording()
    }
  }

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return

    try {
      await cameraRef.current.stopRecording()
      resetRecording()
    } catch (error) {
      console.error('Error stopping recording:', error)
      resetRecording()
    }
  }

  const resetRecording = () => {
    setIsRecording(false)
    setRecordingProgress(0)
    progressAnimation.setValue(0)
    
    if (recordingTimer.current) {
      clearTimeout(recordingTimer.current)
      recordingTimer.current = null
    }
    if (progressTimer.current) {
      clearInterval(progressTimer.current)
      progressTimer.current = null
    }
  }

  const handleVideoRecorded = async (videoPath: string) => {
    try {
      setIsUploading(true)

      // Save to device gallery
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync()
      if (mediaLibraryPermission.granted) {
        await MediaLibrary.saveToLibraryAsync(videoPath)
      }

      // Upload to Supabase if user is logged in
      if (user) {
        await uploadVideoToSupabase(videoPath)
        Alert.alert('Success!', 'Video saved to gallery and cloud storage', [
          { text: 'Record Another', onPress: () => {} },
          { text: 'Done', onPress: onClose }
        ])
      } else {
        Alert.alert('Success!', 'Video saved to gallery', [
          { text: 'Record Another', onPress: () => {} },
          { text: 'Done', onPress: onClose }
        ])
      }

      onVideoRecorded?.(videoPath)
    } catch (error) {
      console.error('Error handling recorded video:', error)
      Alert.alert('Error', 'Failed to save video. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const uploadVideoToSupabase = async (videoPath: string) => {
    try {
      console.log('Starting video upload for user:', user.id)
      
      // Create filename with user folder structure
      const timestamp = Date.now()
      const filename = `${user.id}/video_${timestamp}.mp4`
      
      console.log('Uploading video to path:', filename)

      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(videoPath, {
        encoding: FileSystem.EncodingType.Base64,
      })
      
      // Convert base64 to Uint8Array
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const uint8Array = new Uint8Array(byteNumbers)

      console.log('Video file size:', uint8Array.length, 'bytes')

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filename, uint8Array, {
          contentType: 'video/mp4',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      console.log('Upload successful:', uploadData)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filename)

      const videoUrl = urlData.publicUrl

      // Save video metadata to database
      const { data: videoData, error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          video_url: videoUrl,
          duration: selectedDuration,
          caption: '',
          is_public: true,
        })
        .select()

      if (dbError) {
        console.error('Database error:', dbError)
        throw new Error(`Database insert failed: ${dbError.message}`)
      }

      console.log('Video saved to database:', videoData)
      
      // Update user stats
      const { error: statsError } = await supabase
        .from('users')
        .update({
          stats: {
            ...user.stats,
            videos_shared: (user.stats.videos_shared || 0) + 1
          },
          snap_score: (user.snap_score || 0) + 15 // Give 15 points per video
        })
        .eq('id', user.id)

      if (statsError) {
        console.error('Error updating user stats:', statsError)
      }
      
    } catch (error) {
      console.error('Error uploading video to Supabase:', error)
      throw error
    }
  }

  const toggleCamera = () => {
    setCameraType(current => current === 'back' ? 'front' : 'back')
  }

  const getDurationButtonStyle = (duration: number) => [
    styles.durationButton,
    selectedDuration === duration && styles.selectedDurationButton
  ]

  const getDurationTextStyle = (duration: number) => [
    styles.durationText,
    selectedDuration === duration && styles.selectedDurationText
  ]

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera not available</Text>
      </View>
    )
  }

  if (!hasCameraPermission || !hasMicrophonePermission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>🎥 Video Recording</Text>
          <Text style={styles.permissionText}>
            We need camera and microphone access to record videos
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={checkPermissions}>
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const currentDevice = devices.find((d: any) => d.position === cameraType)

  if (!currentDevice) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Selected camera not available</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={currentDevice}
        isActive={true}
        video={true}
        audio={true}
      />

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Video Capture</Text>
        
        <TouchableOpacity style={styles.flipButton} onPress={toggleCamera}>
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Duration Selection */}
      <View style={styles.durationContainer}>
        {VIDEO_DURATIONS.map((duration) => (
          <TouchableOpacity
            key={duration}
            style={getDurationButtonStyle(duration)}
            onPress={() => setSelectedDuration(duration)}
            disabled={isRecording}
          >
            <Text style={getDurationTextStyle(duration)}>{duration}s</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recording Progress */}
      {isRecording && (
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]}
          />
          <Text style={styles.progressText}>
            {Math.ceil((1 - recordingProgress) * selectedDuration)}s
          </Text>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <View style={styles.recordingInfo}>
          <Text style={styles.recordingText}>
            {isRecording ? 'Recording...' : `Ready to record ${selectedDuration}s video`}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordingButton
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isUploading}
        >
          <View style={[
            styles.recordButtonInner,
            isRecording && styles.recordingButtonInner
          ]}>
            {isUploading ? (
              <Text style={styles.uploadingText}>Saving...</Text>
            ) : (
              <Ionicons 
                name={isRecording ? "stop" : "videocam"} 
                size={32} 
                color="white" 
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
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
  unavailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  unavailableTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  unavailableText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  unavailableSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  featuresList: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFC00',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 14,
    color: '#ddd',
    marginBottom: 6,
    lineHeight: 20,
  },
  buildInstructions: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    width: '100%',
  },
  buildTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 12,
  },
  buildStep: {
    fontSize: 14,
    color: '#ddd',
    marginBottom: 6,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#FFFC00',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  closeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
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
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationContainer: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  durationButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  selectedDurationButton: {
    backgroundColor: '#FFFC00',
  },
  durationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedDurationText: {
    color: '#000',
  },
  progressContainer: {
    position: 'absolute',
    top: 200,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFC00',
    borderRadius: 2,
  },
  progressText: {
    position: 'absolute',
    top: 10,
    right: 0,
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recordingInfo: {
    marginBottom: 20,
  },
  recordingText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: 'rgba(255,68,68,0.3)',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFC00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButtonInner: {
    backgroundColor: '#ff4444',
  },
  uploadingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
}) 