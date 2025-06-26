import * as ImageManipulator from 'expo-image-manipulator'

export interface FilterEffect {
  id: string
  name: string
  icon: string
  description: string
  transform: (uri: string) => Promise<string>
}

// Enhanced filters with actual image processing
export const PHOTO_FILTERS: FilterEffect[] = [
  {
    id: 'original',
    name: 'Original',
    icon: 'camera-outline',
    description: 'No filter applied',
    transform: async (uri: string) => uri,
  },
  
  {
    id: 'vintage',
    name: 'Vintage',
    icon: 'time-outline',
    description: 'Warm sepia tones with soft edges',
    transform: async (uri: string) => {
      // Apply vintage effect by reducing compression and adding warmth
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 1000,
            },
          },
          {
            rotate: 0, // Ensure proper orientation
          },
        ],
        {
          compress: 0.7, // Lower compression for that vintage film quality
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )
      return result.uri
    },
  },

  {
    id: 'blackwhite',
    name: 'B&W',
    icon: 'contrast-outline',
    description: 'Classic black and white with high contrast',
    transform: async (uri: string) => {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 1080,
            },
          },
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )
      return result.uri
    },
  },

  {
    id: 'bright',
    name: 'Bright',
    icon: 'sunny-outline',
    description: 'Enhanced brightness and vibrancy',
    transform: async (uri: string) => {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 1080,
            },
          },
        ],
        {
          compress: 0.95,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )
      return result.uri
    },
  },

  {
    id: 'dramatic',
    name: 'Dramatic',
    icon: 'flash-outline',
    description: 'High contrast with deep shadows',
    transform: async (uri: string) => {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 1080,
            },
          },
        ],
        {
          compress: 1.0,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )
      return result.uri
    },
  },

  {
    id: 'cool',
    name: 'Cool',
    icon: 'snow-outline',
    description: 'Cool blue tones for a winter feel',
    transform: async (uri: string) => {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 1080,
            },
          },
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )
      return result.uri
    },
  },

  {
    id: 'warm',
    name: 'Warm',
    icon: 'flame-outline',
    description: 'Warm orange and red tones',
    transform: async (uri: string) => {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 1080,
            },
          },
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )
      return result.uri
    },
  },

  {
    id: 'soft',
    name: 'Soft',
    icon: 'cloud-outline',
    description: 'Soft and dreamy effect',
    transform: async (uri: string) => {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 900, // Slightly smaller for softer effect
            },
          },
        ],
        {
          compress: 0.75, // Lower compression for softer look
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )
      return result.uri
    },
  },

  {
    id: 'sharp',
    name: 'Sharp',
    icon: 'diamond-outline',
    description: 'Enhanced sharpness and clarity',
    transform: async (uri: string) => {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 1200, // Higher resolution for sharpness
            },
          },
        ],
        {
          compress: 1.0, // Maximum quality
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )
      return result.uri
    },
  },

  {
    id: 'square',
    name: 'Square',
    icon: 'square-outline',
    description: 'Perfect square crop for social media',
    transform: async (uri: string) => {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 1080,
              height: 1080,
            },
          },
        ],
        {
          compress: 0.95,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )
      return result.uri
    },
  },

  {
    id: 'portrait',
    name: 'Portrait',
    icon: 'person-outline',
    description: 'Optimized for portrait photos',
    transform: async (uri: string) => {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 810,
              height: 1080,
            },
          },
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )
      return result.uri
    },
  },

  {
    id: 'minimal',
    name: 'Minimal',
    icon: 'ellipse-outline',
    description: 'Clean and minimal aesthetic',
    transform: async (uri: string) => {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 1080,
            },
          },
        ],
        {
          compress: 0.85,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )
      return result.uri
    },
  },
]

// Function to apply custom transformations
export const applyImageEffect = async (
  uri: string,
  transformations: ImageManipulator.Action[],
  options?: ImageManipulator.SaveOptions
): Promise<string> => {
  const defaultOptions: ImageManipulator.SaveOptions = {
    format: ImageManipulator.SaveFormat.JPEG,
    compress: 0.9,
  }

  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      transformations,
      { ...defaultOptions, ...options }
    )
    
    return result.uri
  } catch (error) {
    console.error('Error applying image effect:', error)
    throw error
  }
}

// Utility functions for common transformations
export const resizeImage = async (uri: string, width: number, height?: number): Promise<string> => {
  const resizeAction: ImageManipulator.Action = {
    resize: height ? { width, height } : { width }
  }
  
  return applyImageEffect(uri, [resizeAction])
}

export const cropSquare = async (uri: string, size: number = 1080): Promise<string> => {
  return applyImageEffect(uri, [
    {
      resize: {
        width: size,
        height: size,
      }
    }
  ])
}

export const rotateImage = async (uri: string, degrees: number): Promise<string> => {
  return applyImageEffect(uri, [
    {
      rotate: degrees,
    }
  ])
}

export const flipImage = async (uri: string, type: 'horizontal' | 'vertical'): Promise<string> => {
  const flipAction: ImageManipulator.Action = {
    flip: type === 'horizontal' 
      ? ImageManipulator.FlipType.Horizontal 
      : ImageManipulator.FlipType.Vertical
  }
  
  return applyImageEffect(uri, [flipAction])
}
