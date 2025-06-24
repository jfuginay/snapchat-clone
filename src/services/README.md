# TribeFind Location Service 🎯

A comprehensive location service for the TribeFind React Native app that enables users to **Find, Nurture, and Develop** connections through shared locations and memories.

## 🌟 Features

- **Location Permissions Management** - Handle iOS/Android location permissions gracefully
- **Current Location Retrieval** - Get precise GPS coordinates with customizable accuracy
- **Database Integration** - Store locations in Supabase with PostGIS POINT geometry
- **Real-time Location Tracking** - Continuous location updates with configurable intervals
- **Tribe Discovery** - Find nearby users within customizable radius
- **Distance Calculations** - Calculate distances between any two coordinates
- **Privacy Controls** - Respect user privacy preferences and sharing settings

## 🚀 Quick Start

### Installation

```bash
npm install expo-location
```

### Basic Usage

```javascript
import locationService from './src/services/locationService';

// Request location permission
const permission = await locationService.requestLocationPermission();

// Get current location
const location = await locationService.getCurrentLocation();

// Update user location in database
const result = await locationService.updateUserLocation(userId, location.location);
```

## 📋 API Reference

### `requestLocationPermission()`

Request location permissions from the user.

**Returns:** `Promise<{granted: boolean, error?: string}>`

```javascript
const result = await locationService.requestLocationPermission();
if (result.granted) {
  console.log('Permission granted!');
} else {
  console.log('Permission denied:', result.error);
}
```

### `getCurrentLocation(options?)`

Get the current location of the user.

**Parameters:**
- `options.accuracy` - `'high' | 'medium' | 'low'` (default: 'medium')
- `options.timeout` - Timeout in milliseconds (default: 15000)

**Returns:** `Promise<{location?: Object, error?: string}>`

```javascript
const result = await locationService.getCurrentLocation({
  accuracy: 'high',
  timeout: 10000
});

if (result.location) {
  console.log('Location:', result.location);
  // {
  //   latitude: 37.7749,
  //   longitude: -122.4194,
  //   accuracy: 5,
  //   timestamp: '2024-01-01T12:00:00Z'
  // }
}
```

### `updateUserLocation(userId, location)`

Update user location in Supabase database using PostGIS POINT.

**Parameters:**
- `userId` - String: User's unique identifier
- `location` - Object: Location data with latitude/longitude

**Returns:** `Promise<{success: boolean, error?: string, data?: Object}>`

```javascript
const result = await locationService.updateUserLocation('user-123', {
  latitude: 37.7749,
  longitude: -122.4194,
  accuracy: 10,
  timestamp: new Date().toISOString()
});

if (result.success) {
  console.log('Location updated for user:', result.data.username);
}
```

### `startLocationTracking(userId, options?)`

Start continuous location tracking with real-time database updates.

**Parameters:**
- `userId` - String: User ID to track
- `options.interval` - Number: Update interval in milliseconds (default: 30000)
- `options.accuracy` - String: Location accuracy ('high', 'medium', 'low')
- `options.onLocationUpdate` - Function: Callback for location updates

**Returns:** `Promise<{success: boolean, error?: string}>`

```javascript
const result = await locationService.startLocationTracking('user-123', {
  interval: 30000, // 30 seconds
  accuracy: 'medium',
  onLocationUpdate: (location, updateResult) => {
    console.log('New location:', location);
    console.log('Database update:', updateResult.success);
  }
});
```

### `stopLocationTracking()`

Stop location tracking.

```javascript
locationService.stopLocationTracking();
```

### `getNearbyTribeMembers(location, radiusKm?)`

Find nearby tribe members within a specified radius.

**Parameters:**
- `location` - Object: Current location {latitude, longitude}
- `radiusKm` - Number: Search radius in kilometers (default: 5)

**Returns:** `Promise<{users?: Array, error?: string}>`

```javascript
const result = await locationService.getNearbyTribeMembers(
  { latitude: 37.7749, longitude: -122.4194 },
  10 // 10km radius
);

if (result.users) {
  console.log(`Found ${result.users.length} nearby tribe members`);
  result.users.forEach(user => {
    console.log(`${user.display_name} - ${user.distance_meters}m away`);
  });
}
```

### `calculateDistance(point1, point2)`

Calculate distance between two coordinates using Haversine formula.

**Parameters:**
- `point1` - Object: {latitude, longitude}
- `point2` - Object: {latitude, longitude}

**Returns:** `Number` - Distance in kilometers

