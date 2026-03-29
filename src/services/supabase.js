import { createClient } from '@supabase/supabase-js';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log("URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);

// Check if credentials are properly configured
if (!supabaseUrl || !supabaseAnonKey ||
    supabaseUrl === 'https://your-project-id.supabase.co' ||
    supabaseAnonKey === 'your-anon-key-here') {
  console.error(`
╔═══════════════════════════════════════════════════════════════╗
║  ⚠️  SUPABASE CREDENTIALS NOT CONFIGURED                      ║
╚═══════════════════════════════════════════════════════════════╝


Please follow these steps:


1. Go to https://supabase.com and create a new project
2. Once created, go to Project Settings > API
3. Copy your Project URL and anon/public key
4. Open the .env file in your project root
5. Replace the placeholder values with your actual credentials:


   VITE_SUPABASE_URL=your-actual-project-url
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key


6. Restart the development server (stop and run 'npm run dev' again)


For detailed instructions, see SETUP.md
  `);
}


// Use dummy values for development if credentials are not set
const url = (supabaseUrl && supabaseUrl !== 'https://your-project-id.supabase.co')
  ? supabaseUrl
  : 'https://placeholder.supabase.co';
const key = (supabaseAnonKey && supabaseAnonKey !== 'your-anon-key-here')
  ? supabaseAnonKey
  : 'placeholder-key';


export const supabase = createClient(url, key);

// Helper to detect aborted requests coming from fetch / AbortController
export const isAbortError = (err) => {
  if (!err) return false;
  if (err.name === 'AbortError') return true;
  const msg = String(err.message || err);
  return /signal is aborted/i.test(msg) || /aborted/i.test(msg);
};



