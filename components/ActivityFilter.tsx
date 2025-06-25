import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface Activity {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
}

interface ActivityFilterProps {
  onFilterChange: (selectedActivityIds: string[]) => void;
  selectedActivities?: string[];
  userActivitiesOnly?: boolean; // Only show user's selected activities
  userId?: string;
}

const ActivityFilter: React.FC<ActivityFilterProps> = ({
  onFilterChange,
  selectedActivities = [],
  userActivitiesOnly = false,
  userId,
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(selectedActivities);

  useEffect(() => {
    loadActivities();
  }, [userActivitiesOnly, userId]);

  useEffect(() => {
    setSelectedFilters(selectedActivities);
  }, [selectedActivities]);

  /**
   * Load activities from database
   */
  const loadActivities = async () => {
    try {
      setLoading(true);

      if (userActivitiesOnly && userId) {
        // Load only user's selected activities
        const { data: userActivities, error } = await supabase
          .from('user_activities')
          .select(`
            activities!inner (
              id,
              name,
              icon,
              color,
              category
            )
          `)
          .eq('user_id', userId);

        if (error) {
          console.error('Error loading user activities:', error);
          return;
        }

        const activitiesList = userActivities
          ?.map((ua: any) => ua.activities)
          .filter(Boolean) || [];

        setActivities(activitiesList);
      } else {
        // Load all popular activities
        const { data: allActivities, error } = await supabase
          .from('activities')
          .select('id, name, icon, color, category')
          .eq('is_active', true)
          .order('popularity_score', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error loading activities:', error);
          return;
        }

        setActivities(allActivities || []);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle filter selection
   */
  const handleFilterPress = (activityId: string) => {
    let newFilters: string[];

    if (activityId === 'all') {
      // Clear all filters
      newFilters = [];
    } else {
      if (selectedFilters.includes(activityId)) {
        // Remove filter
        newFilters = selectedFilters.filter(id => id !== activityId);
      } else {
        // Add filter
        newFilters = [...selectedFilters, activityId];
      }
    }

    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  /**
   * Check if filter is selected
   */
  const isSelected = (activityId: string): boolean => {
    if (activityId === 'all') {
      return selectedFilters.length === 0;
    }
    return selectedFilters.includes(activityId);
  };

  /**
   * Get active filter count
   */
  const getActiveFilterCount = (): number => {
    return selectedFilters.length;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading filters...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* All Activities Filter */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            isSelected('all') && styles.filterChipSelected,
            { backgroundColor: isSelected('all') ? '#3B82F6' : '#FFFFFF' }
          ]}
          onPress={() => handleFilterPress('all')}
        >
          <Text style={styles.filterIcon}>🌎</Text>
          <Text style={[
            styles.filterText,
            isSelected('all') && styles.filterTextSelected
          ]}>
            All
          </Text>
        </TouchableOpacity>

        {/* Activity Filters */}
        {activities.map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={[
              styles.filterChip,
              isSelected(activity.id) && styles.filterChipSelected,
              {
                backgroundColor: isSelected(activity.id) 
                  ? activity.color || '#3B82F6'
                  : '#FFFFFF',
                borderColor: activity.color || '#E5E7EB'
              }
            ]}
            onPress={() => handleFilterPress(activity.id)}
          >
            <Text style={styles.filterIcon}>{activity.icon}</Text>
            <Text style={[
              styles.filterText,
              isSelected(activity.id) && styles.filterTextSelected
            ]}>
              {activity.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Active Filter Count */}
      {getActiveFilterCount() > 0 && (
        <View style={styles.filterCount}>
          <Text style={styles.filterCountText}>
            {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
          </Text>
          <TouchableOpacity
            onPress={() => handleFilterPress('all')}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterChipSelected: {
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  filterTextSelected: {
    color: '#FFFFFF',
  },
  filterCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  filterCountText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default ActivityFilter; 