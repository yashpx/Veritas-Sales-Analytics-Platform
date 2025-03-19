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
          setUser(salesRepUser);
          setSession({ access_token: salesRepToken });
          setAuthType('sales_rep');
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
      
      // Store token and user data in localStorage
      localStorage.setItem('sales_rep_token', access_token);
      localStorage.setItem('sales_rep_user', JSON.stringify(user_data));
      
      // Update state
      setUser(user_data);
      setSession({ access_token });
      setAuthType('sales_rep');
      
      return { data: response.data, error: null };
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