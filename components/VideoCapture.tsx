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
import { Camera, useCameraDevices, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera'
import { Ionicons } from '@expo/vector-icons'
import * as MediaLibrary from 'expo-media-library'
import { useAppSelector } from '../store'
import { supabase } from '../lib/supabase'
import * as FileSystem from 'expo-file-system'

const { width, height } = Dimensions.get('window')

// Video duration options in seconds
const VIDEO_DURATIONS = [3, 5, 10, 30]

interface VideoCaptureProps {
  onVideoRecorded?: (videoUri: string) => void
  onClose?: () => void
}

export default function VideoCapture({ onVideoRecorded, onClose }: VideoCaptureProps) {
  const devices = useCameraDevices()
  const device = devices.find(d => d.position === 'back')
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission()
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission()
  
  const [isRecording, setIsRecording] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState(10) // Default 10 seconds
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back')
  
  const cameraRef = useRef<Camera>(null)
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
        onRecordingFinished: async (video) => {
          console.log('Video recorded:', video.path)
          await handleVideoRecorded(video.path)
        },
        onRecordingError: (error) => {
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
      const filename = `${user.id}/video_${timestamp}_${selectedDuration}s.mp4`
      
      console.log('Uploading video to path:', filename)

      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(videoPath, {
        encoding: FileSystem.EncodingType.Base64,
      })
      
      // Convert base64 to Uint8Array for Supabase
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const uint8Array = new Uint8Array(byteNumbers)

      console.log('Video file size:', uint8Array.length, 'bytes')

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos') // We'll create a videos bucket
        .upload(filename, uint8Array, {
          contentType: 'video/mp4',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      console.log('Video upload successful:', uploadData)

      // Get signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('videos')
        .createSignedUrl(filename, 60 * 60 * 24 * 365) // 1 year expiry

      let videoUrl: string
      
      if (signedUrlError) {
        console.error('Signed URL error:', signedUrlError)
        const { data: urlData } = supabase.storage
          .from('videos')
          .getPublicUrl(filename)
        videoUrl = urlData.publicUrl
      } else {
        videoUrl = signedUrlData.signedUrl
      }

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

  const currentDevice = devices.find(d => d.position === cameraType)

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
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
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
    top: 180,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#FFFC00',
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
  progressText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 80,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  recordingButton: {
    borderColor: '#ff4444',
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButtonInner: {
    borderRadius: 8,
  },
  uploadingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
}) 