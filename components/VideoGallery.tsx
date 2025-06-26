import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
} from 'react-native'
import { Video, ResizeMode } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAppSelector } from '../store'

const { width } = Dimensions.get('window')
const ITEM_SIZE = (width - 60) / 2 // 2 columns for videos

interface VideoRecord {
  id: string
  user_id: string
  video_url: string
  duration: number
  caption: string
  is_public: boolean
  created_at: string
}

interface VideoGalleryProps {
  userId?: string
}

export default function VideoGallery({ userId }: VideoGalleryProps) {
  const [videos, setVideos] = useState<VideoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const { user } = useAppSelector((state: any) => state.auth)

  useEffect(() => {
    loadVideos()
  }, [userId])

  const loadVideos = async () => {
    try {
      setLoading(true)
      console.log('Loading videos for user:', userId || user?.id)

      let query = supabase
        .from('videos')
        .select('*')

      if (userId && userId !== user?.id) {
        // Loading another user's public videos
        query = query.eq('user_id', userId).eq('is_public', true)
      } else if (userId === user?.id || !userId) {
        // Loading current user's videos (all videos)
        query = query.eq('user_id', user?.id)
      } else {
        // Loading public videos from all users
        query = query.eq('is_public', true)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading videos:', error)
        throw error
      }

      console.log('Videos loaded:', data?.length || 0)
      setVideos(data || [])
    } catch (error) {
      console.error('Error loading videos:', error)
      Alert.alert('Error', 'Failed to load videos. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const openVideoModal = (video: VideoRecord) => {
    setSelectedVideo(video)
    setModalVisible(true)
  }

  const deleteVideo = async (video: VideoRecord) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting video:', video.id)

              // Delete from database
              const { error: dbError } = await supabase
                .from('videos')
                .delete()
                .eq('id', video.id)

              if (dbError) {
                console.error('Database delete error:', dbError)
                throw new Error(`Failed to delete video: ${dbError.message}`)
              }

              // Try to delete from storage (optional - don't fail if this doesn't work)
              try {
                const filename = video.video_url.split('/').pop()
                if (filename) {
                  const { error: storageError } = await supabase.storage
                    .from('videos')
                    .remove([`${user.id}/${filename}`])
                  
                  if (storageError) {
                    console.warn('Storage delete warning:', storageError)
                  }
                }
              } catch (storageError) {
                console.warn('Could not delete from storage:', storageError)
              }

              // Update local state
              setVideos(prev => prev.filter(v => v.id !== video.id))
              setModalVisible(false)
              setSelectedVideo(null)

              // Update user stats
              const { error: statsError } = await supabase
                .from('users')
                .update({
                  stats: {
                    ...user.stats,
                    videos_shared: Math.max((user.stats.videos_shared || 1) - 1, 0)
                  },
                  snap_score: Math.max((user.snap_score || 15) - 15, 0)
                })
                .eq('id', user.id)

              if (statsError) {
                console.error('Error updating user stats:', statsError)
              }

              Alert.alert('Success', 'Video deleted successfully')
            } catch (error: any) {
              console.error('Error deleting video:', error)
              Alert.alert('Error', error.message || 'Failed to delete video')
            }
          }
        }
      ]
    )
  }

  const renderVideo = ({ item }: { item: VideoRecord }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => openVideoModal(item)}
    >
      <Video
        source={{ uri: item.video_url }}
        style={styles.videoThumbnail}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isLooping={false}
        useNativeControls={false}
      />
      <View style={styles.videoOverlay}>
        <Ionicons name="play" size={24} color="white" />
        <Text style={styles.videoDuration}>{item.duration}s</Text>
      </View>
    </TouchableOpacity>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="videocam-outline" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>No videos yet</Text>
      <Text style={styles.emptySubtitle}>
        {userId && userId !== user?.id 
          ? 'This user hasn\'t shared any videos yet'
          : 'Start recording moments with the video camera!'
        }
      </Text>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          🎥 Videos ({videos.length})
        </Text>
        {!userId || userId === user?.id ? (
          <TouchableOpacity onPress={() => {
            console.log('Manual refresh triggered')
            loadVideos()
          }}>
            <Ionicons name="refresh" size={20} color="#000" />
          </TouchableOpacity>
        ) : null}
      </View>

      {videos.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideo}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Video Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
          />
          
          {selectedVideo && (
            <View style={styles.modalContent}>
              <Video
                source={{ uri: selectedVideo.video_url }}
                style={styles.modalVideo}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={true}
                isLooping={true}
                useNativeControls={true}
              />
              
              <View style={styles.modalControls}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="white" />
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>

                {selectedVideo.user_id === user?.id && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={() => deleteVideo(selectedVideo)}
                  >
                    <Ionicons name="trash" size={24} color="white" />
                    <Text style={styles.modalButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.videoInfo}>
                <Text style={styles.videoDate}>
                  {new Date(selectedVideo.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.videoDurationInfo}>
                  Duration: {selectedVideo.duration} seconds
                </Text>
                {selectedVideo.caption && (
                  <Text style={styles.videoCaption}>{selectedVideo.caption}</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    margin: 10,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    margin: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  grid: {
    paddingBottom: 20,
  },
  videoItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE * 1.5, // Video aspect ratio
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoDuration: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 15,
    padding: 20,
    justifyContent: 'center',
  },
  modalVideo: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 10,
  },
  modalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  deleteButton: {
    backgroundColor: 'rgba(255,68,68,0.7)',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  videoInfo: {
    marginTop: 15,
    alignItems: 'center',
  },
  videoDate: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  videoDurationInfo: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 8,
  },
  videoCaption: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}) 