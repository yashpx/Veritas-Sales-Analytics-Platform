import React, { createContext, useState, useEffect, useContext } from 'react';
import supabase from '../utils/supabaseClient';
import axios from 'axios';

const AuthContext = createContext();

// Updated to use port 5000 where your backend is running
const API_URL = 'http://localhost:5000/api';

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authType, setAuthType] = useState(null); // 'supabase' or 'sales_rep'

  useEffect(() => {
    // Check for an existing session when the component mounts
    const getSession = async () => {
      try {
        // First, check for Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          setSession(session);
          setAuthType('supabase');
          setLoading(false);
          return;
        }
        
        // Then check for sales rep session in localStorage
        const salesRepToken = localStorage.getItem('sales_rep_token');
        const salesRepUser = JSON.parse(localStorage.getItem('sales_rep_user'));
        
        if (salesRepToken && salesRepUser) {
          // Make sure salesRepId is available in the user object
          // If salesRepId is missing but we know this is a sales rep,
          // we need to fetch the correct sales_rep_id from the database
          if (!salesRepUser.salesRepId && salesRepUser.id && salesRepUser.role === 'sales_rep') {
            console.warn('sales_rep_user missing salesRepId, need to query from sales_reps table');
            // We will query this in the component that needs it, as we need to use async/await
            // We'll just log a warning here
          }
          
          setUser(salesRepUser);
          setSession({ access_token: salesRepToken });
          setAuthType('sales_rep');
          console.log('Restored sales rep session with ID:', salesRepUser.salesRepId);
        }
      } catch (error) {
        console.error('Session retrieval error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getSession();

    // Listen for authentication state changes in Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Supabase auth event: ${event}`);
        if (session?.user) {
          setUser(session.user);
          setSession(session);
          setAuthType('supabase');
        } else if (event === 'SIGNED_OUT') {
          // Only clear if it was a Supabase user that signed out
          if (authType === 'supabase') {
            setUser(null);
            setSession(null);
            setAuthType(null);
          }
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [authType]);

  // Sign up function for regular users
  const signUp = async (email, password) => {
    return supabase.auth.signUp({ 
      email, 
      password 
    });
  };

  // Sign in function for regular users
  const signIn = async (email, password) => {
    return supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
  };

  // Sign in function for sales reps
  const signInSalesRep = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/sales-rep/login`, {
        email,
        password
      });
      
      const { access_token, token_type, user_data } = response.data;
      
      // After login, if we have a user_auth ID but not a sales_rep_id,
      // try to find the corresponding sales_rep_id
      let enhancedUserData = { ...user_data };
      
      console.log("Raw user_data from login:", user_data);
      
      if (!enhancedUserData.salesRepId && enhancedUserData.id && enhancedUserData.role === 'sales_rep' && email) {
        try {
          console.log("Attempting to find sales_rep_id for:", email);
          // Try to find the sales_rep_id using the email
          const { data, error } = await supabase
            .from('sales_reps')
            .select('sales_rep_id')
            .eq('Email', email)
            .single();
          
          console.log("Supabase query result:", { data, error });
            
          if (data && !error) {
            console.log("Found sales_rep_id:", data.sales_rep_id);
            enhancedUserData.salesRepId = data.sales_rep_id;
          } else {
            console.warn("No sales_rep_id found for email:", email);
            console.warn("Will try case-insensitive search as fallback");
            
            // Try case-insensitive search as fallback
            const { data: allReps, error: listError } = await supabase
              .from('sales_reps')
              .select('sales_rep_id, Email');
              
            if (!listError && allReps) {
              // Case-insensitive manual matching
              const emailLower = email.toLowerCase();
              const matchingRep = allReps.find(rep => 
                rep.Email && rep.Email.toLowerCase() === emailLower
              );
              
              if (matchingRep) {
                console.log("Found sales_rep_id through case-insensitive match:", matchingRep.sales_rep_id);
                enhancedUserData.salesRepId = matchingRep.sales_rep_id;
              } else {
                console.error("No matching sales_rep found in the database");
              }
            }
          }
        } catch (e) {
          console.error("Error fetching sales_rep_id during login:", e);
        }
      }
      
      // Store token and enhanced user data in localStorage
      localStorage.setItem('sales_rep_token', access_token);
      localStorage.setItem('sales_rep_user', JSON.stringify(enhancedUserData));
      
      // Update state
      setUser(enhancedUserData);
      setSession({ access_token });
      setAuthType('sales_rep');
      
      return { data: { ...response.data, user_data: enhancedUserData }, error: null };
    } catch (error) {
      console.error('Sales rep login error:', error);
      return { 
        data: null, 
        error: error.response?.data?.detail || 'An error occurred during login' 
      };
    }
  };

  // Sign out function
  const signOut = async () => {
    if (authType === 'supabase') {
      // Sign out from Supabase
      return supabase.auth.signOut();
    } else if (authType === 'sales_rep') {
      // Clear sales rep data
      localStorage.removeItem('sales_rep_token');
      localStorage.removeItem('sales_rep_user');
      setUser(null);
      setSession(null);
      setAuthType(null);
      return { error: null };
    }
  };

  // Reset password (only for Supabase auth)
  const resetPassword = async (email) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  };

  // Get current user profile details including role
  const getUserProfile = async () => {
    if (!user) return null;
    
    try {
      if (authType === 'supabase') {
        // For Supabase users, check user_profiles table
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        return data;
      } else if (authType === 'sales_rep') {
        // For sales reps, the role is already in the user object
        return {
          role: user.role || 'sales_rep',
          ...user
        };
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  const value = {
    user,
    session,
    loading,
    authType,
    signUp,
    signIn,
    signInSalesRep,
    signOut,
    resetPassword,
    getUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}