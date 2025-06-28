// Demo Configuration for TribeFind
// This file contains demo credentials and settings for testing

export const DEMO_CONFIG = {
  // Supabase Demo Configuration
  SUPABASE_URL: 'https://kzwjnbmkjgjdpqgvtbtu.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6d2puYm1ramdqZHBxZ3Z0YnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5OTc0NjcsImV4cCI6MjA0ODU3MzQ2N30.hWCNUhLxJ6cMHZXLq_-Ll0VVNKCUHSLqMYqZxBaWvSA',
  
  // Google Services
  GOOGLE_PLACES_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '',
  
  // Demo User Accounts
  DEMO_USERS: [
    {
      email: 'demo1@tribefind.app',
      password: 'demo123456',
      name: 'Alex Chen',
      interests: ['Photography', 'Hiking', 'Coffee']
    },
    {
      email: 'demo2@tribefind.app', 
      password: 'demo123456',
      name: 'Sam Rivera',
      interests: ['Fitness', 'Music', 'Programming']
    }
  ]
};

// Environment Variables Template for Demo
export const ENV_TEMPLATE = `
# TribeFind Demo Environment Variables
# Copy these to your .env.local file and update with your actual keys

EXPO_PUBLIC_SUPABASE_URL=https://kzwjnbmkjgjdpqgvtbtu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6d2puYm1ramdqZHBxZ3Z0YnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5OTc0NjcsImV4cCI6MjA0ODU3MzQ2N30.hWCNUhLxJ6cMHZXLq_-Ll0VVNKCUHSLqMYqZxBaWvSA
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
`; 