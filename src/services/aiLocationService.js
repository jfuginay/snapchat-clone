/**
 * AI-Powered Location Service for TribeFind
 * 
 * Features:
 * - Location history tracking with movement detection
 * - AI-powered activity suggestions using OpenAI
 * - Pattern recognition for user behavior
 * - Smart movement detection and stationary analysis
 * - Integration with photo data for context
 */

import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';

// Configuration constants
const CONFIG = {
  // Movement detection thresholds
  STATIONARY_THRESHOLD_METERS: 50,
  STATIONARY_TIME_MINUTES: 15,
  SIGNIFICANT_MOVEMENT_METERS: 100,
  
  // AI processing intervals
  AI_ANALYSIS_BATCH_SIZE: 10,
  AI_ANALYSIS_INTERVAL_HOURS: 2,
  
  // OpenAI configuration
  OPENAI_MODEL: 'gpt-4',
  OPENAI_MAX_TOKENS: 500,
  
  // Location tracking
  LOCATION_ACCURACY_HIGH: Location.Accuracy.High,
  LOCATION_ACCURACY_BALANCED: Location.Accuracy.Balanced,
  
  // Activity suggestion parameters
  SUGGESTION_RADIUS_METERS: 1000,
  SUGGESTION_EXPIRY_HOURS: 24,
};

class AILocationService {
  constructor() {
    this.isTracking = false;
    this.lastKnownLocation = null;
    this.trackingInterval = null;
    this.aiProcessingQueue = [];
  }

  /**
   * Initialize the AI location service
   */
  async initialize(userId) {
    this.userId = userId;
    await this.setupLocationTracking();
    await this.scheduleAIProcessing();
    return { success: true };
  }

  /**
   * Request location permission with detailed explanation
   */
  async requestLocationPermission() {
    try {
      // Check current permission status
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        return { granted: true, status: existingStatus };
      }

      // Request permission with explanation
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return { 
          granted: false, 
          status,
          message: 'Location permission is required for AI-powered activity suggestions and location history tracking.'
        };
      }

