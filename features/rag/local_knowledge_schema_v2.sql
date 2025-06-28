-- =================================================================
-- Schema for Local Knowledge RAG - V2 (Resilient Version)
--
-- This script is designed to be highly resilient and idempotent.
-- It intelligently handles cases where extensions might already
-- exist, even in non-standard schemas (like `postgis` in `public`).
-- =================================================================

-- Step 1: Intelligently enable required extensions.

-- Enable pgvector in the `extensions` schema if it's not already enabled.
CREATE EXTENSION IF NOT EXISTS pgvector WITH SCHEMA extensions;

-- Enable postgis, handling the case where it might already exist in `public`.
DO $$
BEGIN
    -- Check if postgis is installed at all.
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        -- If not installed, create it in the correct `extensions` schema.
        CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
        RAISE NOTICE 'PostGIS extension was not found, so it has been created in the `extensions` schema.';
    ELSE
        -- If it is already installed, just log a notice. We don't need to do anything else.
        RAISE NOTICE 'PostGIS extension is already installed. Proceeding with schema setup.';
    END IF;
END;
$$;


-- Step 2: Create the `local_knowledge` table.
-- This table will store tips, events, and other local data points.
CREATE TABLE IF NOT EXISTS public.local_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    content TEXT NOT NULL,
    location GEOGRAPHY(Point, 4326),
    metadata JSONB,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments to columns for clarity.
COMMENT ON TABLE public.local_knowledge IS 'Stores vectorized and geolocated information about local points of interest for the RAG feature.';
COMMENT ON COLUMN public.local_knowledge.source IS 'The origin of the data (e.g., foursquare_tips, osm_notes).';
COMMENT ON COLUMN public.local_knowledge.location IS 'The geographic coordinates (latitude, longitude) of the point of interest.';
COMMENT ON COLUMN public.local_knowledge.embedding IS 'A high-dimensional vector representation of the content for semantic search.';


-- Step 3: Create indexes to optimize query performance.
CREATE INDEX IF NOT EXISTS local_knowledge_location_idx ON public.local_knowledge USING GIST (location);
CREATE INDEX IF NOT EXISTS local_knowledge_source_idx ON public.local_knowledge (source);


-- Step 4: Create or replace the trigger function to automatically update `updated_at`.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the table.
DROP TRIGGER IF EXISTS on_local_knowledge_update ON public.local_knowledge;
CREATE TRIGGER on_local_knowledge_update
BEFORE UPDATE ON public.local_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();


SELECT '✅ V2 Local Knowledge RAG schema setup complete.' as status; 