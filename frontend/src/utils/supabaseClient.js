import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://coghrwmmyyzmbnndlawi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NjAyMzIsImV4cCI6MjA1MjQzNjIzMn0.TqSt8BDML0yLvcJWIG-2bcF6PieMqAep3b_VTAkpHDs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;