      // Also request background permission for continuous tracking
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      return { 
        granted: true, 
        status,
        backgroundStatus,
        message: backgroundStatus === 'granted' ? 
          'Full location tracking enabled for smart activity suggestions!' :
          'Location tracking enabled. Background tracking will enhance AI suggestions.'
      };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return { granted: false, error: error.message };
    }
  }

  /**
   * Get current location with enhanced accuracy options
   */
  async getCurrentLocation(options = {}) {
    try {
      const defaultOptions = {
        accuracy: CONFIG.LOCATION_ACCURACY_HIGH,
        timeout: 15000,
        maximumAge: 1000,
      };

      const locationOptions = { ...defaultOptions, ...options };
      
      const location = await Location.getCurrentPositionAsync(locationOptions);
      
      return {
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          timestamp: location.timestamp,
        },
        error: null
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return {
        location: null,
        error: error.message
      };
    }
  }

  /**
   * Start enhanced location tracking with AI processing
   */
  async startLocationTracking(options = {}) {
    if (this.isTracking) {
      console.log('Location tracking already active');
      return;
    }

    try {
      const permission = await this.requestLocationPermission();
      if (!permission.granted) {
        throw new Error('Location permission required for tracking');
      }

      this.isTracking = true;
      const trackingOptions = {
        accuracy: CONFIG.LOCATION_ACCURACY_BALANCED,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 25, // 25 meters
        ...options
      };

      console.log('🔋 Starting AI-enhanced location tracking...');
      
      // Start the tracking loop
      this.trackingInterval = setInterval(async () => {
        await this.processLocationUpdate();
      }, trackingOptions.timeInterval);

      // Initial location capture
      await this.processLocationUpdate();

      return { success: true, message: 'AI location tracking started' };
    } catch (error) {
      console.error('Error starting location tracking:', error);
      this.isTracking = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop location tracking
   */
  stopLocationTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    this.isTracking = false;
    console.log('🛑 AI location tracking stopped');
  }

  /**
   * Process a location update with movement analysis
   */
  async processLocationUpdate() {
    try {
      const locationResult = await this.getCurrentLocation();
      if (locationResult.error || !locationResult.location) {
        console.error('Failed to get location for tracking:', locationResult.error);
        return;
      }

      const currentLocation = locationResult.location;
      const movementData = await this.analyzeMovement(currentLocation);
      
      // Store location in history
      const historyEntry = await this.storeLocationHistory(currentLocation, movementData);
      
      // Check if location should trigger AI analysis
      if (this.shouldTriggerAIAnalysis(movementData, historyEntry)) {
        this.queueForAIAnalysis(historyEntry);
      }

      // Update last known location
      this.lastKnownLocation = currentLocation;

      return historyEntry;
    } catch (error) {
      console.error('Error processing location update:', error);
    }
  }

  /**
   * Analyze movement patterns from location data
   */
  async analyzeMovement(currentLocation) {
    const movementData = {
      distance_from_previous: 0,
      movement_speed: 0,
      is_stationary: false,
      location_type: 'unknown',
      significant_movement: false,
    };

    if (!this.lastKnownLocation) {
      return movementData;
    }

    // Calculate distance moved
    const distance = this.calculateDistance(
      this.lastKnownLocation,
      currentLocation
    );

    // Calculate time difference and speed
    const timeDiff = (currentLocation.timestamp - this.lastKnownLocation.timestamp) / 1000; // seconds
    const speed = timeDiff > 0 ? distance / timeDiff : 0;

    movementData.distance_from_previous = distance;
    movementData.movement_speed = speed;
    movementData.significant_movement = distance > CONFIG.SIGNIFICANT_MOVEMENT_METERS;

    // Check if user is stationary
    movementData.is_stationary = await this.isLocationStationary(currentLocation);

    // Classify location type based on movement patterns
    movementData.location_type = await this.classifyLocationType(currentLocation, speed);

    return movementData;
  }

  /**
   * Store location data in history with movement analysis
   */
  async storeLocationHistory(location, movementData) {
    try {
      const historyEntry = {
        user_id: this.userId,
        latitude: location.latitude,
        longitude: location.longitude,
        location: `POINT(${location.longitude} ${location.latitude})`,
        accuracy: location.accuracy,
        altitude: location.altitude,
        recorded_at: new Date(location.timestamp).toISOString(),
        distance_from_previous: movementData.distance_from_previous,
        movement_speed: movementData.movement_speed,
        is_stationary: movementData.is_stationary,
        location_type: movementData.location_type,
        time_of_day: new Date().toTimeString().split(' ')[0],
        day_of_week: new Date().getDay(),
        data_source: 'app',
      };

      const { data, error } = await supabase
        .from('location_history')
        .insert(historyEntry)
        .select()
        .single();

      if (error) {
        console.error('Error storing location history:', error);
        return null;
      }

      console.log('📍 Location stored:', {
        distance: Math.round(movementData.distance_from_previous),
        speed: Math.round(movementData.movement_speed * 3.6), // Convert to km/h
        stationary: movementData.is_stationary,
        type: movementData.location_type
      });

      return data;
    } catch (error) {
      console.error('Error storing location history:', error);
      return null;
    }
  }

  /**
   * Check if current location represents a stationary period
   */
  async isLocationStationary(currentLocation) {
    try {
      const { data, error } = await supabase.rpc('is_location_stationary', {
        user_id_param: this.userId,
        location_param: `POINT(${currentLocation.longitude} ${currentLocation.latitude})`,
        time_threshold_minutes: CONFIG.STATIONARY_TIME_MINUTES,
        distance_threshold_meters: CONFIG.STATIONARY_THRESHOLD_METERS,
      });

      if (error) {
        console.error('Error checking stationary status:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error checking stationary status:', error);
      return false;
    }
  }

  /**
   * Classify location type based on patterns and context
   */
  async classifyLocationType(location, speed) {
    // Simple classification based on speed and context
    if (speed > 15) return 'transit'; // Moving fast, likely in vehicle
    if (speed > 2) return 'walking'; // Walking speed
    
    // Check against known locations (home, work)
    const userHomeLocation = await this.getUserHomeLocation();
    if (userHomeLocation && this.calculateDistance(location, userHomeLocation) < 100) {
      return 'home';
    }

    // Default classification
    return 'activity';
  }

  /**
   * Get user's home location from profile
   */
  async getUserHomeLocation() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('home_location')
        .eq('id', this.userId)
        .single();

      if (error || !data?.home_location) {
        return null;
      }

      return {
        latitude: data.home_location.latitude,
        longitude: data.home_location.longitude,
      };
    } catch (error) {
      console.error('Error getting home location:', error);
      return null;
    }
  }

  /**
   * Determine if location should trigger AI analysis
   */
  shouldTriggerAIAnalysis(movementData, historyEntry) {
    // Trigger AI analysis for:
    // 1. Significant movement after being stationary
    // 2. New stationary locations
    // 3. Interesting location patterns
    
    if (!historyEntry) return false;

    // Analyze when user becomes stationary at new location
    if (movementData.is_stationary && movementData.significant_movement) {
      return true;
    }

    // Analyze activity-type locations
    if (movementData.location_type === 'activity') {
      return true;
    }

    return false;
  }

  /**
   * Queue location entry for AI analysis
   */
  queueForAIAnalysis(historyEntry) {
    this.aiProcessingQueue.push(historyEntry);
    console.log(`🤖 Queued location for AI analysis (${this.aiProcessingQueue.length} in queue)`);
    
    // Process queue if it reaches batch size
    if (this.aiProcessingQueue.length >= CONFIG.AI_ANALYSIS_BATCH_SIZE) {
      setTimeout(() => this.processAIAnalysisQueue(), 1000);
    }
  }

  /**
   * Process queued locations with AI analysis
   */
  async processAIAnalysisQueue() {
    if (this.aiProcessingQueue.length === 0) return;

    console.log('🤖 Processing AI analysis queue...');
    const batch = this.aiProcessingQueue.splice(0, CONFIG.AI_ANALYSIS_BATCH_SIZE);
    
    for (const entry of batch) {
      try {
        await this.analyzeLocationWithAI(entry);
      } catch (error) {
        console.error('Error in AI analysis:', error);
      }
    }
  }

  /**
   * Analyze location with AI to generate activity suggestions
   */
  async analyzeLocationWithAI(locationEntry) {
    try {
      // Get context data for AI analysis
      const context = await this.gatherLocationContext(locationEntry);
      
      // Create AI prompt
      const prompt = this.createAIAnalysisPrompt(locationEntry, context);
      
      // Call OpenAI API (you'll need to implement this)
      const aiAnalysis = await this.callOpenAI(prompt);
      
      // Process AI response
      await this.processAIAnalysisResult(locationEntry, aiAnalysis, context);
      
      // Mark location as AI analyzed
      await this.markLocationAsAnalyzed(locationEntry.id, aiAnalysis);
      
    } catch (error) {
      console.error('Error analyzing location with AI:', error);
    }
  }

  /**
   * Gather context data for AI analysis
   */
  async gatherLocationContext(locationEntry) {
    const context = {
      location: {
        latitude: locationEntry.latitude,
        longitude: locationEntry.longitude,
        type: locationEntry.location_type,
        is_stationary: locationEntry.is_stationary,
      },
      time: {
        hour: new Date(locationEntry.recorded_at).getHours(),
        day_of_week: locationEntry.day_of_week,
        time_of_day: this.getTimeOfDayLabel(new Date(locationEntry.recorded_at).getHours()),
      },
      user: await this.getUserContext(),
      nearby: await this.getNearbyContext(locationEntry),
      photos: await this.getNearbyPhotos(locationEntry),
      history: await this.getLocationHistory(locationEntry),
    };

    return context;
  }

  /**
   * Get user context for AI analysis
   */
  async getUserContext() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          display_name,
          bio,
          user_activities (
            activities (name, category, icon)
          )
        `)
        .eq('id', this.userId)
        .single();

      if (error) {
        console.error('Error getting user context:', error);
        return {};
      }

      return {
        name: data.display_name,
        bio: data.bio,
        interests: data.user_activities?.map(ua => ua.activities) || []
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return {};
    }
  }

  /**
   * Get nearby context (other users, activities)
   */
  async getNearbyContext(locationEntry) {
    try {
      const { data, error } = await supabase.rpc('get_location_context', {
        location_param: `POINT(${locationEntry.longitude} ${locationEntry.latitude})`,
        radius_meters: CONFIG.SUGGESTION_RADIUS_METERS
      });

      if (error) {
        console.error('Error getting nearby context:', error);
        return {};
      }

      return data || {};
    } catch (error) {
      console.error('Error getting nearby context:', error);
      return {};
    }
  }

  /**
   * Get nearby photos for context
   */
  async getNearbyPhotos(locationEntry) {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('id, description, metadata')
        .eq('user_id', this.userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .limit(5);

      if (error) {
        console.error('Error getting nearby photos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting nearby photos:', error);
      return [];
    }
  }

  /**
   * Get relevant location history
   */
  async getLocationHistory(locationEntry) {
    try {
      const { data, error } = await supabase
        .from('location_history')
        .select('location_type, is_stationary, recorded_at')
        .eq('user_id', this.userId)
        .gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('recorded_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error getting location history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting location history:', error);
      return [];
    }
  }

  /**
   * Create AI analysis prompt
   */
  createAIAnalysisPrompt(locationEntry, context) {
    const prompt = `
