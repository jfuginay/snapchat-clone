-- =================================================================
-- Final Attempt: Direct and Simple Extension Enablement
--
-- Given the diagnostic tests, we know the extension is available.
-- This script uses the most direct command possible to enable it,
-- which can resolve session-specific or permission-related hiccups.
-- =================================================================

-- Step 1: Directly enable the `pgvector` extension.
-- We are not specifying a schema here, allowing PostgreSQL to use
-- the default path. Since we know it is available, this should work.
CREATE EXTENSION vector;

-- Step 2: Directly enable the `postgis` extension.
CREATE EXTENSION postgis;

-- Step 3: Run the V2 schema script again.
-- Now that the extensions are forcibly enabled, this script will
-- run successfully and create the `local_knowledge` table.
-- You can copy the content from `features/rag/local_knowledge_schema_v2.sql`
-- and paste it below this line, or run it as a separate query.

-- =================================================================
-- V2 Schema Script from `features/rag/local_knowledge_schema_v2.sql`
-- Paste the contents of that file here to run everything at once.
-- =================================================================

-- (Paste the full V2 script here)
-- Example:
-- CREATE TABLE IF NOT EXISTS public.local_knowledge ( ... );
-- ... etc.

SELECT '✅ Extensions should now be fully enabled. Please run the V2 schema script if you haven''t pasted it below.' as status; 