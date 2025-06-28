-- =================================================================
-- ⚠️ WARNING: DESTRUCTIVE OPERATION - V2 ⚠️
--
-- This script will permanently delete all user data.
-- This version uses DELETE instead of TRUNCATE to avoid
-- permissions errors with the protected `auth` schema.
-- =================================================================

-- Step 1: Drop all functions that might depend on the tables.
-- The `CASCADE` option will also remove any triggers that use these functions.
DROP FUNCTION IF EXISTS public.nearby_users_function() CASCADE;
DROP FUNCTION IF EXISTS public.nearby_tribe_members_function() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Step 2: Drop all tables.
-- Using `CASCADE` ensures that any dependent objects like foreign key
-- constraints, indexes, and sequences are also dropped automatically.
DROP TABLE IF EXISTS public.location_history CASCADE;
DROP TABLE IF EXISTS public.user_activities CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.local_knowledge CASCADE; -- In case it was partially created

-- Step 3: Delete all users from the auth schema.
-- We use DELETE here because the `postgres` role does not have
-- permission to TRUNCATE and reset sequences owned by the
-- internal `supabase_auth_admin` role. DELETE just removes the rows.
DELETE FROM auth.users;

SELECT '✅ All dependent tables and user data have been successfully nuked. The database is ready for a clean rebuild.' as status; 