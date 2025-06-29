import { Platform, Dimensions, PixelRatio } from 'react-native'

/**
 * Android-specific optimizations and utilities
 * Handles performance, memory, and compatibility issues
 */

export class AndroidOptimizations {
  
  /**
   * Check if device is Android and get version info
   */
  static getAndroidInfo() {
    if (Platform.OS !== 'android') {
      return { isAndroid: false }
    }

    return {
      isAndroid: true,
      version: Platform.Version,
      isAndroid11Plus: Platform.Version >= 30,
      isAndroid13Plus: Platform.Version >= 33,
      isLowEndDevice: this.isLowEndDevice()
    }
  }

  /**
   * Detect low-end Android devices for performance optimizations
   */
  static isLowEndDevice(): boolean {
    if (Platform.OS !== 'android') return false

    const { width, height } = Dimensions.get('window')
    const pixelDensity = PixelRatio.get()
    const totalPixels = width * height * pixelDensity

    // Consider device low-end if:
    // - Low pixel density
    // - Small screen resolution
    // - Older Android version
    return (
      pixelDensity < 2 ||
      totalPixels < 1920 * 1080 ||
      Platform.Version < 28
    )
  }

  /**
   * Get optimized image quality based on device capability
   */
  static getOptimalImageQuality(): number {
    if (Platform.OS !== 'android') return 0.8

    const isLowEnd = this.isLowEndDevice()
    
    if (isLowEnd) {
      return 0.6 // Lower quality for low-end devices
    }
    
    return 0.8 // Standard quality for modern devices
  }

  /**
   * Get optimized batch sizes for list rendering
   */
  static getOptimalBatchSizes() {
    if (Platform.OS !== 'android') {
      return {
        initialNumToRender: 10,
        maxToRenderPerBatch: 10,
        windowSize: 21
      }
    }

    const isLowEnd = this.isLowEndDevice()
    
    if (isLowEnd) {
      return {
        initialNumToRender: 5,
        maxToRenderPerBatch: 3,
        windowSize: 7
      }
    }

    return {
      initialNumToRender: 8,
      maxToRenderPerBatch: 5,
      windowSize: 15
    }
  }

  /**
   * Check if device supports modern Android features
   */
  static getFeatureSupport() {
    const androidInfo = this.getAndroidInfo()
    
    if (!androidInfo.isAndroid) {
      return {
        scopedStorage: false,
        notificationChannels: false,
        backgroundRestrictions: false,
        edgeToEdge: false
      }
    }

    return {
      scopedStorage: androidInfo.isAndroid11Plus,
      notificationChannels: androidInfo.version >= 26,
      backgroundRestrictions: androidInfo.version >= 28,
      edgeToEdge: androidInfo.version >= 29
    }
  }

  /**
   * Get Android-safe file operations config
   */
  static getFileOperationsConfig() {
    const androidInfo = this.getAndroidInfo()
    
    if (!androidInfo.isAndroid) {
      return {
        useMediaStore: false,
        requiresLegacyStorage: false,
        maxFileSize: 50 * 1024 * 1024 // 50MB
      }
    }

    return {
      useMediaStore: androidInfo.isAndroid11Plus,
      requiresLegacyStorage: !androidInfo.isAndroid11Plus,
      maxFileSize: androidInfo.isLowEndDevice ? 10 * 1024 * 1024 : 25 * 1024 * 1024
    }
  }

  /**
   * Get memory-safe operation limits
   */
  static getMemoryLimits() {
    const isLowEnd = this.isLowEndDevice()
    
    return {
      maxConcurrentUploads: isLowEnd ? 1 : 2,
      maxImageCacheSize: isLowEnd ? 50 : 100, // Number of images
      maxBase64Size: isLowEnd ? 2 * 1024 * 1024 : 5 * 1024 * 1024, // Bytes
      shouldUseImageCache: !isLowEnd
    }
  }

  /**
   * Android-specific performance warnings
   */
  static logPerformanceWarnings() {
    if (Platform.OS !== 'android') return

    const androidInfo = this.getAndroidInfo()
    const isLowEnd = this.isLowEndDevice()

    if (isLowEnd) {
      console.warn('🚨 Low-end Android device detected - enabling performance optimizations')
    }

    if (!androidInfo.isAndroid11Plus) {
      console.warn('⚠️ Android 10 or below - using legacy storage methods')
    }

    if (androidInfo.version < 26) {
      console.warn('⚠️ Android API level < 26 - notifications may be limited')
    }
  }

  /**
   * Initialize Android-specific optimizations
   */
  static initialize() {
    if (Platform.OS !== 'android') return

    this.logPerformanceWarnings()
    
    // Set up Android-specific console logging
    if (__DEV__) {
      console.log('🤖 Android Optimizations initialized:', {
        version: Platform.Version,
        isLowEnd: this.isLowEndDevice(),
        features: this.getFeatureSupport(),
        memoryLimits: this.getMemoryLimits()
      })
    }
  }
}

export default AndroidOptimizations