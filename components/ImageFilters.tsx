import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImageManipulator from 'expo-image-manipulator'
import * as MediaLibrary from 'expo-media-library'
import { PHOTO_FILTERS, FilterEffect } from '../services/PhotoFilters'

const { width, height } = Dimensions.get('window')

interface ImageFiltersProps {
  imageUri: string
  onFilterApplied: (filteredUri: string) => void
  onClose: () => void
  onSave: (uri: string) => void
}

export default function ImageFilters({
  imageUri,
  onFilterApplied,
  onClose,
  onSave,
}: ImageFiltersProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('original')
  const [filteredImage, setFilteredImage] = useState<string>(imageUri)
  const [isProcessing, setIsProcessing] = useState(false)
  const [filterPreviews, setFilterPreviews] = useState<Record<string, string>>({})

  useEffect(() => {
    // Initialize with original image
    setFilterPreviews({ original: imageUri })
  }, [imageUri])

  const applyFilter = async (filter: FilterEffect) => {
    if (filter.id === selectedFilter) return
    
    setIsProcessing(true)
    try {
      let processedUri = filterPreviews[filter.id]
      
      if (!processedUri) {
        // Apply the filter transformation
        processedUri = await filter.transform(imageUri)
        setFilterPreviews(prev => ({ ...prev, [filter.id]: processedUri }))
      }
      
      setSelectedFilter(filter.id)
      setFilteredImage(processedUri)
      onFilterApplied(processedUri)
    } catch (error) {
      console.error('Error applying filter:', error)
      Alert.alert('Error', 'Failed to apply filter')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSave = () => {
    onSave(filteredImage)
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Filters</Text>
        
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={handleSave}
          disabled={isProcessing}
        >
          <Ionicons name="checkmark" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Image Preview */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: filteredImage }}
          style={styles.previewImage}
          resizeMode="cover"
        />
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <Text style={styles.processingText}>Applying filter...</Text>
          </View>
        )}
      </View>

      {/* Filter Selection */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollView}
        >
          {PHOTO_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.selectedFilterButton,
              ]}
              onPress={() => applyFilter(filter)}
              disabled={isProcessing}
            >
              <View style={[
                styles.filterIconContainer,
                selectedFilter === filter.id && styles.selectedFilterIcon,
              ]}>
                <Ionicons
                  name={filter.icon as any}
                  size={20}
                  color={selectedFilter === filter.id ? '#000' : 'white'}
                />
              </View>
              <Text
                style={[
                  styles.filterName,
                  selectedFilter === filter.id && styles.selectedFilterName,
                ]}
              >
                {filter.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filter Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Tap a filter to apply it to your photo
        </Text>
        {PHOTO_FILTERS.find(f => f.id === selectedFilter)?.description && (
          <Text style={styles.filterDescription}>
            {PHOTO_FILTERS.find(f => f.id === selectedFilter)?.description}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: {
    width: width,
    height: height * 0.6,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filtersContainer: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingVertical: 20,
  },
  filtersScrollView: {
    paddingHorizontal: 16,
  },
  filterButton: {
    alignItems: 'center',
    marginRight: 16,
    opacity: 0.7,
  },
  selectedFilterButton: {
    opacity: 1,
  },
  filterIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFilterIcon: {
    backgroundColor: '#FFFC00',
    borderColor: '#FFFC00',
  },
  filterName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedFilterName: {
    color: '#FFFC00',
  },
  instructionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  instructionsText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  filterDescription: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
})
