// =================================================================
// OpenStreetMap Service
//
// This service interacts with the OpenStreetMap (OSM) Overpass API.
// OSM is a community-driven, open-source mapping project that
// contains incredibly detailed data about points of interest, including
// "hidden gems" like benches, street art, and hiking trails that
// are not available in commercial APIs.
// =================================================================

const OVERPASS_API_BASE_URL = 'https://overpass-api.de/api/interpreter';

interface OsmNode {
    type: 'node';
    id: number;
    lat: number;
    lon: number;
    tags: { [key: string]: string };
}

class OpenStreetMapService {
    /**
     * Queries the Overpass API for specific features within a bounding box.
     * @param south - The southern latitude of the bounding box.
     * @param west - The western longitude of the bounding box.
     * @param north - The northern latitude of the bounding box.
     * @param east - The eastern longitude of the bounding box.
     * @param feature - The OSM feature to query (e.g., 'amenity'='bench').
     * @returns A promise that resolves to an array of OSM nodes.
     */
    async queryFeaturesInBoundingBox(
        south: number,
        west: number,
        north: number,
        east: number,
        feature: { key: string; value: string }
    ): Promise<OsmNode[]> {
        // Overpass QL query string
        const query = `
            [out:json];
            (
                node["${feature.key}"="${feature.value}"](${south},${west},${north},${east});
            );
            out body;
        `;

        const url = `${OVERPASS_API_BASE_URL}?data=${encodeURIComponent(query)}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.elements) {
                return data.elements.filter((el: any) => el.type === 'node');
            }

            return [];
        } catch (error) {
            console.error('Failed to fetch from Overpass API:', error);
            return [];
        }
    }

    // TODO: Add more methods for different types of Overpass queries
    // - queryByRadius(lat, lon, radius, feature)
    // - queryWaysAndRelations(bbox, feature) for things like parks or hiking trails
}

export const openStreetMapService = new OpenStreetMapService(); 