You are an AI assistant for TribeFind, a location-based social activity app. Analyze this user's location and context to suggest relevant activities.

LOCATION DATA:
- Coordinates: ${locationEntry.latitude}, ${locationEntry.longitude}
- Location Type: ${locationEntry.location_type}
- Is Stationary: ${locationEntry.is_stationary}
- Time: ${context.time.time_of_day} (${context.time.hour}:00) on ${this.getDayName(context.time.day_of_week)}

USER CONTEXT:
- Name: ${context.user.name}
- Bio: ${context.user.bio || 'No bio provided'}
- Interests: ${context.user.interests?.map(i => i.name).join(', ') || 'No interests specified'}

NEARBY CONTEXT:
- Nearby Users: ${context.nearby.nearby_users || 0}
- Activity Level: ${context.nearby.activity_level || 'unknown'}
- Common Activities: ${context.nearby.common_activities?.join(', ') || 'none'}

RECENT PHOTOS: ${context.photos.length} photos taken recently

INSTRUCTIONS:
1. Suggest 2-3 specific activities the user could do at this location and time
2. Consider their interests, the time of day, and nearby activity
3. Make suggestions practical and actionable
4. Rate each suggestion's confidence (0-1)
5. Explain why each activity makes sense

Respond in JSON format:
{
  "suggestions": [
    {
      "activity": "specific activity name",
      "category": "fitness/social/entertainment/food/shopping/outdoor/cultural",
      "confidence": 0.8,
      "reason": "why this makes sense",
      "duration": "estimated time",
      "difficulty": "beginner/intermediate/advanced"
    }
  ],
  "insights": "general insights about this location pattern"
}
`;

    return prompt.trim();
  }

  /**
   * Call OpenAI API (mock implementation - you'll need to implement actual API call)
   */
  async callOpenAI(prompt) {
    // NOTE: You'll need to implement actual OpenAI API integration
    // For now, returning mock response
    console.log('🤖 Would call OpenAI with prompt:', prompt.substring(0, 200) + '...');
    
    // Mock AI response
    return {
      suggestions: [
        {
          activity: "Explore nearby cafes",
          category: "social",
          confidence: 0.8,
          reason: "Good time for coffee and the area seems to have activity",
          duration: "30-60 minutes",
          difficulty: "beginner"
        }
      ],
      insights: "This appears to be a popular area for social activities during this time of day."
    };
  }

  /**
   * Process AI analysis result and create suggestions
   */
  async processAIAnalysisResult(locationEntry, aiAnalysis, context) {
    try {
      for (const suggestion of aiAnalysis.suggestions) {
        await this.createActivitySuggestion({
          user_id: this.userId,
          trigger_location: `POINT(${locationEntry.longitude} ${locationEntry.latitude})`,
          trigger_type: 'location_based',
          context_data: context,
          suggested_activity: suggestion.activity,
          activity_category: suggestion.category,
          suggestion_reason: suggestion.reason,
          confidence_score: suggestion.confidence,
          difficulty_level: suggestion.difficulty,
          estimated_duration: suggestion.duration,
          expires_at: new Date(Date.now() + CONFIG.SUGGESTION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
          openai_response_raw: aiAnalysis,
        });
      }

      console.log(`✨ Created ${aiAnalysis.suggestions.length} AI activity suggestions`);
    } catch (error) {
      console.error('Error processing AI analysis result:', error);
    }
  }

  /**
   * Create activity suggestion in database
   */
  async createActivitySuggestion(suggestionData) {
    try {
      const { data, error } = await supabase
        .from('ai_activity_suggestions')
        .insert(suggestionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating activity suggestion:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating activity suggestion:', error);
      return null;
    }
  }

  /**
   * Mark location as analyzed by AI
   */
  async markLocationAsAnalyzed(locationId, aiAnalysis) {
    try {
      const { error } = await supabase
        .from('location_history')
        .update({
          ai_analyzed: true,
          ai_analysis_timestamp: new Date().toISOString(),
          ai_suggested_activities: aiAnalysis.suggestions,
        })
        .eq('id', locationId);

      if (error) {
        console.error('Error marking location as analyzed:', error);
      }
    } catch (error) {
      console.error('Error marking location as analyzed:', error);
    }
  }

  /**
   * Get user's activity suggestions
   */
  async getActivitySuggestions(status = 'pending', limit = 10) {
    try {
      const { data, error } = await supabase
        .from('ai_activity_suggestions')
        .select('*')
        .eq('user_id', this.userId)
        .eq('status', status)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting activity suggestions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting activity suggestions:', error);
      return [];
    }
  }

  /**
   * Update suggestion status (accepted, rejected, completed)
   */
  async updateSuggestionStatus(suggestionId, status, feedback = null, rating = null) {
    try {
      const updateData = {
        status,
        user_response: new Date().toISOString(),
      };

      if (feedback) updateData.user_feedback = feedback;
      if (rating) updateData.rating = rating;

      const { data, error } = await supabase
        .from('ai_activity_suggestions')
        .update(updateData)
        .eq('id', suggestionId)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating suggestion status:', error);
        return null;
      }

      console.log(`✅ Updated suggestion status to: ${status}`);
      return data;
    } catch (error) {
      console.error('Error updating suggestion status:', error);
      return null;
    }
  }

  /**
   * Schedule periodic AI processing
   */
  async scheduleAIProcessing() {
    setInterval(() => {
      if (this.aiProcessingQueue.length > 0) {
        this.processAIAnalysisQueue();
      }
    }, CONFIG.AI_ANALYSIS_INTERVAL_HOURS * 60 * 60 * 1000);
  }

  /**
   * Utility function to calculate distance between two points
   */
  calculateDistance(point1, point2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLng = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get time of day label
   */
  getTimeOfDayLabel(hour) {
    if (hour < 6) return 'late_night';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Get day name from day number
   */
  getDayName(dayNumber) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stopLocationTracking();
    this.aiProcessingQueue = [];
  }
}

// Export singleton instance
const aiLocationService = new AILocationService();
export default aiLocationService; 