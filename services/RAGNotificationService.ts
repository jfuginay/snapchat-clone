// =================================================================
// RAG Notification Service
// Intelligent place recommendations based on user interests
// =================================================================

import { supabase } from '../lib/supabase';
import { googlePlacesService, PlaceNotification } from './GooglePlacesService';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface UserInterest {
  id: string;
  name: string;
  category: string;
  skill_level: string;
  interest_level: number;
}

export interface RAGNotification {
  id: string;
  type: 'place_recommendation' | 'activity_suggestion' | 'social_opportunity';
  title: string;
  message: string;
  place?: PlaceNotification;
  actionText: string;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

class RAGNotificationService {
  private lastLocationCheck: number = 0;
  private lastNotificationTime: number = 0;
  private notificationCooldown = 5 * 60 * 1000; // 5 minutes

  /**
   * Main method to check for and generate notifications
   */
  async checkForNotifications(userId: string): Promise<RAGNotification[]> {
    try {
      console.log('🧠 RAG: Checking for intelligent notifications...');

      // Get user's current location
      const location = await this.getCurrentLocation();
      if (!location) {
        console.log('📍 No location available for RAG notifications');
        return [];
      }

      // Check cooldown
      if (Date.now() - this.lastNotificationTime < this.notificationCooldown) {
        console.log('⏰ RAG notification cooldown active');
        return [];
      }

      // Get user interests
      const interests = await this.getUserInterests(userId);
      if (interests.length === 0) {
        console.log('🎯 No user interests found for RAG');
        return [];
      }

      // Find relevant places
      const placeNotifications = await googlePlacesService.findPlacesForInterests(
        location.latitude,
        location.longitude,
        interests.map(i => i.name),
        2000 // 2km radius
      );

      // Generate RAG notifications
      const notifications = this.generateRAGNotifications(placeNotifications, interests);

      if (notifications.length > 0) {
        this.lastNotificationTime = Date.now();
        console.log(`✅ Generated ${notifications.length} RAG notifications`);
      }

      return notifications;

    } catch (error) {
      console.error('❌ Error in RAG notification check:', error);
      return [];
    }
  }

