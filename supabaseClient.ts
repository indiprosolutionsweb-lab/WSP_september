

// This file uses the Supabase client from a CDN script tag in index.html.
// The 'supabase' variable is available globally. We are using a feature of 
// TypeScript to declare its existence and type.
declare const supabase: any;

// --- IMPORTANT ---
// PASTE YOUR SUPABASE CREDENTIALS HERE
// You can find these in your Supabase project dashboard under Settings > API.
const supabaseUrl = 'https://xmyhyolcdrqnihwfhwvu.supabase.co'; // e.g., 'https://xyz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhteWh5b2xjZHJxbmlod2Zod3Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzY0MDUsImV4cCI6MjA3MTg1MjQwNX0.IDd8cKHhaMtbYfiriWHcB5xMBC4jQOTmiQWA9t59p1Y'; // e.g., 'ey...'

// FIX: Removed the check for placeholder credentials. Since the credentials
// have been provided, this check always evaluates to false and causes a
// TypeScript error because the types have no overlap.


export const supa = supabase.createClient(supabaseUrl, supabaseAnonKey);
