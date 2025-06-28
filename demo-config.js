// Demo Configuration for Local Development and Grading
// Copy this to .env.local for instructor/student testing

export const DEMO_CONFIG = {
  // Supabase Configuration (Pre-configured for demo)
  SUPABASE_URL: 'https://rfvlxtzjtcaxkxisyuys.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdmx4dHpqdGNheGt4aXN5dXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3Nzg3NDgsImV4cCI6MjA2NjM1NDc0OH0.OrN9YGA5rzcC1mUjxd2maeAUFmnx9VixMgnm_LdLIVM',
  
  // Google Services
  GOOGLE_PLACES_API_KEY: 'AIzaSyBYv5SK3gpQnNaMF9IKu3uIx_V-y2nDLho',
  
  // Demo Accounts (Pre-configured)
  DEMO_ACCOUNTS: {
    primary: {
      email: 'demo@tribefind.app',
      password: 'DemoUser123!',
      name: 'Demo User',
      interests: ['Photography', 'Coffee', 'Hiking', 'Technology', 'Music']
    },
    test1: {
      email: 'test1@tribefind.app',
      password: 'TestUser123!',
      name: 'Test User One',
      interests: ['Hiking', 'Photography', 'Coffee', 'Art', 'Travel']
    },
    test2: {
      email: 'test2@tribefind.app',
      password: 'TestUser123!',
      name: 'Test User Two',
      interests: ['Fitness', 'Music', 'Travel', 'Food', 'Sports']
    }
  }
}

// Instructions for .env.local file:
/*
Create a .env.local file with:

EXPO_PUBLIC_SUPABASE_URL=https://rfvlxtzjtcaxkxisyuys.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdmx4dHpqdGNheGt4aXN5dXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3Nzg3NDgsImV4cCI6MjA2NjM1NDc0OH0.OrN9YGA5rzcC1mUjxd2maeAUFmnx9VixMgnm_LdLIVM
GOOGLE_PLACES_API_KEY=AIzaSyBYv5SK3gpQnNaMF9IKu3uIx_V-y2nDLho
*/ 