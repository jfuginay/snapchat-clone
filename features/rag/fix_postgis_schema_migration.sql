-- =================================================================
-- Fix: Move the `postgis` Extension from `public` to `extensions` Schema
--
-- Run this script in your Supabase SQL Editor to correct the
-- installation schema of the PostGIS extension without losing data.
-- =================================================================

-- Step 1: Move the main `postgis` extension to the `extensions` schema.
-- This command is atomic and will also move all dependent objects,
-- such as functions, types (GEOGRAPHY, GEOMETRY), and tables (`spatial_ref_sys`).
-- This is the core of the fix.
ALTER EXTENSION postgis SET SCHEMA extensions;

-- Step 2: Move related PostGIS utility extensions if they exist in `public`.
-- PostGIS often includes helper extensions. This block ensures they are
-- also moved to the `extensions` schema for good organization.
DO $$
BEGIN
   -- Check for and move the TIGER geocoder extension
   IF EXISTS (
       SELECT 1 FROM pg_extension
       WHERE extname = 'postgis_tiger_geocoder'
       AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
   ) THEN
      ALTER EXTENSION postgis_tiger_geocoder SET SCHEMA extensions;
      RAISE NOTICE 'Moved postgis_tiger_geocoder to extensions schema.';
   END IF;

   -- Check for and move the topology extension
   IF EXISTS (
       SELECT 1 FROM pg_extension
       WHERE extname = 'postgis_topology'
       AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
   ) THEN
      ALTER EXTENSION postgis_topology SET SCHEMA extensions;
      RAISE NOTICE 'Moved postgis_topology to extensions schema.';
   END IF;
END;
$$;

-- Step 3: Verify the move was successful.
-- This query should now return `extensions` as the schema for the `spatial_ref_sys` table,
-- which is a key part of PostGIS.
SELECT
    n.nspname as schema_name,
    c.relname as table_name
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'spatial_ref_sys';

-- Final success message
SELECT '✅ PostGIS extension successfully moved to the `extensions` schema.' as status; 