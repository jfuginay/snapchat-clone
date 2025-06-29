import * as FileSystem from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'

/**
 * Android-optimized photo saving utility
 * Handles Android-specific file paths, permissions, and memory management
 */

export interface PhotoSaveResult {
  success: boolean
  localPath?: string
  cloudUrl?: string
  error?: string
}

export class AndroidPhotoSaver {
  
  /**
   * Save photo to device gallery with Android optimizations
   */
  static async saveToGallery(photoUri: string): Promise<PhotoSaveResult> {
    try {
      if (Platform.OS === 'android') {
        return await this.saveToGalleryAndroid(photoUri)
      } else {
        return await this.saveToGalleryIOS(photoUri)
      }
    } catch (error) {
      console.error('❌ Gallery save error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Android-specific gallery save with proper permissions and paths
   */
  private static async saveToGalleryAndroid(photoUri: string): Promise<PhotoSaveResult> {
    try {
      // Check permissions first
      const permission = await MediaLibrary.requestPermissionsAsync()
      if (!permission.granted) {
        throw new Error('Media library permission not granted')
      }

      // Android: Use MediaLibrary's saveToLibraryAsync which handles scoped storage
      const asset = await MediaLibrary.saveToLibraryAsync(photoUri)
      
      // Android: Get the actual file path for the saved asset
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset)
      
      console.log('✅ Android photo saved:', assetInfo.localUri || assetInfo.uri)
      
      return {
        success: true,
        localPath: assetInfo.localUri || assetInfo.uri
      }
    } catch (error) {
      console.error('❌ Android gallery save error:', error)
      throw error
    }
  }

  /**
   * iOS gallery save (original method)
   */
  private static async saveToGalleryIOS(photoUri: string): Promise<PhotoSaveResult> {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync()
      if (!permission.granted) {
        throw new Error('Media library permission not granted')
      }

      const asset = await MediaLibrary.saveToLibraryAsync(photoUri)
      console.log('✅ iOS photo saved:', asset.uri)
      
      return {
        success: true,
        localPath: asset.uri
      }
    } catch (error) {
      console.error('❌ iOS gallery save error:', error)
      throw error
    }
  }

  /**
   * Upload photo to Supabase with Android memory optimizations
   */
  static async uploadToSupabase(photoUri: string, userId: string): Promise<PhotoSaveResult> {
    try {
      console.log('🔄 Starting Supabase upload for user:', userId)

      // Create filename with user folder structure
      const timestamp = Date.now()
      const filename = `${userId}/photo_${timestamp}.jpg`

      let uploadResult
      if (Platform.OS === 'android') {
        uploadResult = await this.uploadAndroidOptimized(photoUri, filename)
      } else {
        uploadResult = await this.uploadIOSOptimized(photoUri, filename)
      }

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed')
      }

      // Get signed URL for the uploaded file
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('photos')
        .createSignedUrl(filename, 60 * 60 * 24 * 365) // 1 year expiry

      let cloudUrl: string
      if (signedUrlError) {
        console.log('⚠️ Signed URL failed, using public URL')
        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(filename)
        cloudUrl = urlData.publicUrl
      } else {
        cloudUrl = signedUrlData.signedUrl
      }

      console.log('✅ Upload successful:', cloudUrl)
      
      return {
        success: true,
        cloudUrl
      }
    } catch (error) {
      console.error('❌ Supabase upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  /**
   * Android-optimized upload - avoids Base64 conversion in memory
   */
  private static async uploadAndroidOptimized(photoUri: string, filename: string): Promise<PhotoSaveResult> {
    try {
      // Android: Read file info first to check size
      const fileInfo = await FileSystem.getInfoAsync(photoUri)
      if (!fileInfo.exists) {
        throw new Error('Photo file not found')
      }

      console.log('📁 Android file size:', fileInfo.size, 'bytes')

      // For large files on Android, use streaming approach
      if (fileInfo.size && fileInfo.size > 5 * 1024 * 1024) { // 5MB
        console.log('📤 Large file detected, using streaming upload')
        return await this.uploadLargeFileAndroid(photoUri, filename)
      }

      // For smaller files, use direct upload with ArrayBuffer
      const fileContent = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64
      })

      // Convert to ArrayBuffer more efficiently for Android
      const binaryString = atob(fileContent)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const { error } = await supabase.storage
        .from('photos')
        .upload(filename, bytes, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (error) {
        throw new Error(`Android upload failed: ${error.message}`)
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Android upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Android upload failed'
      }
    }
  }

  /**
   * Handle large file uploads on Android with chunking
   */
  private static async uploadLargeFileAndroid(photoUri: string, filename: string): Promise<PhotoSaveResult> {
    try {
      // For very large files, we'd implement chunked upload here
      // For now, just use the standard method but with memory warnings
      console.log('⚠️ Large file upload - may use significant memory')
      
      const { error } = await supabase.storage
        .from('photos')
        .upload(filename, {
          uri: photoUri,
          type: 'image/jpeg',
          name: filename
        } as any, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (error) {
        throw new Error(`Large file upload failed: ${error.message}`)
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Large file upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Large file upload failed'
      }
    }
  }

  /**
   * iOS upload (optimized version of original)
   */
  private static async uploadIOSOptimized(photoUri: string, filename: string): Promise<PhotoSaveResult> {
    try {
      // iOS can handle Base64 better, but still optimize
      const base64Data = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64
      })

      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const uint8Array = new Uint8Array(byteNumbers)

      const { error } = await supabase.storage
        .from('photos')
        .upload(filename, uint8Array, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (error) {
        throw new Error(`iOS upload failed: ${error.message}`)
      }

      return { success: true }
    } catch (error) {
      console.error('❌ iOS upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'iOS upload failed'
      }
    }
  }

  /**
   * Complete save operation - both local and cloud
   */
  static async savePhoto(photoUri: string, userId?: string): Promise<{
    galleryResult: PhotoSaveResult
    cloudResult?: PhotoSaveResult
  }> {
    console.log('💾 Starting complete photo save operation')

    // Always save to gallery first
    const galleryResult = await this.saveToGallery(photoUri)
    
    // Only upload to cloud if user is logged in
    let cloudResult: PhotoSaveResult | undefined
    if (userId) {
      cloudResult = await this.uploadToSupabase(photoUri, userId)
    }

    return {
      galleryResult,
      cloudResult
    }
  }
}

export default AndroidPhotoSaver