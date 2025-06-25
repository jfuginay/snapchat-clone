import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../store';
import { supabase } from '../lib/supabase';

interface Activity {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
}

const ActivitiesScreen: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadActivities();
    loadUserActivities();
  }, []);

  const loadActivities = async () => {
    try {
      console.log('Loading activities...');
      
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('is_active', true)
        .order('popularity_score', { ascending: false });

      if (error) {
        console.error('Error loading activities:', error);
        Alert.alert('Error', 'Failed to load activities');
        return;
      }

      console.log(`Loaded ${data?.length || 0} activities`);
      setActivities(data || []);
      
    } catch (error) {
      console.error('Exception loading activities:', error);
      Alert.alert('Error', 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivities = async () => {
    if (!user) return;

    try {
      console.log('Loading user activities...');
      
      const { data, error } = await supabase
        .from('user_activities')
        .select('activity_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading user activities:', error);
        return;
      }

      const userActivityIds = new Set(data?.map(item => item.activity_id) || []);
      setSelectedActivities(userActivityIds);
      console.log(`User has ${userActivityIds.size} selected activities`);
      
    } catch (error) {
      console.error('Exception loading user activities:', error);
    }
  };

  const toggleActivity = async (activityId: string) => {
    if (!user) return;

    setSaving(true);
    const isSelected = selectedActivities.has(activityId);

    try {
      if (isSelected) {
        // Remove activity
        const { error } = await supabase
          .from('user_activities')
          .delete()
          .eq('user_id', user.id)
          .eq('activity_id', activityId);

        if (error) throw error;

        const newSelected = new Set(selectedActivities);
        newSelected.delete(activityId);
        setSelectedActivities(newSelected);
        
      } else {
        // Add activity
        const { error } = await supabase
          .from('user_activities')
          .insert({
            user_id: user.id,
            activity_id: activityId,
            skill_level: 'beginner',
            interest_level: 5,
            is_learning: true,
            is_teaching: false
          });

        if (error) throw error;

        const newSelected = new Set(selectedActivities);
        newSelected.add(activityId);
        setSelectedActivities(newSelected);
      }
    } catch (error) {
      console.error('Error toggling activity:', error);
      Alert.alert('Error', 'Failed to update activity selection');
    } finally {
      setSaving(false);
    }
  };

  const renderActivity = ({ item }: { item: Activity }) => {
    const isSelected = selectedActivities.has(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.activityItem,
          isSelected && styles.activityItemSelected
        ]}
        onPress={() => toggleActivity(item.id)}
        disabled={saving}
      >
        <View style={styles.activityContent}>
          <Text style={styles.activityIcon}>{item.icon}</Text>
          <View style={styles.activityInfo}>
            <Text style={styles.activityName}>{item.name}</Text>
            <Text style={styles.activityCategory}>{item.category}</Text>
            {item.description && (
              <Text style={styles.activityDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
          <View style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected
          ]}>
            {isSelected && (
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading activities...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Activities</Text>
          <Text style={styles.subtitle}>
            Select activities you're interested in
          </Text>
          <Text style={styles.selectedCount}>
            {selectedActivities.size} selected
          </Text>
        </View>

        {/* Activities List */}
        <View style={styles.listContainer}>
          <FlatList
            data={activities}
            renderItem={renderActivity}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No activities available</Text>
              </View>
            }
          />
        </View>

        {/* Saving Indicator */}
        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    marginBottom: 10,
  },
  selectedCount: {
    fontSize: 14,
    color: '#C7D2FE',
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItemSelected: {
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activityIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
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
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
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
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  savingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});

export default ActivitiesScreen; 