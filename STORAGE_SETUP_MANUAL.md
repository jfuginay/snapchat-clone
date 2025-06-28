# 📸 Manual Storage Setup Guide

## The Issue
You got a permission error when running the full database script because storage policies require special permissions. We need to set up storage buckets manually through the Supabase Dashboard.

## Quick Fix (3 minutes)

### Step 1: Run the Safe Database Script First
1. **Open your Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Select your **snapchat-clone** project
   - Go to **SQL Editor** in the left sidebar

2. **Run the Safe Database Fix**
   - Copy the entire contents of `PRODUCTION_DATABASE_FIX_SAFE.sql`
   - Paste it into the SQL Editor
   - Click **"Run"**

### Step 2: Create Storage Buckets Manually

1. **Go to Storage Section**
   - In your Supabase dashboard, click **Storage** in the left sidebar

2. **Create Photos Bucket**
   - Click **"Create Bucket"**
   - **Bucket Name:** `photos`
   - **Public bucket:** ✅ (checked)
   - Click **"Create bucket"**

3. **Create Videos Bucket**
   - Click **"Create Bucket"** again
   - **Bucket Name:** `videos`
   - **Public bucket:** ✅ (checked)
   - Click **"Create bucket"**

### Step 3: Set Up Storage Policies

1. **Go to Storage Policies**
   - Click **Storage** → **Policies** in the left sidebar

2. **Create Policies for Photos Bucket**
   - Click **"New Policy"** next to the **photos** bucket
   - Create these 4 policies:

   **Policy 1: Upload Photos**
   - **Policy Name:** `Users can upload own photos`
   - **Allowed Operation:** `INSERT`
   - **Target Roles:** `authenticated`
   - **Policy Definition:**
   ```sql
   bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]
   ```

   **Policy 2: View Photos**
   - **Policy Name:** `Anyone can view photos`
   - **Allowed Operation:** `SELECT`
   - **Target Roles:** `authenticated, anon`
   - **Policy Definition:**
   ```sql
   bucket_id = 'photos'
   ```

   **Policy 3: Update Photos**
   - **Policy Name:** `Users can update own photos`
   - **Allowed Operation:** `UPDATE`
   - **Target Roles:** `authenticated`
   - **Policy Definition:**
   ```sql
   bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]
   ```

   **Policy 4: Delete Photos**
   - **Policy Name:** `Users can delete own photos`
   - **Allowed Operation:** `DELETE`
   - **Target Roles:** `authenticated`
   - **Policy Definition:**
   ```sql
   bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]
   ```

3. **Create the Same 4 Policies for Videos Bucket**
   - Repeat the above steps but replace `'photos'` with `'videos'` in all policy definitions

### Step 4: Verify Setup

1. **Check Storage Dashboard**
   - Go to **Storage** in your Supabase dashboard
   - You should see:
     - ✅ **photos** bucket (public)
     - ✅ **videos** bucket (public)

2. **Check Policies**
   - Go to **Storage** → **Policies**
   - You should see 8 total policies (4 for photos, 4 for videos)

### Step 5: Test Your App

1. **Restart your Expo server**
   ```bash
   # Stop current server (Ctrl+C)
   npm start
   ```

2. **Test Photo Upload**
   - Open the camera in your app
   - Take a photo
   - You should see "📸 Success!" message instead of errors

## What This Does

- **Photos bucket**: Stores user photos with proper access control
- **Videos bucket**: Ready for video recording feature
- **Public access**: Images can be viewed by anyone (for sharing)
- **User folders**: Each user gets their own folder for organization
- **Security**: Users can only upload/edit/delete their own files

## Troubleshooting

### If you still get "Bucket not found" errors:
1. **Double-check bucket names** - Must be exactly `photos` and `videos`
2. **Ensure buckets are public** - Toggle should be ON
3. **Restart your app** - Close and reopen the Expo app

### If photos upload but don't display:
1. **Check bucket is public** - Toggle "Public bucket" to ON
2. **Verify view policy exists** - "Anyone can view photos" policy
3. **Clear app cache** - Restart Expo development server

### If you get permission errors:
1. **Check upload policy** - "Users can upload own photos" policy
2. **Verify policy definition** - Must include the `auth.uid()` check
3. **Test with simple photo** - Try without filters first

## Success! 🎉

Once complete, your TribeFind app will have:
- ✅ **Working map** with nearby tribe members
- ✅ **Photo uploads** to cloud storage
- ✅ **Activity matching** with 22+ categories
- ✅ **Production-ready database** with all optimizations

Your app is now ready for real users! 🚀
