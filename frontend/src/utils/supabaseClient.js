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
      const { data, error } = await supabase.from('organizations').select('organization_id').limit(1);
      console.log('Supabase test connection result:', { success: !error, error, hasData: !!data });
    } catch (e) {
      console.error('Supabase test connection failed:', e);
    }
  };
  
  // Run the test but don't wait for it
  testConnection();
  
  console.log('Supabase client initialized successfully');
} catch (err) {
  console.error('Error initializing Supabase client:', err);
  // Provide a fallback client to prevent app from crashing
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.warn('Using fallback Supabase client');
}

// Helper functions for working with organizations
export const organizationService = {
  // Get the organization information
  getOrganization: async (organizationId) => {
    if (!organizationId) return null;
    
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching organization:', error);
      return null;
    }
  },
  
  // Get all sales reps for an organization
  getSalesReps: async (organizationId) => {
    if (!organizationId) return [];
    
    try {
      const { data, error } = await supabase
        .from('sales_reps')
        .select('*')
        .eq('organization_id', organizationId)
        .order('sales_rep_last_name', { ascending: true });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sales reps:', error);
      return [];
    }
  },
  
  // Get all customers for an organization
  getCustomers: async (organizationId) => {
    if (!organizationId) return [];
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', organizationId)
        .order('customer_last_name', { ascending: true });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  },
  
  // Create a new sales rep for an organization
  createSalesRep: async (salesRepData) => {
    try {
      const { data, error } = await supabase
        .from('sales_reps')
        .insert([salesRepData])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating sales rep:', error);
      throw error;
    }
  },
  
  // Create a new customer for an organization
  createCustomer: async (customerData) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }
};

export default supabase;