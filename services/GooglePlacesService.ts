// =================================================================
// Google Places Service
//
// This service is responsible for interacting with the Google Places API
// to fetch detailed information about points of interest, including
// business details, reviews, photos, and more.
//
// It will be a key data source for the Local Knowledge RAG feature.
// =================================================================

import { GOOGLE_PLACES_API_KEY } from '@env';

if (!GOOGLE_PLACES_API_KEY) {
    throw new Error("Missing Google Places API Key. Please set GOOGLE_PLACES_API_KEY in your .env file.");
}

const PLACES_API_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

interface Place {
    id: string;
    name: string;
    // Add other relevant fields as we build out the feature
    // e.g., address, rating, photos, etc.
}

class GooglePlacesService {
    private apiKey: string;

    constructor() {
        this.apiKey = GOOGLE_PLACES_API_KEY;
    }

    /**
     * Fetches nearby places based on a location and radius.
     * @param latitude - The latitude of the center point.
     * @param longitude - The longitude of the center point.
     * @param radius - The radius in meters to search within.
     * @param type - The type of place to search for (e.g., 'restaurant', 'park').
     * @returns A promise that resolves to an array of places.
     */
    async findNearbyPlaces(
        latitude: number,
        longitude: number,
        radius: number,
        type: string
    ): Promise<Place[]> {
        const url = `${PLACES_API_BASE_URL}/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${this.apiKey}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.status !== 'OK') {
                console.error('Google Places API Error:', data.error_message || data.status);
                return [];
            }

            // TODO: Map the raw response to our Place interface
            return data.results;
        } catch (error) {
            console.error('Failed to fetch from Google Places API:', error);
            return [];
        }
    }

    // TODO: Add more methods as needed, such as:
    // - getPlaceDetails(placeId: string)
    // - getPlacePhotos(photoReference: string)
}

export const googlePlacesService = new GooglePlacesService(); 