import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAppSelector } from '../store'

const { width } = Dimensions.get('window')
const ITEM_SIZE = (width - 60) / 3 // 3 columns with padding

interface Photo {
  id: string
  user_id: string
  image_url: string
  caption: string
  is_public: boolean
  created_at: string
}

interface PhotoGalleryProps {
  userId?: string
}

export default function PhotoGallery({ userId }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const { user } = useAppSelector((state: any) => state.auth)

  const targetUserId = userId || user?.id

  useEffect(() => {
    if (targetUserId) {
      loadPhotos()
    }
  }, [targetUserId])

  const loadPhotos = async () => {
    try {
      setLoading(true)
      
      // Test bucket access
      console.log('Testing bucket access...')
      const { data: bucketList, error: bucketError } = await supabase.storage
        .from('photos')
        .list(targetUserId, { limit: 5 })
      
      if (bucketError) {
        console.error('Bucket access error:', bucketError)
      } else {
        console.log('Bucket files found:', bucketList)
      }
      
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading photos:', error)
        return
      }

      console.log('Loaded photos from database:', data)
      if (data && data.length > 0) {
        console.log('First photo URL:', data[0].image_url)
        
        // Try creating a signed URL for testing
        try {
          const filename = data[0].image_url.split('/').pop()
          if (filename) {
            const { data: signedData, error: signedError } = await supabase.storage
              .from('photos')
              .createSignedUrl(`${targetUserId}/${filename}`, 3600)
            
            if (signedError) {
              console.error('Signed URL error:', signedError)
            } else {
              console.log('Test signed URL:', signedData.signedUrl)
            }
          }
        } catch (signedTestError) {
          console.error('Signed URL test failed:', signedTestError)
        }
      }

      setPhotos(data || [])
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const deletePhoto = async (photo: Photo) => {
    if (photo.user_id !== user?.id) {
      Alert.alert('Error', 'You can only delete your own photos')
      return
    }

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from database
              const { error: dbError } = await supabase
                .from('photos')
                .delete()
                .eq('id', photo.id)

              if (dbError) {
                throw dbError
              }

              // Delete from storage
              const filename = photo.image_url.split('/').pop()
              if (filename) {
                await supabase.storage
                  .from('photos')
                  .remove([filename])
              }

              // Update local state
              setPhotos(photos.filter(p => p.id !== photo.id))
              setModalVisible(false)
              setSelectedPhoto(null)

              Alert.alert('Success', 'Photo deleted successfully')
            } catch (error) {
              console.error('Error deleting photo:', error)
              Alert.alert('Error', 'Failed to delete photo')
            }
          }
        }
      ]
    )
  }

  const openPhotoModal = (photo: Photo) => {
    setSelectedPhoto(photo)
    setModalVisible(true)
  }

  const renderPhoto = ({ item }: { item: Photo }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => openPhotoModal(item)}
    >
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.photoImage}
        onLoad={() => console.log('Image loaded successfully:', item.image_url)}
        onError={(error) => console.error('Image failed to load:', item.image_url, error.nativeEvent)}
        onLoadStart={() => console.log('Image loading started:', item.image_url)}
      />
    </TouchableOpacity>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="camera-outline" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>No photos yet</Text>
      <Text style={styles.emptySubtitle}>
        {userId && userId !== user?.id 
          ? 'This user hasn\'t shared any photos yet'
          : 'Start capturing moments with the camera!'
        }
      </Text>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          📸 Photos ({photos.length})
        </Text>
        {!userId || userId === user?.id ? (
          <TouchableOpacity onPress={() => {
            console.log('Manual refresh triggered')
            loadPhotos()
          }}>
            <Ionicons name="refresh" size={20} color="#000" />
          </TouchableOpacity>
        ) : null}
      </View>

      {photos.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Photo Modal */}
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
          
          {selectedPhoto && (
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selectedPhoto.image_url }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              
              <View style={styles.modalControls}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="white" />
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>

                {selectedPhoto.user_id === user?.id && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={() => deletePhoto(selectedPhoto)}
                  >
                    <Ionicons name="trash" size={24} color="white" />
                    <Text style={styles.modalButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.photoInfo}>
                <Text style={styles.photoDate}>
                  {new Date(selectedPhoto.created_at).toLocaleDateString()}
                </Text>
                {selectedPhoto.caption && (
                  <Text style={styles.photoCaption}>{selectedPhoto.caption}</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  grid: {
    paddingHorizontal: 20,
  },
  photoItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 15,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalImage: {
    width: '100%',
    height: '70%',
    borderRadius: 10,
  },
  modalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  modalButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 80,
  },
  deleteButton: {
    backgroundColor: 'rgba(255,0,0,0.3)',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  photoInfo: {
    marginTop: 15,
    alignItems: 'center',
  },
  photoDate: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
  photoCaption: {
    color: 'white',
    fontSize: 16,
    marginTop: 5,
    textAlign: 'center',
  },
}) 