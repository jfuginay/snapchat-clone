import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAppSelector } from '../store';
import aiLocationService from '../src/services/aiLocationService';

interface ActivitySuggestion {
  id: string;
  suggested_activity: string;
  activity_category: string;
  suggestion_reason: string;
  confidence_score: number;
  difficulty_level: string;
  estimated_duration: string;
  estimated_cost_range?: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  context_data: any;
}

interface ActivitySuggestionsProps {
  onSuggestionAccepted?: (suggestion: ActivitySuggestion) => void;
  onSuggestionCompleted?: (suggestion: ActivitySuggestion, rating: number) => void;
  maxSuggestions?: number;
  showExpired?: boolean;
}

const ActivitySuggestions: React.FC<ActivitySuggestionsProps> = ({
  onSuggestionAccepted,
  onSuggestionCompleted,
  maxSuggestions = 10,
  showExpired = false,
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ActivitySuggestion | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (user) {
      loadSuggestions();
    }
  }, [user]);

  /**
   * Load activity suggestions from the service
   */
  const loadSuggestions = async () => {
    try {
      setLoading(true);
      await aiLocationService.initialize(user!.id);
      const suggestionsData = await aiLocationService.getActivitySuggestions('pending', maxSuggestions);
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      Alert.alert('Error', 'Failed to load activity suggestions');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSuggestions();
    setRefreshing(false);
  };

  /**
   * Handle suggestion acceptance
   */
  const handleAcceptSuggestion = async (suggestion: ActivitySuggestion) => {
    try {
      await aiLocationService.updateSuggestionStatus(suggestion.id, 'accepted');
      
      // Update local state
      setSuggestions(prev => 
        prev.map(s => s.id === suggestion.id ? { ...s, status: 'accepted' } : s)
      );

      Alert.alert(
        'Activity Accepted! 🎉',
        `Great choice! "${suggestion.suggested_activity}" has been added to your activities.`,
        [
          {
            text: 'Start Activity',
            onPress: () => {
              onSuggestionAccepted?.(suggestion);
              setModalVisible(false);
            }
          },
          { text: 'Later', style: 'cancel', onPress: () => setModalVisible(false) }
        ]
      );
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      Alert.alert('Error', 'Failed to accept suggestion');
    }
  };

  /**
   * Handle suggestion rejection
   */
  const handleRejectSuggestion = async (suggestion: ActivitySuggestion, reason?: string) => {
    try {
      await (aiLocationService as any).updateSuggestionStatus(suggestion.id, 'rejected', reason);
      
      // Remove from local state
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      setModalVisible(false);

      Alert.alert('Suggestion Dismissed', 'Thanks for the feedback! This helps improve future suggestions.');
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      Alert.alert('Error', 'Failed to reject suggestion');
    }
  };

  /**
   * Handle activity completion
   */
  const handleCompleteActivity = (suggestion: ActivitySuggestion) => {
    setSelectedSuggestion(suggestion);
    setRatingModalVisible(true);
  };

  /**
   * Submit activity completion rating
   */
  const submitActivityRating = async () => {
    if (!selectedSuggestion || selectedRating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    try {
      await (aiLocationService as any).updateSuggestionStatus(
        selectedSuggestion.id,
        'completed',
        feedback || null,
        selectedRating
      );

      // Update local state
      setSuggestions(prev => 
        prev.map(s => s.id === selectedSuggestion.id ? { ...s, status: 'completed' } : s)
      );

      onSuggestionCompleted?.(selectedSuggestion, selectedRating);
      
      setRatingModalVisible(false);
      setSelectedRating(0);
      setFeedback('');
      setSelectedSuggestion(null);

      Alert.alert('Thanks! 🌟', 'Your feedback helps us provide better suggestions.');
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  /**
   * Get category icon for activity
   */
  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      fitness: '🏃‍♂️',
      social: '👥',
      entertainment: '🎭',
      food: '🍽️',
      shopping: '🛍️',
      outdoor: '🌳',
      cultural: '🎨',
      work: '💼',
      travel: '✈️',
      education: '📚',
    };
    return icons[category] || '🎯';
  };

  /**
   * Get confidence color based on score
   */
  const getConfidenceColor = (score: number): string => {
    if (score >= 0.8) return '#10B981'; // Green
    if (score >= 0.6) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  /**
   * Get time remaining until suggestion expires
   */
  const getTimeRemaining = (expiresAt: string): string => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h left`;
    }
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  /**
   * Render suggestion item
   */
  const renderSuggestionItem = ({ item }: { item: ActivitySuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionCard}
      onPress={() => {
        setSelectedSuggestion(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.suggestionHeader}>
        <View style={styles.categoryIcon}>
          <Text style={styles.categoryIconText}>{getCategoryIcon(item.activity_category)}</Text>
        </View>
        <View style={styles.suggestionInfo}>
          <Text style={styles.suggestionTitle}>{item.suggested_activity}</Text>
          <Text style={styles.suggestionCategory}>{item.activity_category.toUpperCase()}</Text>
        </View>
        <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(item.confidence_score) }]}>
          <Text style={styles.confidenceText}>{Math.round(item.confidence_score * 100)}%</Text>
        </View>
      </View>

      <Text style={styles.suggestionReason} numberOfLines={2}>
        {item.suggestion_reason}
      </Text>

      <View style={styles.suggestionMeta}>
        <Text style={styles.metaText}>⏱️ {item.estimated_duration}</Text>
        <Text style={styles.metaText}>📊 {item.difficulty_level}</Text>
        <Text style={[styles.metaText, styles.expiryText]}>
          {getTimeRemaining(item.expires_at)}
        </Text>
      </View>

      {item.status === 'accepted' && (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => handleCompleteActivity(item)}
        >
          <Text style={styles.completeButtonText}>Mark as Completed</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  /**
   * Render suggestion detail modal
   */
  const renderSuggestionModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedSuggestion && (
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalIcon}>{getCategoryIcon(selectedSuggestion.activity_category)}</Text>
                <Text style={styles.modalTitle}>{selectedSuggestion.suggested_activity}</Text>
                <Text style={styles.modalCategory}>{selectedSuggestion.activity_category.toUpperCase()}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Why this suggestion?</Text>
                <Text style={styles.sectionText}>{selectedSuggestion.suggestion_reason}</Text>
              </View>

              <View style={styles.modalMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Duration</Text>
                  <Text style={styles.metaValue}>{selectedSuggestion.estimated_duration}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Difficulty</Text>
                  <Text style={styles.metaValue}>{selectedSuggestion.difficulty_level}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Confidence</Text>
                  <Text style={[styles.metaValue, { color: getConfidenceColor(selectedSuggestion.confidence_score) }]}>
                    {Math.round(selectedSuggestion.confidence_score * 100)}%
                  </Text>
                </View>
              </View>

              {selectedSuggestion.estimated_cost_range && (
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Estimated Cost</Text>
                  <Text style={styles.sectionText}>{selectedSuggestion.estimated_cost_range}</Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptSuggestion(selectedSuggestion)}
                >
                  <Text style={styles.acceptButtonText}>✨ Let's Do It!</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleRejectSuggestion(selectedSuggestion, 'Not interested')}
                >
                  <Text style={styles.rejectButtonText}>Not Interested</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.laterButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.laterButtonText}>Maybe Later</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  /**
   * Render rating modal
   */
  const renderRatingModal = () => (
    <Modal
      visible={ratingModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setRatingModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>How was your activity?</Text>
          <Text style={styles.modalSubtitle}>Rate "{selectedSuggestion?.suggested_activity}"</Text>

          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={styles.ratingButton}
                onPress={() => setSelectedRating(rating)}
              >
                <Text style={[
                  styles.ratingText,
                  selectedRating >= rating && styles.ratingSelected
                ]}>
                  ⭐
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.acceptButton, selectedRating === 0 && styles.disabledButton]}
              onPress={submitActivityRating}
              disabled={selectedRating === 0}
            >
              <Text style={styles.acceptButtonText}>Submit Rating</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={() => setRatingModalVisible(false)}
            >
              <Text style={styles.laterButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading AI suggestions...</Text>
      </View>
    );
  }

  if (suggestions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🤖</Text>
        <Text style={styles.emptyTitle}>No Suggestions Yet</Text>
        <Text style={styles.emptyText}>
          Move around and explore new places! Our AI will suggest activities based on your location and interests.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 AI Activity Suggestions</Text>
        <Text style={styles.headerSubtitle}>Personalized activities based on your location and interests</Text>
      </View>

      <FlatList
        data={suggestions}
        renderItem={renderSuggestionItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {renderSuggestionModal()}
      {renderRatingModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8F9FA',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 24,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  suggestionCategory: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionReason: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  suggestionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  expiryText: {
    fontWeight: '500',
  },
  completeButton: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    fontSize: 64,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalCategory: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  modalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalActions: {
    gap: 12,
  },
  acceptButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 10,
  },
  ratingButton: {
    padding: 8,
  },
  ratingText: {
    fontSize: 32,
    opacity: 0.3,
  },
  ratingSelected: {
    opacity: 1,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default ActivitySuggestions; 