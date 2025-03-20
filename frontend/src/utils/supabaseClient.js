import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise use hardcoded values
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://coghrwmmyyzmbnndlawi.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4OTcyMjUsImV4cCI6MjA1NjQ3MzIyNX0.WLm0l2UeFPiPNxyClnM4bQpxw4TcYFxleTdc7K0G6AM';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

// Additional logging to debug connection issues
console.log('Creating Supabase client with:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0 // Don't log the full key for security
});

let supabase;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
  
  // Test the connection with a simple query
  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('call_logs').select('call_id').limit(1);
      console.log('Supabase test connection result:', { success: !error, error, hasData: !!data });
    } catch (e) {
      console.error('Supabase test connection failed:', e);
    }
  };
  
  // Run the test but don't wait for it
  testConnection();
  
  // Add a SQL function for inserting call logs if it doesn't exist
  const createInsertCallLogFunction = async () => {
    try {
      const { error } = await supabase.rpc('insert_call_log', {
        sales_rep_id: 1,
        customer_id: 1,
        duration_mins: 1,
        outcome: 'In-progress'
      });
      
      // If the function exists, no need to create it
      if (!error || !error.message.includes('does not exist')) {
        console.log('insert_call_log function already exists');
        return;
      }
      
      // Create the function using raw SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION public.insert_call_log(
            sales_rep_id integer,
            customer_id integer,
            duration_mins integer,
            outcome text DEFAULT 'In-progress'::text
          )
          RETURNS jsonb
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $function$
          DECLARE
            new_id integer;
            result jsonb;
          BEGIN
            -- Insert the record
            INSERT INTO public.call_logs(
              sales_rep_id, 
              customer_id, 
              call_date, 
              duration_minutes, 
              call_outcome
            )
            VALUES(
              sales_rep_id,
              customer_id,
              now(),
              GREATEST(duration_mins, 1),
              outcome
            )
            RETURNING call_id INTO new_id;
            
            -- Return the result
            result := jsonb_build_object(
              'success', true,
              'call_id', new_id
            );
            
            RETURN result;
          EXCEPTION WHEN OTHERS THEN
            result := jsonb_build_object(
              'success', false,
              'error', SQLERRM
            );
            RETURN result;
          END;
          $function$;
          
          -- Grant public access to the function
          GRANT EXECUTE ON FUNCTION public.insert_call_log TO public;
        `
      });
      
      if (createError) {
        console.error('Failed to create insert_call_log function:', createError);
      } else {
        console.log('Created insert_call_log function successfully');
      }
    } catch (err) {
      console.error('Error checking/creating call log function:', err);
    }
  };
  
  // Don't wait for this to complete
  createInsertCallLogFunction();
  
  console.log('Supabase client initialized successfully');
} catch (err) {
  console.error('Error initializing Supabase client:', err);
  // Provide a fallback client to prevent app from crashing
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.warn('Using fallback Supabase client');
}

export default supabase;