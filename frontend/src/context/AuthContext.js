import React, { createContext, useState, useEffect, useContext } from 'react';
import supabase from '../utils/supabaseClient';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the user profile data from user_profiles table
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check for an existing session when the component mounts
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        setSession(session);
        
        // If session exists, fetch the user profile
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Session retrieval error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getSession();

    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth event: ${event}`);
        setUser(session?.user || null);
        setSession(session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        } else if (event === 'SIGNED_OUT') {
          setUserProfile(null);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Sign up function for managers (creates an organization)
  const signUpManager = async (email, password, firstName, lastName, orgName) => {
    try {
      // Use the backend API endpoint for registration
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role: 'manager',
          first_name: firstName,
          last_name: lastName,
          // No organization_id - will create a new one
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to register');
      }
      
      // Sign in after successful registration
      return signIn(email, password);
    } catch (error) {
      console.error('Sign up manager error:', error);
      throw error;
    }
  };
  
  // Sign up function for sales reps (requires organization ID)
  const signUpSalesRep = async (email, password, firstName, lastName, organizationId) => {
    try {
      // Use the backend API endpoint for registration
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role: 'sales_rep',
          first_name: firstName,
          last_name: lastName,
          organization_id: organizationId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to register');
      }
      
      // Sign in after successful registration
      return signIn(email, password);
    } catch (error) {
      console.error('Sign up sales rep error:', error);
      throw error;
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      // Fetch user profile after sign in
      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        setUserProfile(profile);
      }
      
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUserProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  };
  
  // Check if user has a specific role
  const hasRole = (role) => {
    return userProfile?.role === role;
  };
  
  // Check if user is a manager
  const isManager = () => {
    return userProfile?.role === 'manager';
  };
  
  // Check if user is a sales rep
  const isSalesRep = () => {
    return userProfile?.role === 'sales_rep';
  };
  
  // Get user's organization ID
  const getOrganizationId = () => {
    return userProfile?.organization_id || null;
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    signIn,
    signOut,
    resetPassword,
    signUpManager,
    signUpSalesRep,
    hasRole,
    isManager,
    isSalesRep,
    getOrganizationId
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}