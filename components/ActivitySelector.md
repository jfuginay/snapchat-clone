# ActivitySelector Component 🎯

A comprehensive React Native component for TribeFind that allows users to select activities/interests with skill levels and saves selections to Supabase.

## 🚀 Features

✅ **Fetches real activities** from Supabase `activities` table  
✅ **Multi-select with skill levels** (beginner/intermediate/advanced)  
✅ **Saves to user_activities table** with real-time sync  
✅ **FlatList with checkboxes** for smooth performance  
✅ **Loading states** and comprehensive error handling  
✅ **Search functionality** with real-time filtering  
✅ **Category filtering** (Sports, Creative, Technology, etc.)  
✅ **Pull-to-refresh** support  
✅ **Customizable props** for different use cases  

## 📱 Basic Usage

```javascript
import ActivitySelector from '../components/ActivitySelector';

const MyComponent = () => {
  const handleSelectionChange = (activityIds) => {
    console.log('Selected activities:', activityIds);
  };

  return (
    <ActivitySelector 
      onSelectionChange={handleSelectionChange}
      showCategories={true}
      allowMultiSelect={true}
    />
  );
};
```

## 🔧 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSelectionChange` | `function` | `() => {}` | Callback when selection changes |
| `showCategories` | `boolean` | `true` | Show category filter buttons |
| `allowMultiSelect` | `boolean` | `true` | Allow multiple activity selection |
| `maxSelections` | `number` | `null` | Maximum number of selections |
| `selectedCategory` | `string` | `null` | Initial category filter |

## 🎯 Use Cases

### 1. **Onboarding Flow**
```javascript
<ActivitySelector 
  onSelectionChange={handleSelection}
  maxSelections={5}
  showCategories={true}
/>
```

### 2. **Single Selection**
```javascript
<ActivitySelector 
  onSelectionChange={handleSelection}
  allowMultiSelect={false}
  showCategories={true}
/>
```

### 3. **Category Specific**
```javascript
<ActivitySelector 
  onSelectionChange={handleSelection}
  selectedCategory="Sports"
  showCategories={false}
/>
```

## 🗄️ Database Requirements

### 1. Run Activities Schema
```sql
-- Run this in your Supabase SQL Editor
-- Copy contents from src/sql/activities_schema.sql
```

### 2. Database Tables

**activities table:**
- `id` - UUID primary key
- `name` - Activity name
- `description` - Activity description
- `category` - Category (Sports, Creative, etc.)
- `icon` - Emoji icon
- `color` - Hex color code
- `is_active` - Boolean for enabled activities
- `popularity_score` - Integer for sorting

**user_activities table:**
- `user_id` - References auth.users(id)
- `activity_id` - References activities(id)
- `skill_level` - 'beginner', 'intermediate', 'advanced'
- `interest_level` - 1-10 scale
- `is_teaching` - Boolean
- `is_learning` - Boolean
- `notes` - Text notes

## 🎨 UI Components

### Activity Item
- **Icon** - Emoji representing the activity
- **Name** - Activity name with category
- **Description** - Brief description (truncated)
- **Skill Level** - Shown when selected
- **Checkbox** - Selection indicator

### Skill Level Modal
- **Beginner** 🌱 - Just starting out
- **Intermediate** 🌿 - Some experience  
- **Advanced** 🌳 - Very experienced

### Category Filters
- Horizontal scrollable buttons
- All, Sports, Creative, Technology, Outdoor, Lifestyle, Education, Wellness, Social

## 📊 Sample Activities

The schema includes 25+ pre-loaded activities across categories:

### 🏃‍♂️ Sports
- Running, Basketball, Yoga, Rock Climbing, Surfing

### 🎨 Creative  
- Photography, Painting, Music Production, Dancing, Writing

### 💻 Technology
- Web Development, Mobile Development, Data Science, UI/UX Design, Game Development

### 🏔️ Outdoor
- Hiking, Camping, Mountain Biking, Kayaking

### 👨‍🍳 Lifestyle
- Cooking, Baking, Wine Tasting

### 📚 Education
- Reading, Language Learning, Meditation, Board Games

## 🔄 State Management

The component manages internal state for:
- `activities` - All available activities
- `selectedActivities` - Map of selected activities with skill levels
- `loading` - Loading state for data fetching
- `saving` - Saving state for database operations
- `searchQuery` - Current search filter
- `categories` - Available categories

## 🚀 Performance Features

- **FlatList** for efficient rendering of large lists
- **Memoized callbacks** to prevent unnecessary re-renders
- **Optimized queries** with indexes on database
- **Pull-to-refresh** for manual data updates
- **Debounced search** to reduce API calls

## 🔒 Security Features

- **Row Level Security** policies on database tables
- **User authentication** required for all operations
- **Data validation** on skill levels and selections
- **Sanitized queries** to prevent injection attacks

## 🎯 Integration with TribeFind

### FIND Framework Alignment:
- **Find** - Discover new activities and interests
- **Interests** - Select and categorize personal interests  
- **Nurture** - Build skill profiles for better matching
- **Development** - Track skill progression over time

### Tribe Matching:
- Activities used for finding like-minded users
- Skill levels help match beginners with mentors
- Interest levels indicate passion strength
- Teaching/learning flags enable knowledge sharing

## 🧪 Testing

### Manual Testing:
1. Select activities and verify database saves
2. Test skill level selection modal
3. Verify category filtering works
4. Test search functionality
5. Check loading and error states

### Integration Testing:
1. Test with different user authentication states
2. Verify RLS policies work correctly
3. Test with empty database
4. Test with large datasets

## 🔧 Troubleshooting

### Common Issues:

1. **"Activities not loading"**
   - Check Supabase connection
   - Verify database schema is set up
   - Check Row Level Security policies

2. **"Selections not saving"**
   - Verify user is authenticated
   - Check user_activities table permissions
   - Validate skill level values

3. **"Performance issues"**
   - Check if database indexes are created
   - Verify FlatList keyExtractor is unique
   - Consider pagination for large datasets

### Debug Mode:
Enable console logging to see selection changes:
```javascript
<ActivitySelector 
  onSelectionChange={(ids) => {
    console.log('Selection changed:', ids);
    handleSelection(ids);
  }}
/>
```

## 📚 Related Files

- **Component**: `components/ActivitySelector.js`
- **Database Schema**: `src/sql/activities_schema.sql`
- **Usage Examples**: `src/examples/ActivitySelectorUsage.js`
- **Location Service**: `src/services/locationService.js`

## 🤝 Contributing

1. Follow existing code style and patterns
2. Add JSDoc comments for new functions
3. Update this documentation for any changes
4. Test on both iOS and Android
5. Ensure database migrations are backward compatible

---

**Built with ❤️ for TribeFind - helping users identify their interests and find their tribe!** 🎯 