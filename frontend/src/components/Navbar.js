import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../utils/supabaseClient';

const Navbar = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    // Check for an existing session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    checkUser();

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <span style={{ color: '#7e22ce', fontWeight: 'bold' }}>Supabase</span> Auth Demo
        </Link>
        <div className="navbar-links">
          {user ? (
            <>
              <span className="welcome-text">
                Welcome, <span style={{ color: '#7e22ce', fontWeight: 'bold' }}>{user.email}</span>
              </span>
              <Link to="/dashboard" style={{ color: '#7e22ce' }}>Dashboard</Link>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: '#7e22ce' }}>Login</Link>
              <Link to="/register" style={{ color: '#7e22ce' }}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;