  /**
   * Get user's current location
   */
  private async getCurrentLocation(): Promise<UserLocation | null> {
    try {
      // Check if we have location permission
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  /**
   * Get user's interests from database
   */
  private async getUserInterests(userId: string): Promise<UserInterest[]> {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select(`
          id,
          skill_level,
          interest_level,
          activities (
            id,
            name,
            category
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching user interests:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.activities.id,
        name: item.activities.name,
        category: item.activities.category,
        skill_level: item.skill_level,
        interest_level: item.interest_level
      }));

    } catch (error) {
      console.error('Error fetching user interests:', error);
      return [];
    }
  }

  /**
   * Generate intelligent RAG notifications from place data
   */
  private generateRAGNotifications(
    placeNotifications: PlaceNotification[],
    userInterests: UserInterest[]
  ): RAGNotification[] {
    const notifications: RAGNotification[] = [];

    // Filter for high-relevance, actionable places
    const actionablePlaces = placeNotifications.filter(pn => 
      pn.actionable && pn.relevanceScore > 0.7
    ).slice(0, 3); // Max 3 notifications at once

    actionablePlaces.forEach((placeNotification, index) => {
      const notification = this.createPlaceRecommendationNotification(
        placeNotification,
        userInterests
      );
      
      if (notification) {
        notifications.push(notification);
      }
    });

    // Add activity suggestions based on time and location
    const activitySuggestion = this.createActivitySuggestion(userInterests, placeNotifications);
    if (activitySuggestion) {
      notifications.push(activitySuggestion);
    }

    return notifications;
  }

  /**
   * Create a place recommendation notification
   */
  private createPlaceRecommendationNotification(
    placeNotification: PlaceNotification,
    userInterests: UserInterest[]
  ): RAGNotification | null {
    const { place, matchedInterests, distance, relevanceScore } = placeNotification;

    // Get skill level context
    const relevantInterests = userInterests.filter(ui => 
      matchedInterests.includes(ui.name)
    );

    const skillContext = this.getSkillContext(relevantInterests);
    const timeContext = this.getTimeContext();

    const title = this.generateContextualTitle(place, matchedInterests, skillContext, timeContext);
    const message = this.generateContextualMessage(place, matchedInterests, distance, skillContext);

    return {
      id: `place_${place.place_id}_${Date.now()}`,
      type: 'place_recommendation',
      title,
      message,
      place: placeNotification,
      actionText: distance < 500 ? 'Go Now' : 'Get Directions',
      timestamp: Date.now(),
      read: false,
      priority: relevanceScore > 0.8 ? 'high' : 'medium'
    };
  }

  /**
   * Create activity suggestion based on context
   */
  private createActivitySuggestion(
    userInterests: UserInterest[],
    placeNotifications: PlaceNotification[]
  ): RAGNotification | null {
    const timeContext = this.getTimeContext();
    const availablePlaces = placeNotifications.filter(pn => 
      pn.place.opening_hours?.open_now
    );

    if (availablePlaces.length === 0) return null;

    // Create time-based suggestions
    let suggestion = '';
    let actionText = 'Explore';

    if (timeContext.period === 'morning') {
      const coffeeSpots = availablePlaces.filter(pn => 
        pn.place.types.includes('cafe')
      );
      
      if (coffeeSpots.length > 0) {
        suggestion = `Perfect morning for coffee! ${coffeeSpots.length} great spots nearby.`;
        actionText = 'Find Coffee';
      }
    } else if (timeContext.period === 'afternoon') {
      const activeSpots = availablePlaces.filter(pn => 
        pn.place.types.some(type => ['gym', 'park', 'stadium'].includes(type))
      );
      
      if (activeSpots.length > 0) {
        suggestion = `Great afternoon for activities! ${activeSpots.length} spots match your interests.`;
        actionText = 'Get Active';
      }
    } else if (timeContext.period === 'evening') {
      const socialSpots = availablePlaces.filter(pn => 
        pn.place.types.some(type => ['restaurant', 'bar', 'entertainment'].includes(type))
      );
      
      if (socialSpots.length > 0) {
        suggestion = `Evening plans? ${socialSpots.length} great social spots nearby.`;
        actionText = 'Explore';
      }
    }

    if (!suggestion) return null;

    return {
      id: `activity_suggestion_${Date.now()}`,
      type: 'activity_suggestion',
      title: 'Smart Activity Suggestion',
      message: suggestion,
      actionText,
      timestamp: Date.now(),
      read: false,
      priority: 'medium'
    };
  }

  /**
   * Generate contextual title based on user skill level and time
   */
  private generateContextualTitle(
    place: any,
    interests: string[],
    skillContext: string,
    timeContext: any
  ): string {
    const interestText = interests[0];
    
    if (skillContext === 'beginner') {
      return `Perfect ${interestText} spot for beginners!`;
    } else if (skillContext === 'advanced') {
      return `Advanced ${interestText} opportunity nearby!`;
    } else {
      return `Great ${interestText} spot discovered!`;
    }
  }

  /**
   * Generate contextual message with skill and time awareness
   */
  private generateContextualMessage(
    place: any,
    interests: string[],
    distance: number,
    skillContext: string
  ): string {
    const distanceText = distance < 200 ? 'just steps away' :
                        distance < 500 ? 'a short walk' :
                        'nearby';

    const skillText = skillContext === 'beginner' ? 'beginner-friendly' :
                     skillContext === 'advanced' ? 'challenging' :
                     'perfect for your level';

    const rating = place.rating ? ` with ${place.rating}⭐ rating` : '';

    return `${place.name}${rating} is ${distanceText} - ${skillText} for ${interests.join(' and ')}.`;
  }

  /**
   * Get skill level context from user interests
   */
  private getSkillContext(interests: UserInterest[]): string {
    if (interests.length === 0) return 'intermediate';
    
    const avgSkillLevel = interests.reduce((sum, interest) => {
      const skillValue = interest.skill_level === 'beginner' ? 1 :
                        interest.skill_level === 'intermediate' ? 2 : 3;
      return sum + skillValue;
    }, 0) / interests.length;

    return avgSkillLevel < 1.5 ? 'beginner' :
           avgSkillLevel > 2.5 ? 'advanced' : 'intermediate';
  }

  /**
   * Get current time context
   */
  private getTimeContext() {
    const hour = new Date().getHours();
    
    return {
      hour,
      period: hour < 12 ? 'morning' :
              hour < 17 ? 'afternoon' :
              hour < 21 ? 'evening' : 'night',
      isWeekend: [0, 6].includes(new Date().getDay())
    };
  }

  /**
   * Store notification in local knowledge base for RAG learning
   */
  async storeNotificationFeedback(
    notificationId: string,
    action: 'viewed' | 'clicked' | 'dismissed',
    userId: string
  ): Promise<void> {
    try {
      // Store feedback for RAG learning
      const feedbackData = {
        notification_id: notificationId,
        user_id: userId,
        action,
        timestamp: new Date().toISOString(),
        context: {
          time_of_day: new Date().getHours(),
          day_of_week: new Date().getDay()
        }
      };

      // This would be stored in the local_knowledge table for RAG learning
      console.log('📊 RAG Feedback stored:', feedbackData);

    } catch (error) {
      console.error('Error storing notification feedback:', error);
    }
  }
}

export const ragNotificationService = new RAGNotificationService(); 