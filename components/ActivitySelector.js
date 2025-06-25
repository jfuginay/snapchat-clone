import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../services/AuthService';

/**
 * ActivitySelector Component for TribeFind
 * Allows users to select activities/interests with skill levels
 * Saves selections to user_activities table in Supabase
 */
const ActivitySelector = ({ 
  onSelectionChange = () => {}, 
  showCategories = true,
  allowMultiSelect = true,
  maxSelections = null,
  selectedCategory = null 
}) => {
  const { user } = useAuth();
  
  // State management
  const [activities, setActivities] = useState([]);
  const [userActivities, setUserActivities] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(selectedCategory);
  const [skillModalVisible, setSkillModalVisible] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [categories, setCategories] = useState([]);

  // Skill level options
  const skillLevels = [
    { value: 'beginner', label: 'Beginner', icon: '🌱', description: 'Just starting out' },
    { value: 'intermediate', label: 'Intermediate', icon: '🌿', description: 'Some experience' },
    { value: 'advanced', label: 'Advanced', icon: '🌳', description: 'Very experienced' },
  ];

  // Load activities and user selections on component mount
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  /**
   * Load activities and user selections from Supabase
   */
  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadActivities(),
        loadUserActivities()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load all available activities from Supabase
   */
  const loadActivities = async () => {
    console.log('🔍 ActivitySelector: Starting loadActivities...');
    console.log('🔍 ActivitySelector: User exists:', !!user);
    console.log('🔍 ActivitySelector: User ID:', user?.id);

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('is_active', true)
      .order('popularity_score', { ascending: false });

    console.log('🔍 ActivitySelector: Query result:', {
      dataCount: data?.length,
      error: error,
      sampleData: data?.slice(0, 3)?.map(a => ({ 
        name: a.name, 
        is_active: a.is_active,
        category: a.category 
      }))
    });

    if (error) {
      console.error('❌ ActivitySelector: Error loading activities:', error);
      throw error;
    }

    setActivities(data || []);
    console.log('✅ ActivitySelector: Set activities count:', data?.length);
    
    // Extract unique categories
    const uniqueCategories = [...new Set(data?.map(activity => activity.category) || [])];
    setCategories(uniqueCategories);
    console.log('✅ ActivitySelector: Set categories:', uniqueCategories);
  };

  /**
   * Load user's selected activities
   */
  const loadUserActivities = async () => {
    if (!user) {
      console.log('🔍 ActivitySelector: No user found, skipping user activities');
      return;
    }

    console.log('🔍 ActivitySelector: Loading user activities for user:', user.id);

    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select(`
          *,
          activities (
            id,
            name,
            category,
            icon,
            color
          )
        `)
        .eq('user_id', user.id);

      console.log('🔍 ActivitySelector: User activities query result:', {
        dataCount: data?.length,
        error: error,
        sampleData: data?.slice(0, 2)
      });

      if (error) {
        console.error('❌ ActivitySelector: Error loading user activities:', error);
        // Don't throw error, just log it and continue with empty state
        setUserActivities([]);
        setSelectedActivities(new Map());
        return;
      }

      setUserActivities(data || []);
      
      // Create selection map
      const selectionMap = new Map();
      data?.forEach(userActivity => {
        selectionMap.set(userActivity.activity_id, {
          skill_level: userActivity.skill_level,
          interest_level: userActivity.interest_level,
          is_teaching: userActivity.is_teaching,
          is_learning: userActivity.is_learning,
          notes: userActivity.notes
        });
      });
      
      setSelectedActivities(selectionMap);
      console.log('✅ ActivitySelector: User activities loaded successfully, selections:', selectionMap.size);

    } catch (error) {
      console.error('❌ ActivitySelector: Exception loading user activities:', error);
      // Don't throw error, just log it and continue with empty state
      setUserActivities([]);
      setSelectedActivities(new Map());
    }
  };

  /**
   * Handle activity selection/deselection
   */
  const handleActivityPress = (activity) => {
    if (selectedActivities.has(activity.id)) {
      // Deselect activity
      handleDeselectActivity(activity.id);
    } else {
      // Select activity - show skill level modal
      setCurrentActivity(activity);
      setSkillModalVisible(true);
    }
  };

  /**
   * Handle activity selection with skill level
   */
  const handleSelectActivity = async (activity, skillLevel) => {
    if (!allowMultiSelect && selectedActivities.size >= 1) {
      Alert.alert('Limit Reached', 'You can only select one activity.');
      return;
    }

    if (maxSelections && selectedActivities.size >= maxSelections) {
      Alert.alert('Limit Reached', `You can only select ${maxSelections} activities.`);
      return;
    }

    const selection = {
      skill_level: skillLevel,
      interest_level: 5,
      is_teaching: false,
      is_learning: true,
      notes: ''
    };

    // Update local state
    const newSelections = new Map(selectedActivities);
    newSelections.set(activity.id, selection);
    setSelectedActivities(newSelections);

    // Save to database
    await saveActivitySelection(activity.id, selection);
    
    // Close modal
    setSkillModalVisible(false);
    setCurrentActivity(null);

    // Notify parent component
    onSelectionChange(Array.from(newSelections.keys()));
  };

  /**
   * Handle activity deselection
   */
  const handleDeselectActivity = async (activityId) => {
    // Update local state
    const newSelections = new Map(selectedActivities);
    newSelections.delete(activityId);
    setSelectedActivities(newSelections);

    // Remove from database
    await removeActivitySelection(activityId);

    // Notify parent component
    onSelectionChange(Array.from(newSelections.keys()));
  };

  /**
   * Save activity selection to Supabase
   */
  const saveActivitySelection = async (activityId, selection) => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('user_activities')
        .upsert({
          user_id: user.id,
          activity_id: activityId,
          ...selection
        });

      if (error) {
        console.error('Error saving activity selection:', error);
        Alert.alert('Error', 'Failed to save activity selection.');
        return false;
      }

      console.log('✅ Activity selection saved successfully');
      return true;

    } catch (error) {
      console.error('Error saving activity selection:', error);
      Alert.alert('Error', 'Failed to save activity selection.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Remove activity selection from Supabase
   */
  const removeActivitySelection = async (activityId) => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('user_activities')
        .delete()
        .eq('user_id', user.id)
        .eq('activity_id', activityId);

      if (error) {
        console.error('Error removing activity selection:', error);
        Alert.alert('Error', 'Failed to remove activity selection.');
        return false;
      }

      console.log('✅ Activity selection removed successfully');
      return true;

    } catch (error) {
      console.error('Error removing activity selection:', error);
      Alert.alert('Error', 'Failed to remove activity selection.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  /**
   * Filter activities based on search and category
   */
  const getFilteredActivities = () => {
    let filtered = activities;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.name.toLowerCase().includes(query) ||
        activity.description?.toLowerCase().includes(query) ||
        activity.category.toLowerCase().includes(query) ||
        activity.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategoryFilter) {
      filtered = filtered.filter(activity => activity.category === selectedCategoryFilter);
    }

    return filtered;
  };

  /**
   * Render activity item
   */
  const renderActivityItem = ({ item: activity }) => {
    const isSelected = selectedActivities.has(activity.id);
    const selection = selectedActivities.get(activity.id);

    return (
      <TouchableOpacity
        style={[
          styles.activityItem,
          isSelected && styles.activityItemSelected,
          { borderLeftColor: activity.color }
        ]}
        onPress={() => handleActivityPress(activity)}
        disabled={saving}
      >
        {/* Activity Icon and Info */}
        <View style={styles.activityInfo}>
          <Text style={styles.activityIcon}>{activity.icon}</Text>
          <View style={styles.activityDetails}>
            <Text style={styles.activityName}>{activity.name}</Text>
            <Text style={styles.activityCategory}>{activity.category}</Text>
            {activity.description && (
              <Text style={styles.activityDescription} numberOfLines={2}>
                {activity.description}
              </Text>
            )}
            {isSelected && selection && (
              <View style={styles.selectionInfo}>
                <Text style={styles.skillLevel}>
                  {skillLevels.find(s => s.value === selection.skill_level)?.icon} {' '}
                  {skillLevels.find(s => s.value === selection.skill_level)?.label}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Selection Checkbox */}
        <View style={[
          styles.checkbox,
          isSelected && styles.checkboxSelected
        ]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render category filter buttons
   */
  const renderCategoryFilters = () => {
    if (!showCategories) return null;

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilters}
        contentContainerStyle={styles.categoryFiltersContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryFilter,
            !selectedCategoryFilter && styles.categoryFilterSelected
          ]}
          onPress={() => setSelectedCategoryFilter(null)}
        >
          <Text style={[
            styles.categoryFilterText,
            !selectedCategoryFilter && styles.categoryFilterTextSelected
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryFilter,
              selectedCategoryFilter === category && styles.categoryFilterSelected
            ]}
            onPress={() => setSelectedCategoryFilter(category)}
          >
            <Text style={[
              styles.categoryFilterText,
              selectedCategoryFilter === category && styles.categoryFilterTextSelected
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  /**
   * Render skill level selection modal
   */
  const renderSkillModal = () => (
    <Modal
      visible={skillModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setSkillModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Select your skill level for {currentActivity?.name}
          </Text>
          
          {skillLevels.map(skill => (
            <TouchableOpacity
              key={skill.value}
              style={styles.skillOption}
              onPress={() => handleSelectActivity(currentActivity, skill.value)}
            >
              <Text style={styles.skillIcon}>{skill.icon}</Text>
              <View style={styles.skillInfo}>
                <Text style={styles.skillLabel}>{skill.label}</Text>
                <Text style={styles.skillDescription}>{skill.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setSkillModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    );
  }

  const filteredActivities = getFilteredActivities();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Interests</Text>
        <Text style={styles.subtitle}>
          Choose activities you enjoy and your skill level
        </Text>
        {selectedActivities.size > 0 && (
          <Text style={styles.selectionCount}>
            {selectedActivities.size} selected
            {maxSelections && ` (max ${maxSelections})`}
          </Text>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search activities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Category Filters */}
      {renderCategoryFilters()}

      {/* Activities List */}
      <FlatList
        data={filteredActivities}
        renderItem={renderActivityItem}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No activities match your search' : 'No activities available'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Saving Indicator */}
      {saving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}

      {/* Skill Level Modal */}
      {renderSkillModal()}
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
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 10,
  },
  selectionCount: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  categoryFilters: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryFiltersContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryFilterSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  categoryFilterTextSelected: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 15,
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItemSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: '#3B82F6',
  },
  activityInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  activityDetails: {
    flex: 1,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  selectionInfo: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillLevel: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  savingIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  savingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#374151',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  skillOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  skillIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  skillInfo: {
    flex: 1,
  },
  skillLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  skillDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  cancelButton: {
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});

export default ActivitySelector; 