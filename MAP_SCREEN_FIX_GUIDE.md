# 🗺️ MapScreen Database Fix Guide

## Issue: "Could not find a relationship between user_activities and activities"

The MapScreen is trying to query database tables that don't exist yet. Here's how to fix it:

## ✅ **Quick Fix: Run Database Setup**

### **Step 1: Open Supabase Dashboard**
1. Go to [supabase.com](https://supabase.com)
2. Login and open your TribeFind project
3. Click on **SQL Editor** in the left sidebar

### **Step 2: Run Complete Database Setup**
1. Copy the entire contents of `COMPLETE_DATABASE_SETUP.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** button
4. Wait for completion (should see success messages)

### **Step 3: Verify Tables Created**
Check that these tables now exist in **Database > Tables**:
- ✅ `activities` - All available activities/interests
- ✅ `user_activities` - User's selected activities with skill levels
- ✅ `users` - Enhanced with PostGIS location support

### **Step 4: Test MapScreen**
1. Restart your Expo app: `npx expo start`
2. Navigate to the Map tab
3. Grant location permission when prompted
4. Should now work without database errors!

---

## 🎯 **What This Fixes**

### **Before Fix:**
```
❌ Error: Could not find relationship between user_activities and activities
❌ MapScreen crashes when loading
❌ No activities data available
```

### **After Fix:**
```
✅ Activities and user_activities tables exist
✅ PostGIS location queries work
✅ MapScreen loads without errors
✅ Nearby tribe members with shared activities display
```

---

## 📱 **Next Steps After Database Setup**

### **1. Add User Activities**
- Go to Profile > Settings
- Add some activities/interests (Photography, Hiking, etc.)
- This enables finding tribe members with shared interests

### **2. Test Location Features**
- Enable location permission when prompted
- Move around to test different locations
- Try different search radius settings (5km, 10km, 25km)

### **3. Test with Multiple Users**
- Create another test account
- Add overlapping activities
- Set different locations to test proximity detection

---

## 🔧 **Technical Details**

### **What the Database Setup Creates:**

1. **PostGIS Extension** - For spatial location queries
2. **Enhanced Users Table** - With GEOMETRY location column
3. **Activities Table** - Sample activities with icons and categories
4. **User Activities Table** - Links users to their selected activities
5. **Spatial Functions** - `get_nearby_tribe_members()` for MapScreen
6. **Indexes** - For optimal query performance
7. **RLS Policies** - For security and data protection

### **PostGIS Location Format:**
```sql
-- Location stored as PostGIS POINT
location GEOMETRY(POINT, 4326)

-- Example location update
UPDATE users SET location = ST_GeomFromText('POINT(-122.4194 37.7749)', 4326)
WHERE id = 'user-uuid';
```

### **Nearby Query Example:**
```sql
-- Find users within 10km with shared activities
SELECT * FROM get_nearby_tribe_members(37.7749, -122.4194, 10000, ARRAY[1, 2, 3]);
```

---

## 🚨 **Troubleshooting**

### **If SQL Script Fails:**
1. **Extension Error:** Your Supabase project might not have PostGIS enabled
   - Contact Supabase support to enable PostGIS extension
   - Or try running: `CREATE EXTENSION IF NOT EXISTS "postgis";`

2. **Permission Error:** Make sure you're the project owner
   - Only project owners can run database migrations
   - Check your role in Project Settings

3. **Existing Data:** If you have existing users/photos data
   - The script will DROP and recreate tables
   - Backup important data first if needed

### **If App Still Shows Errors:**
1. **Clear App Cache:** 
   - Stop Expo server
   - Run: `npx expo start --clear`
   - Restart app

2. **Check Network Connection:**
   - Ensure your iPhone can reach Supabase
   - Check your `.env` file has correct credentials

3. **Verify Database Setup:**
   - Go to Supabase Dashboard > Database > Tables
   - Confirm all tables exist with proper structure

---

## 🎉 **Success Indicators**

You'll know it's working when:
- ✅ Map loads without console errors
- ✅ Location permission request appears
- ✅ User location marker shows on map
- ✅ Search radius circle is visible
- ✅ Stats at bottom show "0 tribe members nearby" (initially)
- ✅ No more "PGRST200" errors in console

Once you add activities and have test users with locations, you'll see:
- 🎯 Colored markers for tribe members
- 📊 Shared activity counts
- 🗨️ Member detail modals when tapping markers

---

**Need help?** Check the console logs for specific errors and verify each step above! 🚀 