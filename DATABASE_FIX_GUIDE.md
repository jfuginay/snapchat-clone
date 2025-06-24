# 🔧 Database Column Error Fix

## ❌ **Error Encountered:**
```
ERROR: 42703: column "requester_id" does not exist
```

## ✅ **Root Cause:**
The database setup SQL had table creation order issues and column reference problems.

---

## 🚀 **SOLUTION - Follow These Steps:**

### 1. **Clear Your Database** (Important!)
Go to your Supabase Dashboard:
1. **Open**: https://supabase.com/dashboard/projects/hvjqvyozpczekwwizxzj
2. **Go to**: Database → Tables
3. **Delete any existing tables** manually if they exist:
   - `photos`
   - `messages` 
   - `chat_rooms`
   - `friendships`
   - `locations`
   - `users`

### 2. **Run the Fixed SQL**
1. **Go to**: SQL Editor in Supabase
2. **Copy the ENTIRE contents** of the updated `database-setup.sql`
3. **Paste and Run** - it will now work correctly!

### 3. **What's Fixed:**
- ✅ **Proper table creation order** (users first, then dependent tables)
- ✅ **Correct foreign key references** (all pointing to `public.users`)
- ✅ **Clean slate setup** (drops existing tables first)
- ✅ **Better error handling** for policies and triggers

---

## 📊 **Expected Result:**
After running the fixed SQL, you should see these tables created:
- ✅ `users` - User profiles and settings
- ✅ `locations` - Real-time location data  
- ✅ `friendships` - Friend relationships
- ✅ `chat_rooms` - Chat room metadata
- ✅ `messages` - Chat messages
- ✅ `photos` - Photo metadata

---

## 🧪 **Test the Fix:**
1. **Refresh your Expo Go app** 
2. **Try creating a new account**
3. **Should work without errors now!**

---

## 🆘 **If You Still Get Errors:**
1. Make sure you **cleared all existing tables** first
2. Check that you copied the **entire** updated SQL file
3. Look for any **error messages** in the SQL Editor
4. Ensure your **Supabase project is active**

The database should now be properly set up for your Snapchat clone! 🎉 