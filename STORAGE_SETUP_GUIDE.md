# 📸 Fix Photo Upload - Storage Setup Guide

## The Issue
You're seeing **"Bucket not found"** errors when taking photos because the Supabase storage bucket doesn't exist yet.

## Quick Fix (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your **snapchat-clone** project

### Step 2A: Create Storage Bucket
1. In your Supabase dashboard, go to **Storage** (left sidebar)
2. Click **"Create Bucket"**
3. **Bucket Name:** `photos`
4. **Public bucket:** ✅ (checked)
5. Click **"Create bucket"**

### Step 2B: Set Storage Policies
1. Go to **Storage** → **Policies**
2. Click on the **"photos"** bucket
3. Add these 4 policies by clicking **"New Policy"** for each:

**Policy 1:**
- Name: `Users can upload own photos`
- Operation: `INSERT`, Target: `authenticated`
- Definition: `bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]`

**Policy 2:**
- Name: `Anyone can view photos`  
- Operation: `SELECT`, Target: `authenticated, anon`
- Definition: `bucket_id = 'photos'`

**Policy 3:**
- Name: `Users can update own photos`
- Operation: `UPDATE`, Target: `authenticated`  
- Definition: `bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]`

**Policy 4:**
- Name: `Users can delete own photos`
- Operation: `DELETE`, Target: `authenticated`
- Definition: `bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]`

### Step 3: Verify Setup
1. Go to **Storage** in the left sidebar
2. You should see a **"photos"** bucket listed
3. If you see it, you're all set! 🎉

### Step 4: Test Photo Upload
1. Restart your Expo app (`Ctrl+C` then `npm start`)
2. Take a photo
3. You should now see **"Photo saved to gallery and cloud storage"**

## What This Does
The script creates:
- ✅ A public "photos" storage bucket
- ✅ Security policies so users can only manage their own photos
- ✅ Proper folder structure (each user gets their own folder)

## Still Having Issues?
If you're still getting RLS errors after running the storage setup:
1. Make sure you ran the main `database-setup-safe.sql` script first
2. Check that you're logged in to the app
3. Look at the console logs for specific error details

## Why Not Use the SQL Script?
The `supabase-storage-setup.sql` script won't work because:
- Storage policies must be set through the dashboard UI
- You'll get "must be owner of table objects" error if you try via SQL
- This is normal Supabase behavior for security

## Alternative: Quick Test Without Cloud Storage
If you just want to test the camera without cloud storage:
- Photos will still save to your device gallery  
- You'll see "Photo saved to gallery" instead of cloud storage errors
- Cloud storage can be set up later when you're ready to deploy 