```javascript
const distance = locationService.calculateDistance(
  { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
  { latitude: 40.7128, longitude: -74.0060 }   // New York
);
console.log(`Distance: ${distance.toFixed(2)} km`);
```

## 🗄️ Database Setup

### 1. Run Location Migration

Execute the SQL migration in your Supabase SQL Editor:

```sql
-- Copy and paste contents of src/sql/tribefind_location_migration.sql
```

This will:
- Add location columns to the users table
- Create PostGIS indexes for performance
- Set up Row Level Security policies
- Create location validation functions

### 2. Create Nearby Users Function

Run the PostGIS function:

```sql
-- Copy and paste contents of src/sql/nearby_users_function.sql
```

### 3. Database Schema

The migration adds these columns to your `users` table:

| Column | Type | Description |
|--------|------|-------------|
| `location` | `GEOMETRY(POINT, 4326)` | PostGIS point with lat/lng |
| `location_accuracy` | `FLOAT` | Location accuracy in meters |
| `location_updated_at` | `TIMESTAMPTZ` | When location was last updated |
| `location_sharing_enabled` | `BOOLEAN` | Whether user shares location |
| `tribe_discovery_radius_km` | `INT` | User's discovery radius preference |

## 🔒 Privacy & Security

### Location Sharing Control

Users control their location visibility through:

```javascript
// Only users with location_sharing_enabled = true are discoverable
// Friends always see each other's locations
// Users always see their own location
```

### Row Level Security

- Users can only update their own location
- Location visibility respects privacy settings
- Authenticated users only for all operations

### Data Validation

- Coordinates validated within Earth's bounds
- Accuracy and timestamp validation
- User authentication required for all database operations

## 📱 React Native Integration

### Permission Handling

Add to your `app.json`:

```json
{
  "expo": {
    "plugins": ["expo-location"],
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "TribeFind uses location to help you find and connect with your tribe members nearby."
      }
    },
    "android": {
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ]
    }
  }
}
```

### Component Integration

```javascript
import React, { useEffect } from 'react';
import locationService from './src/services/locationService';
import { useAuth } from './services/AuthService';

const TribeFinderScreen = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Start location tracking when user logs in
      locationService.startLocationTracking(user.id, {
        interval: 60000, // 1 minute
        accuracy: 'medium'
      });
    }

    return () => {
      // Cleanup when component unmounts
      locationService.stopLocationTracking();
    };
  }, [user]);

  // Component implementation...
};
```

## 🎯 TribeFind Use Cases

### 1. **Find** - Discovery
- Find tribe members with similar interests nearby
- Discover new locations where your tribe gathers
- Get notified when tribe members are nearby

### 2. **Interests** - Connection
- Connect based on shared locations and experiences
- See where your interests align geographically
- Find local events and gatherings

### 3. **Nurture** - Relationships
- Stay connected with location-based check-ins
- Share meaningful locations with your tribe
- Build memories through shared experiences

### 4. **Development** - Growth
- Track personal exploration and growth
- Discover new areas for skill development
- Connect with mentors and learning opportunities nearby

## 🔧 Troubleshooting

### Common Issues

1. **Location Permission Denied**
   ```javascript
   // Check permission status
   const status = await Location.getForegroundPermissionsAsync();
   console.log('Permission status:', status);
   ```

2. **Location Timeout**
   ```javascript
   // Increase timeout or use lower accuracy
   const location = await locationService.getCurrentLocation({
     timeout: 30000,
     accuracy: 'low'
   });
   ```

3. **Database Connection Issues**
   ```javascript
   // Check Supabase connection
   const { data, error } = await supabase.from('users').select('id').limit(1);
   if (error) console.log('Database error:', error);
   ```

### Performance Optimization

- Use appropriate accuracy levels (high accuracy uses more battery)
- Set reasonable tracking intervals (30+ seconds recommended)
- Implement location caching for repeated requests
- Use distance thresholds to avoid unnecessary updates

## 📚 Examples

See `src/examples/locationServiceUsage.js` for comprehensive usage examples including:

- Basic location permission and retrieval
- Database location updates
- Real-time location tracking
- Finding nearby tribe members
- Distance calculations

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add comprehensive error handling
3. Include JSDoc comments for all functions
4. Test on both iOS and Android
5. Update documentation for any new features

## 📄 License

Part of the TribeFind React Native application. See main project license for details.

---

**Built with ❤️ for the TribeFind community - helping you find, nurture, and develop meaningful connections through shared locations and experiences.** 