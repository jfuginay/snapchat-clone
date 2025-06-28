import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../store';
import { googlePlacesService, PlaceNotification } from '../services/GooglePlacesService';
import { supabase } from '../lib/supabase';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

interface RAGNotificationProps {
  visible: boolean;
  onClose: () => void;
}

interface SmartNotification {
  id: string;
  title: string;
  message: string;
  place: any;
  interests: string[];
  distance: number;
  relevanceScore: number;
  actionText: string;
  priority: 'low' | 'medium' | 'high';
}

const RAGNotifications: React.FC<RAGNotificationProps> = ({ visible, onClose }) => {
  const user = useAppSelector((state) => state.auth.user);
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      loadSmartNotifications();
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadSmartNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🧠 Loading RAG-powered notifications...');

      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Required', 'Please enable location to get personalized recommendations.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Get user interests
      const { data: userActivities } = await supabase
        .from('user_activities')
        .select(`
          activities (name, category)
        `)
        .eq('user_id', user.id);

      const userInterests = userActivities?.map(ua => ua.activities.name) || [];

      if (userInterests.length === 0) {
        setNotifications([{
          id: 'no_interests',
          title: 'Set Your Interests!',
          message: 'Add activities you enjoy to get personalized place recommendations.',
          place: null,
          interests: [],
          distance: 0,
          relevanceScore: 1,
          actionText: 'Add Interests',
          priority: 'high'
        }]);
        return;
      }

      // Get place recommendations
      const placeNotifications = await googlePlacesService.findPlacesForInterests(
        location.coords.latitude,
        location.coords.longitude,
        userInterests,
        2000
      );

      // Convert to smart notifications
      const smartNotifications = createSmartNotifications(placeNotifications, userInterests);
      setNotifications(smartNotifications);

      console.log(`✅ Loaded ${smartNotifications.length} smart notifications`);

    } catch (error) {
      console.error('Error loading smart notifications:', error);
      setNotifications([{
        id: 'error',
        title: 'Unable to Load Recommendations',
        message: 'Please check your internet connection and try again.',
        place: null,
        interests: [],
        distance: 0,
        relevanceScore: 0,
        actionText: 'Retry',
        priority: 'low'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const createSmartNotifications = (
    placeNotifications: PlaceNotification[],
    userInterests: string[]
  ): SmartNotification[] => {
    const timeOfDay = new Date().getHours();
    const isWeekend = [0, 6].includes(new Date().getDay());

    return placeNotifications
      .filter(pn => pn.relevanceScore > 0.4)
      .slice(0, 5)
      .map((pn, index) => {
        const contextualMessage = generateContextualMessage(pn, timeOfDay, isWeekend);
        
        return {
          id: `smart_${pn.place.place_id}_${index}`,
          title: generateSmartTitle(pn, timeOfDay),
          message: contextualMessage,
          place: pn.place,
          interests: pn.matchedInterests,
          distance: pn.distance,
          relevanceScore: pn.relevanceScore,
          actionText: pn.distance < 500 ? 'Go Now' : 'Get Directions',
          priority: pn.relevanceScore > 0.8 ? 'high' : 
                   pn.relevanceScore > 0.6 ? 'medium' : 'low'
        };
      });
  };

  const generateSmartTitle = (pn: PlaceNotification, timeOfDay: number): string => {
    const interest = pn.matchedInterests[0];
    
    if (timeOfDay < 12) {
      return `Perfect Morning ${interest} Spot!`;
    } else if (timeOfDay < 17) {
      return `Afternoon ${interest} Discovery!`;
    } else if (timeOfDay < 21) {
      return `Evening ${interest} Opportunity!`;
    } else {
      return `Late Night ${interest} Find!`;
    }
  };

  const generateContextualMessage = (
    pn: PlaceNotification,
    timeOfDay: number,
    isWeekend: boolean
  ): string => {
    const { place, matchedInterests, distance } = pn;
    const distanceText = distance < 200 ? 'just steps away' :
                        distance < 500 ? 'a short walk' :
                        distance < 1000 ? 'nearby' : 'in the area';

    const rating = place.rating ? ` (${place.rating}⭐)` : '';
    const openNow = place.opening_hours?.open_now ? ' • Open now' : '';
    
    let timeContext = '';
    if (timeOfDay < 12 && matchedInterests.includes('Coffee')) {
      timeContext = ' Perfect for your morning coffee routine!';
    } else if (timeOfDay >= 12 && timeOfDay < 17 && matchedInterests.some(i => ['Fitness', 'Running'].includes(i))) {
      timeContext = ' Great for an afternoon workout!';
    } else if (timeOfDay >= 17 && matchedInterests.includes('Food')) {
      timeContext = ' Ideal for dinner plans!';
    } else if (isWeekend) {
      timeContext = ' Perfect weekend activity!';
    }

    return `${place.name}${rating} is ${distanceText} - matches your ${matchedInterests.join(' & ')} interests.${openNow}${timeContext}`;
  };

  const handleNotificationPress = (notification: SmartNotification) => {
    if (notification.id === 'no_interests') {
      onClose();
      return;
    }

    if (notification.place) {
      Alert.alert(
        notification.place.name,
        `${notification.place.formatted_address}\n\nDistance: ${Math.round(notification.distance)}m\nRating: ${notification.place.rating || 'N/A'}⭐`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get Directions', onPress: () => openDirections(notification.place) }
        ]
      );
    }
  };

  const openDirections = (place: any) => {
    const url = `maps://maps.google.com/?q=${place.geometry.location.lat},${place.geometry.location.lng}`;
    console.log('Opening directions to:', place.name);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return ['#ef4444', '#dc2626'];
      case 'medium': return ['#f59e0b', '#d97706'];
      case 'low': return ['#6b7280', '#4b5563'];
      default: return ['#6366f1', '#4f46e5'];
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'flash';
      case 'medium': return 'star';
      case 'low': return 'information-circle';
      default: return 'location';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0],
              }),
            },
          ],
          opacity: slideAnim,
        },
      ]}
    >
      <LinearGradient
        colors={['#1e1b4b', '#312e81']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="sparkles" size={24} color="#fbbf24" />
            <Text style={styles.headerTitle}>Smart Discoveries</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          AI-powered recommendations based on your interests
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>🧠 Analyzing your interests...</Text>
          </View>
        ) : (
          notifications.map((notification, index) => (
            <TouchableOpacity
              key={notification.id}
              style={styles.notificationCard}
              onPress={() => handleNotificationPress(notification)}
            >
              <LinearGradient
                colors={getPriorityColor(notification.priority)}
                style={styles.priorityIndicator}
              >
                <Ionicons 
                  name={getPriorityIcon(notification.priority)} 
                  size={16} 
                  color="#FFFFFF" 
                />
              </LinearGradient>

              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>

                {notification.interests.length > 0 && (
                  <View style={styles.interestsContainer}>
                    {notification.interests.map((interest, idx) => (
                      <View key={idx} style={styles.interestTag}>
                        <Text style={styles.interestText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.notificationFooter}>
                  {notification.distance > 0 && (
                    <Text style={styles.distanceText}>
                      📍 {Math.round(notification.distance)}m away
                    </Text>
                  )}
                  <Text style={styles.actionText}>
                    {notification.actionText} →
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {!loading && notifications.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Recommendations</Text>
            <Text style={styles.emptyMessage}>
              Try adding more interests or moving to a different area
            </Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#C7D2FE',
    opacity: 0.9,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  priorityIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    padding: 16,
    paddingRight: 50,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  interestTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  interestText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 250,
  },
});

export default RAGNotifications;
