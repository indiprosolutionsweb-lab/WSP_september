
import { supa } from './supabaseClient.ts';
import { mockSupa } from './localStorageClient.ts';

// --- PRODUCTION MODE SWITCH ---
// Set to 'true' to use localStorage for offline development.
// Set to 'false' to connect to the live Supabase database for production.
export const DEV_MODE = false;

// The apiClient will be either the real Supabase client or the mock client
// depending on the DEV_MODE flag. All components will use this client.
export const apiClient = DEV_MODE ? mockSupa : supa;
