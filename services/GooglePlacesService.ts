// Enhanced Google Places Service for RAG Integration
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 
                              process.env.GOOGLE_PLACES_API_KEY ||
                              'AIzaSyDzTGzOaQGxnPkRyXqtQgdLwzFPKqZvQVY';

const PLACES_API_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

export interface EnhancedPlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number; };
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now: boolean; };
  vicinity: string;
  business_status?: string;
}

export interface PlaceNotification {
  place: EnhancedPlace;
  matchedInterests: string[];
  relevanceScore: number;
  distance: number;
  message: string;
  actionable: boolean;
}

const INTEREST_TO_PLACE_TYPES: Record<string, string[]> = {
  'Fitness': ['gym', 'spa', 'stadium'],
  'Running': ['park', 'stadium', 'gym'],
  'Photography': ['art_gallery', 'museum', 'park', 'tourist_attraction'],
  'Music': ['night_club', 'bar', 'music_store'],
  'Programming': ['electronics_store', 'library', 'cafe'],
  'Gaming': ['electronics_store', 'entertainment', 'cafe'],
  'Hiking': ['park', 'tourist_attraction', 'campground'],
  'Cooking': ['restaurant', 'grocery_or_supermarket', 'store'],
  'Coffee': ['cafe', 'restaurant', 'store'],
  'Food': ['restaurant', 'cafe', 'meal_takeaway'],
};

class GooglePlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = GOOGLE_PLACES_API_KEY;
    if (!this.apiKey || this.apiKey === 'AIzaSyDzTGzOaQGxnPkRyXqtQgdLwzFPKqZvQVY') {
      console.warn('⚠️ Google Places API key not properly configured. Using mock data.');
      console.warn('📝 To fix: Set EXPO_PUBLIC_GOOGLE_PLACES_API_KEY in your environment');
    } else {
      console.log('✅ Google Places API key configured');
    }
  }

  async findPlacesForInterests(
    latitude: number,
    longitude: number,
    userInterests: string[],
    radius: number = 2000
  ): Promise<PlaceNotification[]> {
    console.log('🔍 Finding places for interests:', userInterests);
    
    const allPlaces: EnhancedPlace[] = [];
    const searchedTypes = new Set<string>();

    for (const interest of userInterests) {
      const placeTypes = INTEREST_TO_PLACE_TYPES[interest] || [];
      
      for (const type of placeTypes) {
        if (!searchedTypes.has(type)) {
          searchedTypes.add(type);
          try {
            const places = await this.findNearbyPlaces(latitude, longitude, radius, type);
            allPlaces.push(...places);
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`Error fetching places for type ${type}:`, error);
          }
        }
      }
    }

    const uniquePlaces = this.removeDuplicatePlaces(allPlaces);
    const notifications = this.createPlaceNotifications(uniquePlaces, userInterests, latitude, longitude);

    console.log(`✅ Found ${notifications.length} relevant places`);
    return notifications;
  }

  async findNearbyPlaces(
    latitude: number,
    longitude: number,
    radius: number,
    type?: string
  ): Promise<EnhancedPlace[]> {
    // Always use mock data in development for now
    if (!this.apiKey || this.apiKey === 'AIzaSyDzTGzOaQGxnPkRyXqtQgdLwzFPKqZvQVY') {
      console.log('🎭 Using mock places data (API key not configured)');
      return this.getMockPlaces(latitude, longitude, type);
    }

    const params = new URLSearchParams({
      location: `${latitude},${longitude}`,
      radius: radius.toString(),
      key: this.apiKey,
    });

    if (type) params.append('type', type);

    const url = `${PLACES_API_BASE_URL}/nearbysearch/json?${params}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('Google Places API Error:', data.error_message || data.status);
        console.log('📝 Falling back to mock data...');
        return this.getMockPlaces(latitude, longitude, type);
      }

      return data.results || [];
    } catch (error) {
      console.error('Failed to fetch from Google Places API:', error);
      console.log('📝 Falling back to mock data...');
      return this.getMockPlaces(latitude, longitude, type);
    }
  }

  private createPlaceNotifications(
    places: EnhancedPlace[],
    userInterests: string[],
    userLat: number,
    userLng: number
  ): PlaceNotification[] {
    return places.map(place => {
      const distance = this.calculateDistance(
        userLat, userLng,
        place.geometry.location.lat, place.geometry.location.lng
      );

      const matchedInterests = this.getMatchedInterests(place, userInterests);
      const relevanceScore = this.calculateRelevanceScore(place, matchedInterests, distance);
      
      return {
        place,
        matchedInterests,
        relevanceScore,
        distance,
        message: this.generateNotificationMessage(place, matchedInterests, distance),
        actionable: relevanceScore > 0.6 && distance < 1000
      };
    }).filter(notification => notification.relevanceScore > 0.3)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  }

  private generateNotificationMessage(
    place: EnhancedPlace,
    matchedInterests: string[],
    distance: number
  ): string {
    const distanceText = distance < 100 ? 'right here' :
                        distance < 500 ? 'nearby' :
                        distance < 1000 ? 'close by' : 'in the area';

    const interestText = matchedInterests.length > 1 
      ? `${matchedInterests.slice(0, -1).join(', ')} and ${matchedInterests.slice(-1)}`
      : matchedInterests[0];

    const rating = place.rating ? ` (${place.rating}⭐)` : '';
    const openNow = place.opening_hours?.open_now ? ' • Open now' : '';

    return `${place.name}${rating} is ${distanceText} - perfect for ${interestText}!${openNow}`;
  }

  private calculateRelevanceScore(
    place: EnhancedPlace,
    matchedInterests: string[],
    distance: number
  ): number {
    let score = 0;
    score += Math.min(matchedInterests.length * 0.2, 0.4);
    if (place.rating) score += (place.rating / 5) * 0.3;
    score += Math.max(0, (2000 - distance) / 2000) * 0.2;
    if (place.opening_hours?.open_now) score += 0.1;
    return Math.min(score, 1.0);
  }

  private getMatchedInterests(place: EnhancedPlace, userInterests: string[]): string[] {
    const matched: string[] = [];

    for (const interest of userInterests) {
      const placeTypes = INTEREST_TO_PLACE_TYPES[interest] || [];
      
      if (place.types.some(type => placeTypes.includes(type))) {
        matched.push(interest);
      }

      const searchText = `${place.name} ${place.vicinity}`.toLowerCase();
      if (searchText.includes(interest.toLowerCase())) {
        if (!matched.includes(interest)) {
          matched.push(interest);
        }
      }
    }

    return matched;
  }

  private removeDuplicatePlaces(places: EnhancedPlace[]): EnhancedPlace[] {
    const seen = new Set<string>();
    return places.filter(place => {
      if (seen.has(place.place_id)) return false;
      seen.add(place.place_id);
      return true;
    });
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private getMockPlaces(latitude: number, longitude: number, type?: string): EnhancedPlace[] {
    const mockPlaces: EnhancedPlace[] = [
      {
        place_id: 'mock_coffee_1',
        name: 'Local Coffee House',
        formatted_address: '123 Main St, Your City',
        geometry: { location: { lat: latitude + 0.001, lng: longitude + 0.001 } },
        types: ['cafe', 'restaurant'],
        rating: 4.5,
        user_ratings_total: 150,
        opening_hours: { open_now: true },
        vicinity: 'Downtown Area',
        business_status: 'OPERATIONAL'
      },
      {
        place_id: 'mock_gym_1',
        name: 'Fitness Center Plus',
        formatted_address: '456 Oak Ave, Your City',
        geometry: { location: { lat: latitude - 0.002, lng: longitude + 0.002 } },
        types: ['gym', 'health'],
        rating: 4.2,
        user_ratings_total: 89,
        opening_hours: { open_now: true },
        vicinity: 'Uptown District',
        business_status: 'OPERATIONAL'
      },
      {
        place_id: 'mock_park_1',
        name: 'Central Park',
        formatted_address: 'Park Ave, Your City',
        geometry: { location: { lat: latitude + 0.003, lng: longitude - 0.001 } },
        types: ['park', 'tourist_attraction'],
        rating: 4.7,
        user_ratings_total: 324,
        vicinity: 'City Center',
        business_status: 'OPERATIONAL'
      },
      {
        place_id: 'mock_restaurant_1',
        name: 'The Local Bistro',
        formatted_address: '789 Food St, Your City',
        geometry: { location: { lat: latitude + 0.0015, lng: longitude - 0.002 } },
        types: ['restaurant', 'meal_takeaway'],
        rating: 4.3,
        user_ratings_total: 203,
        opening_hours: { open_now: true },
        vicinity: 'Food District',
        business_status: 'OPERATIONAL'
      },
      {
        place_id: 'mock_library_1',
        name: 'City Public Library',
        formatted_address: '321 Knowledge Ave, Your City',
        geometry: { location: { lat: latitude - 0.001, lng: longitude - 0.001 } },
        types: ['library', 'establishment'],
        rating: 4.6,
        user_ratings_total: 156,
        opening_hours: { open_now: true },
        vicinity: 'Academic Quarter',
        business_status: 'OPERATIONAL'
      }
    ];

    if (type) {
      return mockPlaces.filter(place => place.types.includes(type));
    }

    return mockPlaces;
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== 'AIzaSyDzTGzOaQGxnPkRyXqtQgdLwzFPKqZvQVY';
  }
}

export const googlePlacesService = new GooglePlacesService();
