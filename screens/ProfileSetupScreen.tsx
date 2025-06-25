import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAppSelector } from '../store';
import { supabase } from '../lib/supabase';
import ActivitySelector from '../components/ActivitySelector';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface ProfileData {
  avatar: string;
  username: string;
  display_name: string;
  bio: string;
  selectedActivities: string[];
}

const ProfileSetupScreen: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigation = useNavigation();
  
  // Form state
  const [profileData, setProfileData] = useState<ProfileData>({
    avatar: '😊',
    username: '',
    display_name: user?.display_name || '',
    bio: '',
    selectedActivities: [],
  });

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Refs
  const usernameRef = useRef<TextInput>(null);
  const displayNameRef = useRef<TextInput>(null);
  const bioRef = useRef<TextInput>(null);

  const totalSteps = 4;

  /**
   * Validate current step data
   */
  const validateStep = (step: number): boolean => {
    const errors: {[key: string]: string} = {};

    switch (step) {
      case 1: // Avatar & basic info
        if (!profileData.display_name.trim()) {
          errors.display_name = 'Display name is required';
        }
        if (!profileData.username.trim()) {
          errors.username = 'Username is required';
        } else if (profileData.username.length < 3) {
          errors.username = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(profileData.username)) {
          errors.username = 'Username can only contain letters, numbers, and underscores';
        }
        break;

      case 2: // Bio
        if (profileData.bio.length > 150) {
          errors.bio = 'Bio must be 150 characters or less';
        }
        break;

      case 3: // Activities
        if (profileData.selectedActivities.length === 0) {
          errors.activities = 'Please select at least one activity';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Check username availability
   */
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (!username.trim()) return false;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase())
        .neq('id', user?.id); // Exclude current user

      if (error) {
        console.error('Error checking username:', error);
        return false;
      }

      return data.length === 0; // Available if no matches
    } catch (error) {
      console.error('Username check failed:', error);
      return false;
    }
  };

  /**
   * Upload avatar photo to Supabase storage
   */
  const uploadAvatar = async (imageUri: string): Promise<string | null> => {
    try {
      setUploadingAvatar(true);

      // Create filename for avatar
      const timestamp = Date.now();
      const filename = `${user?.id}/avatar_${timestamp}.jpg`;

      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert to Uint8Array
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const uint8Array = new Uint8Array(byteNumbers);

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filename, uint8Array, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filename);

      return urlData.publicUrl;

    } catch (error) {
      console.error('Avatar upload failed:', error);
      Alert.alert('Upload Failed', 'Could not upload avatar. You can change it later in settings.');
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  /**
   * Handle avatar selection
   */
  const selectAvatar = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow photo library access to select an avatar.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for avatar
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setAvatarUri(imageUri);
        
        // Upload avatar and get URL
        const avatarUrl = await uploadAvatar(imageUri);
        if (avatarUrl) {
          setProfileData(prev => ({ ...prev, avatar: avatarUrl }));
        }
      }
    } catch (error) {
      console.error('Error selecting avatar:', error);
      Alert.alert('Error', 'Failed to select avatar. Please try again.');
    }
  };

  /**
   * Handle activity selection changes
   */
  const handleActivitySelection = (activityIds: string[]) => {
    setProfileData(prev => ({ ...prev, selectedActivities: activityIds }));
  };

  /**
   * Navigate to next step
   */
  const nextStep = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Additional username validation for step 1
    if (currentStep === 1) {
      const isAvailable = await checkUsernameAvailability(profileData.username);
      if (!isAvailable) {
        setValidationErrors({ username: 'Username is already taken' });
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeProfile();
    }
  };

  /**
   * Navigate to previous step
   */
  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Complete profile setup
   */
  const completeProfile = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setLoading(true);

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: profileData.username.toLowerCase(),
          display_name: profileData.display_name,
          bio: profileData.bio,
          avatar: avatarUri ? profileData.avatar : '😊', // Use uploaded avatar or emoji
          last_active: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Clear any existing user activities first
      await supabase
        .from('user_activities')
        .delete()
        .eq('user_id', user.id);

      // Add selected activities (ActivitySelector handles this internally, but we'll ensure consistency)
      if (profileData.selectedActivities.length > 0) {
        const activityInserts = profileData.selectedActivities.map(activityId => ({
          user_id: user.id,
          activity_id: activityId,
          skill_level: 'beginner', // Default skill level
          interest_level: 5,
          is_teaching: false,
          is_learning: true,
        }));

        const { error: activitiesError } = await supabase
          .from('user_activities')
          .insert(activityInserts);

        if (activitiesError) {
          console.error('Error saving activities:', activitiesError);
          // Don't fail the whole process for activities
        }
      }

      Alert.alert(
        '🎉 Welcome to TribeFind!', 
        'Your profile has been created successfully. Time to find your tribe!',
        [
          {
            text: 'Get Started',
            onPress: () => {
              // Navigate to main app
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' as never }],
              });
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error completing profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render progress indicator
   */
  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${(currentStep / totalSteps) * 100}%` }
          ]} 
        />
      </View>
    </View>
  );

  /**
   * Render step 1: Avatar & Basic Info
   */
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Let's set up your profile</Text>
      <Text style={styles.stepSubtitle}>Choose an avatar and tell us about yourself</Text>

      {/* Avatar Selection */}
      <View style={styles.avatarSection}>
        <TouchableOpacity 
          style={styles.avatarContainer} 
          onPress={selectAvatar}
          disabled={uploadingAvatar}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarEmoji}>😊</Text>
          )}
          {uploadingAvatar && (
            <View style={styles.avatarLoader}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
          <View style={styles.avatarEditIcon}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to add photo</Text>
      </View>

      {/* Display Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Display Name *</Text>
        <TextInput
          ref={displayNameRef}
          style={[styles.input, validationErrors.display_name && styles.inputError]}
          value={profileData.display_name}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, display_name: text }))}
          placeholder="How should people see your name?"
          maxLength={50}
          returnKeyType="next"
          onSubmitEditing={() => usernameRef.current?.focus()}
        />
        {validationErrors.display_name && (
          <Text style={styles.errorText}>{validationErrors.display_name}</Text>
        )}
      </View>

      {/* Username */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Username *</Text>
        <TextInput
          ref={usernameRef}
          style={[styles.input, validationErrors.username && styles.inputError]}
          value={profileData.username}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, username: text.toLowerCase() }))}
          placeholder="Choose a unique username"
          maxLength={30}
          autoCapitalize="none"
          returnKeyType="done"
        />
        {validationErrors.username && (
          <Text style={styles.errorText}>{validationErrors.username}</Text>
        )}
        <Text style={styles.inputHint}>Letters, numbers, and underscores only</Text>
      </View>
    </View>
  );

  /**
   * Render step 2: Bio
   */
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tell your story</Text>
      <Text style={styles.stepSubtitle}>Write a short bio to help others get to know you</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Bio</Text>
        <TextInput
          ref={bioRef}
          style={[styles.bioInput, validationErrors.bio && styles.inputError]}
          value={profileData.bio}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
          placeholder="Tell people about yourself, your interests, what you're looking for in your tribe..."
          maxLength={150}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>
          {profileData.bio.length}/150 characters
        </Text>
        {validationErrors.bio && (
          <Text style={styles.errorText}>{validationErrors.bio}</Text>
        )}
      </View>

      <View style={styles.tipContainer}>
        <Ionicons name="lightbulb-outline" size={20} color="#3B82F6" />
        <Text style={styles.tipText}>
          A good bio helps you connect with like-minded people in your area!
        </Text>
      </View>
    </View>
  );

  /**
   * Render step 3: Activity Selection
   */
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose your interests</Text>
      <Text style={styles.stepSubtitle}>Select activities you enjoy - this helps us find your tribe</Text>

      {validationErrors.activities && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{validationErrors.activities}</Text>
        </View>
      )}

      <View style={styles.activitySelectorContainer}>
        <ActivitySelector
          onSelectionChange={handleActivitySelection}
          showCategories={true}
          allowMultiSelect={true}
          maxSelections={10}
        />
      </View>
    </View>
  );

  /**
   * Render step 4: Review & Complete
   */
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Review your profile</Text>
      <Text style={styles.stepSubtitle}>Everything looks good? Let's get started!</Text>

      <View style={styles.reviewContainer}>
        {/* Avatar & Basic Info */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewAvatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.reviewAvatarImage} />
            ) : (
              <Text style={styles.reviewAvatarEmoji}>😊</Text>
            )}
          </View>
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewDisplayName}>{profileData.display_name}</Text>
            <Text style={styles.reviewUsername}>@{profileData.username}</Text>
            {profileData.bio && (
              <Text style={styles.reviewBio}>{profileData.bio}</Text>
            )}
          </View>
        </View>

        {/* Selected Activities */}
        <View style={styles.reviewActivities}>
          <Text style={styles.reviewSectionTitle}>
            Selected Interests ({profileData.selectedActivities.length})
          </Text>
          <Text style={styles.reviewActivitiesText}>
            You'll be matched with tribe members who share these interests in your area.
          </Text>
        </View>

        <View style={styles.finalTipContainer}>
          <Ionicons name="people" size={24} color="#10B981" />
          <Text style={styles.finalTipText}>
            Ready to find your tribe? We'll help you connect with like-minded people nearby!
          </Text>
        </View>
      </View>
    </View>
  );

  /**
   * Render navigation buttons
   */
  const renderNavigationButtons = () => (
    <View style={styles.navigationContainer}>
      {currentStep > 1 && (
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={previousStep}
          disabled={loading}
        >
          <Ionicons name="chevron-back" size={20} color="#6B7280" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={[
          styles.nextButton, 
          loading && styles.nextButtonDisabled,
          currentStep === 1 && styles.nextButtonFull
        ]} 
        onPress={nextStep}
        disabled={loading || uploadingAvatar}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.nextButtonText}>
              {currentStep === totalSteps ? 'Complete Profile' : 'Continue'}
            </Text>
            {currentStep < totalSteps && (
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#FFFC00', '#FFE135']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>TribeFind</Text>
            {renderProgressIndicator()}
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </ScrollView>

          {/* Navigation */}
          {renderNavigationButtons()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 15,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  avatarLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    fontSize: 14,
    color: '#6B7280',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  bioInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    height: 120,
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  tipText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  activitySelectorContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 10,
    minHeight: 400,
  },
  reviewContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  reviewSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  reviewAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  reviewAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  reviewAvatarEmoji: {
    fontSize: 32,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewDisplayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  reviewUsername: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  reviewBio: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
  },
  reviewActivities: {
    marginBottom: 25,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  reviewActivitiesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  finalTipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 15,
    borderRadius: 12,
  },
  finalTipText: {
    fontSize: 14,
    color: '#065F46',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 0.6,
    justifyContent: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 4,
  },
});

export default ProfileSetupScreen; 