import React, { createContext, useState, useEffect, useContext } from 'react';
import supabase from '../utils/supabaseClient';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for an existing session when the component mounts
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    
    getSession();

    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Sign up function
  const signUp = async (email, password) => {
    return supabase.auth.signUp({ email, password });
  };

  // Sign in function
  const signIn = async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  // Sign out function
  const signOut = async () => {
    return supabase.auth.signOut();
  };

  const value = {
    user,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}