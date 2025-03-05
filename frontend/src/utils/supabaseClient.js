import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise use hardcoded values
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://coghrwmmyyzmbnndlawi.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4OTcyMjUsImV4cCI6MjA1NjQ3MzIyNX0.WLm0l2UeFPiPNxyClnM4bQpxw4TcYFxleTdc7K0G6AM';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase client initialized with URL:', supabaseUrl);

export default supabase;