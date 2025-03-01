import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (user) {
      // You can fetch user-specific data from Supabase here
      const fetchUserData = async () => {
        try {
          setLoading(true);
          // This is just an example - you'd replace this with your actual data fetching
          // const { data, error } = await supabase
          //   .from('profiles')
          //   .select('*')
          //   .eq('id', user.id)
          //   .single();
          
          // if (error) throw error;
          // setUserData(data);
          
          // For now, just use the user object from auth
          setUserData(user);
        } catch (error) {
          console.error('Error fetching user data:', error.message);
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserData();
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container">
      <div className="dashboard">
        <h1>Dashboard</h1>
        <p>Welcome to your dashboard!</p>
        
        {loading ? (
          <p>Loading your data...</p>
        ) : (
          <div className="user-info">
            <h2>Your Info</h2>
            <p><strong>Email:</strong> {userData?.email}</p>
            <p><strong>ID:</strong> {userData?.id}</p>
            <p><strong>Last Sign In:</strong> {new Date(userData?.last_sign_in_at).toLocaleString()}</p>
          </div>
        )}
        
        <button onClick={handleSignOut} className="logout-btn">
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Dashboard;